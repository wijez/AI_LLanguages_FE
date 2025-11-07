import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../api/api";
import sfxCorrect from "../../assets/bell-chord1-83260.mp3";
import sfxWrong from "../../assets/ui-sounds-pack-2-sound-8-358892.mp3";

import { normalizeSkill } from "../../lib/lesson/normalizeSkill";
import { useSpeechRecorder } from "../../lib/audio/useSpeechRecorder";

// NEW: import các renderer tách file
import {
  LANG_BCP,
  speakText,
  renderQuiz,
  renderMatching,
  renderListening,
  renderReadingAssemble,
  renderOrdering,
  renderPron,
  renderSpeaking,
} from "../../lib/lesson/StepViews";

// ======================= Type meta =======================
const TYPE_META = {
  listening: { icon: "🎧", label: "Listening" },
  speaking: { icon: "🗣️", label: "Speaking" },
  reading: { icon: "📖", label: "Reading" },
  writing: { icon: "✍️", label: "Writing" },
  matching: { icon: "🧩", label: "Matching" },
  fillgap: { icon: "🧠", label: "Fill gap" },
  ordering: { icon: "🔀", label: "Ordering" },
  quiz: { icon: "❓", label: "Quiz" },
  pron: { icon: "🔉", label: "Pronunciation" },
};

// ======================= Utils =======================
function canon(s) {
  return String(s ?? "")
    .trim()
    .toLowerCase();
}
function expectedToText(step) {
  if (step.type === "ordering" && Array.isArray(step.answer))
    return step.answer.join(" ");
  if (Array.isArray(step.answer)) return step.answer[0] ?? "";
  return step.answer ?? "";
}
function checkStepCorrect(step, userAns) {
  if (step.type === "ordering" && Array.isArray(step.answer)) {
    return canon(step.answer.join(" ")) === canon(userAns);
  }
  if (step.type === "matching") return canon(step.answer) === canon(userAns);
  if (Array.isArray(step.answer))
    return step.answer.map(canon).includes(canon(userAns));
  return canon(step.answer) === canon(userAns);
}
function mapSource(type) {
  switch (type) {
    case "pron":
      return "pronunciation";
    case "listening":
      return "listening";
    case "matching":
      return "vocab";
    default:
      return "grammar";
  }
}

// ======================= Component =======================
export default function LessonSession() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [canceling, setCanceling] = useState(false);
  const [sess, setSess] = useState(null);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Runner state
  const [idx, setIdx] = useState(0);
  const [pickedId, setPickedId] = useState(null); // quiz
  const [picked, setPicked] = useState(null); // matching
  const [typed, setTyped] = useState(""); // text / transcript
  const [ordered, setOrdered] = useState([]); // tokens
  const [state, setState] = useState("idle");
  const [lastResult, setLastResult] = useState(null); // {ok, user, expected}
  const [hearts, setHearts] = useState(3);
  const [doneReason, setDoneReason] = useState(null); // 'finished' | 'exhausted'
  const [hintLevel, setHintLevel] = useState(0);

  // Reset khi đổi câu
  useEffect(() => {
    setPickedId(null);
    setPicked(null);
    setTyped("");
    setOrdered([]);
    setHintLevel(0);
  }, [idx]);

  // SFX
  const [soundOn, setSoundOn] = useState(() => {
    try {
      return typeof window !== "undefined" &&
        localStorage.getItem("lesson_sound") === "off"
        ? false
        : true;
    } catch {
      return true;
    }
  });
  const okAudioRef = useRef(null);
  const ngAudioRef = useRef(null);
  useEffect(() => {
    try {
      okAudioRef.current = new Audio(sfxCorrect);
      okAudioRef.current.preload = "auto";
      ngAudioRef.current = new Audio(sfxWrong);
      ngAudioRef.current.preload = "auto";
    } catch (e) {
      console.warn("Audio initialization error:", e);
    }
  }, []);
  const toggleSound = () =>
    setSoundOn((v) => {
      const nv = !v;
      try {
        localStorage.setItem("lesson_sound", nv ? "on" : "off");
      } catch (e) {
        console.warn("toggleSound error:", e);
      }
      return nv;
    });
  const playSfx = useCallback((kind) => {
    if (!soundOn) return;
    try {
      const el = kind === "ok" ? okAudioRef.current : ngAudioRef.current;
      if (!el) return;
      el.currentTime = 0;
      const node = el.cloneNode();
      node.volume = el.volume;
      node.play().catch(() => {});
    } catch (e)  {
      console.warn("playSfx error:", e);
    }
  }, [soundOn]); 

  // Mistakes panel
  const [latestMistake, setLatestMistake] = useState(null);
  const [showMistakes, setShowMistakes] = useState(false);
  const [mistakes, setMistakes] = useState([]);

  // Load session + all skills
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const s = await api.LearningSessions.get(id);
        if (cancelled) return;
        setSess(s);

        let arr = Array.isArray(s?.skills) ? s.skills : null;
        if (!arr || arr.length === 0) {
          let res;
          if (api.Skills?.byLesson)
            res = await api.Skills.byLesson({
              lesson: s.lesson,
              page_size: 200,
            });
          else if (api.Lessons?.skills)
            res = await api.Lessons.skills(s.lesson, { page_size: 200 });
          else
            res = await api.Skills.list({ lesson: s.lesson, page_size: 200 });
          arr = Array.isArray(res?.results)
            ? res.results
            : Array.isArray(res)
            ? res
            : [];
        }

        if (cancelled) return;
        setSkills(arr);
        setIdx(0);
        setPicked(null);
        setTyped("");
        setOrdered([]);
        setState("idle");
        setLastResult(null);
        setLatestMistake(null);
        setHearts(3);
      } catch (e) {
        if (!cancelled) setErr(e?.message || "Load session/skills failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Build steps
  const steps = useMemo(() => {
    const arr = [];
    for (const sk of skills) for (const x of normalizeSkill(sk)) arr.push(x);
    return arr;
  }, [skills]);

  const total = steps.length;
  const step = steps[idx];
  const currentSkill = step?.__skill || null;
  const meta = TYPE_META[currentSkill?.type] || {
    icon: "⭐",
    label: currentSkill?.type || "",
  };
  const pct = total
    ? Math.min(
        100,
        Math.round(((state === "done" ? total : idx) / total) * 100)
      )
    : 0;

  // Recorder cho pron/speaking
  const langHint = LANG_BCP(currentSkill?.language_code || "en");
  const { startRecord, stopRecord, isRecording, isProcessing } =
    useSpeechRecorder({
      languageCode: currentSkill?.language_code || "en",
      onTranscript: (txt) => setTyped(txt || ""),
    });

  // ---------- Actions ----------
  const onCheck = async () => {
    if (!sess || !step || !currentSkill) return;

    let userAns = "";
    let extra = {};

    if (step.type === "quiz") {
      const chosen = (step.choices || []).find((x) => x.id === pickedId);
      userAns = chosen?.text || "";
      if (chosen?.id) extra.choice_id = chosen.id; // gửi cho BE chấm theo id
    } else if (step.type === "matching") {
      userAns = picked || "";
    } else if (step.tokens) {
      userAns = (ordered || []).join(" ");
    } else {
      userAns = typed || "";
    }

    const expectedLocal = expectedToText(step);
    const okLocal =
      step.type === "quiz"
        ? false // luôn để server chấm
        : step.type === "matching"
        ? checkStepCorrect(step, userAns)
        : checkStepCorrect(step, userAns);

    const payload = {
      skill: currentSkill.id,
      question_id: String(step.id),
      user_answer: String(userAns ?? ""),
      source: mapSource(currentSkill.type),
      ...extra,
    };

    let okFromServer,
      expectedFromServer,
      sessionFromServer = null;
    try {
      const resp = await api.LearningSessions.answer(sess.id, payload);
      sessionFromServer = resp?.session ?? null;
      if (typeof resp?.correct === "boolean") okFromServer = resp.correct;
      if (typeof resp?.expected === "string")
        expectedFromServer = resp.expected;
      // nếu server nói false nhưng text khớp expected → hiển thị OK để tránh ức chế UI
      if (expectedFromServer && okFromServer === false) {
        const looksOk = canon(expectedFromServer) === canon(userAns);
        if (looksOk) okFromServer = true;
      }
    } catch (e) {
      console.warn("[answer] error:", e);
    }

    const ok = typeof okFromServer === "boolean" ? okFromServer : okLocal;
    const expected = expectedFromServer ?? expectedLocal ?? "";
    if (sessionFromServer) setSess(sessionFromServer);

    setLastResult({ ok, user: userAns, expected });
    setState("checked");

    if (!ok) {
      setHearts((prev) => Math.max(0, prev - 1));
      try {
        let res;
        if (api.Mistakes?.bySkill)
          res = await api.Mistakes.bySkill(currentSkill.id, { page_size: 1 });
        else if (api.Mistakes?.list)
          res = await api.Mistakes.list({
            skill: currentSkill.id,
            ordering: "-timestamp",
            page_size: 1,
          });
        const items = Array.isArray(res?.results)
          ? res.results
          : Array.isArray(res)
          ? res
          : [];
        setLatestMistake(items[0] || null);
      } catch (e) {
        console.warn("[mistake fetch] error:", e);
      }
    }
  };

  useEffect(() => {
    if (state === "checked" && lastResult) playSfx(lastResult.ok ? "ok" : "ng");
  }, [state, lastResult, playSfx]);

  const onNext = () => {
    if (idx + 1 >= total) {
      setDoneReason("finished");
      setState("done");
      return;
    }
    setIdx((i) => i + 1);
    setPicked(null);
    setPickedId(null);
    setTyped("");
    setOrdered([]);
    setLastResult(null);
    setLatestMistake(null);
    setState("idle");
    setHintLevel(0);
  };

  const onSkip = () => onNext();

  const onCancel = async () => {
    if (!sess?.id) return navigate("/learn");
    try {
      setCanceling(true);
      await api.LearningSessions.cancel(sess.id, {
        as_failed: false,
        reason: "User hit close (X)",
      });
    } catch (e) {
      console.warn("[cancel] error:", e);
    } finally {
      navigate("/learn");
    }
  };

  useEffect(() => {
    if (hearts <= 0) {
      setState("done");
      setDoneReason("exhausted");
    }
  }, [hearts]);

  const onFinishSession = async () => {
    if (!sess?.id) return navigate("/learn");
    try {
      if (doneReason === "exhausted")
        await api.LearningSessions.cancel(sess.id, {
          as_failed: true,
          reason: "Out of hearts (user finish)",
        });
      else await api.LearningSessions.complete(sess.id, {});
    } catch (e) {
      console.warn("[finish] error:", e);
    } finally {
      navigate("/learn");
    }
  };

  const onRestartLesson = async () => {
    if (!sess) return;
    try {
      setCanceling(true);
      const lessonId =
        typeof sess.lesson === "object" ? sess.lesson?.id : sess.lesson;
      const pickSession = (r) => r?.session || r?.data?.session || r?.data || r;

      try {
        await api.LearningSessions.cancel(sess.id, {
          as_failed: doneReason === "exhausted",
          reason: "Restart lesson (user action)",
        });
      } catch (e) {
        console.warn(
          "[restart] cancel current failed:",
          e?.response?.data || e
        );
      }

      let raw = null;
      try {
        if (!api.LearningSessions?.start) throw new Error("no_start_method");
        raw = await api.LearningSessions.start({ lesson: lessonId });
      } catch (e) {
        console.warn("[restart] start failed:", e?.response?.data || e);
        if (api.LearningSessions?.create)
          raw = await api.LearningSessions.create({ lesson: lessonId });
        else if (api.LearningSessions?.new)
          raw = await api.LearningSessions.new({ lesson: lessonId });
      }

      const started = pickSession(raw);
      if (!started || !started.id)
        throw new Error("Start session failed: invalid payload");
      navigate(`/learn/session/${started.id}`, { replace: true });
    } catch (e) {
      console.warn("[restart lesson] error:", e?.response?.data || e);
      alert("Không thể khởi động lại session. Vui lòng thử lại.");
    } finally {
      setCanceling(false);
    }
  };

  const fetchAllMistakes = async () => {
    if (!currentSkill) return;
    try {
      let res;
      if (api.Mistakes?.bySkill)
        res = await api.Mistakes.bySkill(currentSkill.id, { page_size: 50 });
      else if (api.Mistakes?.list)
        res = await api.Mistakes.list({
          skill: currentSkill.id,
          ordering: "-timestamp",
          page_size: 50,
        });
      const items = Array.isArray(res?.results)
        ? res.results
        : Array.isArray(res)
        ? res
        : [];
      setMistakes(items);
      setShowMistakes(true);
    } catch (e) {
      console.warn("[mistakes list] error:", e);
    }
  };

  // ======================= UI =======================
  if (loading) return <div className="p-6">Đang tải phiên học…</div>;
  if (err) return <div className="p-6 text-rose-600">Lỗi: {err}</div>;
  if (!sess) return null;

  const readingPassage =
    step?.type === "reading"
      ? currentSkill?.reading_content?.passage || ""
      : "";
  const totalSkills = skills.length;

  const canCheck =
    step?.type === "quiz"
      ? !!pickedId
      : step?.type === "matching"
      ? !!picked
      : step?.type === "ordering" || step?.type === "reading"
      ? ordered.length > 0
      : step?.type === "speaking" || step?.type === "pron"
      ? !!typed.trim()
      : !!typed.trim();

  return (
    <div
      key={sess?.id || "lesson-runner"}
      className="min-h-screen w-full bg-white"
    >
      {/* Top bar */}
      <div className="mx-auto max-w-4xl px-4 pt-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onCancel}
            aria-label="Đóng"
            disabled={canceling}
            className="text-slate-400 hover:text-slate-600 text-xl disabled:opacity-50"
          >
            ×
          </button>
          <div className="flex-1 mx-4">
            <div className="h-3 w-full rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full bg-emerald-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="mt-1 text-xs text-slate-500 text-center">
              Lesson có <b>{totalSkills}</b> kỹ năng · <b>{total}</b> câu hỏi
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSound}
              className="rounded-md border border-slate-300 px-2.5 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
              aria-label={soundOn ? "Tắt âm thanh" : "Bật âm thanh"}
              title={soundOn ? "Tắt âm thanh" : "Bật âm thanh"}
            >
              {soundOn ? "🔊" : "🔇"}
            </button>
            <div className="flex items-center gap-1 text-rose-500">
              <span className="text-lg">❤️</span>
              <span className="font-semibold">{hearts}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-3xl px-6 py-10">
        {step && state !== "done" && (
          <div className="rounded-2xl border border-slate-200 p-6">
            <div className="mb-2 text-slate-400 text-sm text-center">
              {meta.label} · {currentSkill?.title || "(Kỹ năng)"}
            </div>
            <h2 className="text-2xl font-bold text-center mb-4">
              Câu {idx + 1} / {total}
            </h2>

            {/* Reading passage (legacy show) */}
            {!!readingPassage && step.type !== "reading" && (
              <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm text-slate-500 mb-1">Đoạn văn</div>
                <div className="whitespace-pre-wrap">{readingPassage}</div>
              </div>
            )}

            {/* type-specific (dùng renderers) */}
            {step.type === "quiz" &&
              renderQuiz(step.question, step.choices, pickedId, setPickedId)}
            {step.type === "matching" &&
              renderMatching(step.question, step.choices, picked, setPicked)}
            {step.type === "listening" &&
              renderListening(step, typed, setTyped, langHint)}
            {step.type === "ordering" &&
              renderOrdering(step, ordered, setOrdered)}
            {step.type === "reading" &&
              renderReadingAssemble(
                step,
                readingPassage,
                ordered,
                setOrdered,
                hintLevel,
                setHintLevel,
                langHint
              )}

            {step.type === "writing" && (
              <>
                <div className="text-2xl font-bold text-slate-800 text-center">
                  {step.question}
                </div>
                {/* có thể đổi sang Textarea từ StepViews nếu muốn */}
                {/* <Textarea .../> */}
                <div className="mx-auto mt-6 max-w-xl">
                  <label className="block text-sm text-slate-500 mb-2">
                    Viết câu trả lời của bạn
                  </label>
                  <textarea
                    value={typed}
                    onChange={(e) => setTyped(e.target.value)}
                    rows={5}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-400/40"
                  />
                </div>
              </>
            )}

            {step.type === "fillgap" && (
              <>
                <div className="text-2xl font-bold text-slate-800 text-center">
                  {step.question}
                </div>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <button
                    onClick={() => speakText(step.answer, langHint)}
                    className="rounded-lg border px-3 py-2 hover:bg-slate-50"
                  >
                    🔊 Nghe từ gợi ý
                  </button>
                </div>
                <div className="mx-auto mt-6 max-w-xl">
                  <label className="block text-sm text-slate-500 mb-2">
                    Điền từ đúng vào chỗ trống
                  </label>
                  <input
                    value={typed}
                    onChange={(e) => setTyped(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-400/40"
                  />
                </div>
              </>
            )}

            {step.type === "pron" &&
              renderPron(
                step,
                typed,
                setTyped,
                isRecording,
                isProcessing,
                startRecord,
                stopRecord,
                langHint
              )}
            {step.type === "speaking" &&
              renderSpeaking(
                step,
                typed,
                setTyped,
                isRecording,
                isProcessing,
                startRecord,
                stopRecord,
                langHint
              )}

            {/* Actions */}
            <div className="mt-10 flex items-center justify-between">
              <button
                onClick={onSkip}
                className="px-5 py-3 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50"
              >
                Bỏ qua
              </button>
              {state === "checked" ? (
                <button
                  onClick={onNext}
                  className="px-6 py-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  Tiếp tục
                </button>
              ) : (
                <button
                  onClick={onCheck}
                  className="px-6 py-3 rounded-xl bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-40"
                  disabled={!canCheck}
                >
                  Kiểm tra
                </button>
              )}
            </div>

            {/* Feedback */}
            {state === "checked" && lastResult && (
              <div
                className={[
                  "mt-4 rounded-xl border p-4",
                  lastResult.ok
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-rose-200 bg-rose-50 text-rose-700",
                ].join(" ")}
              >
                {lastResult.ok ? (
                  <div>
                    <b>Đúng rồi!</b> Tiếp tục nhé.
                  </div>
                ) : (
                  <div>
                    <b>Chưa chính xác.</b>{" "}
                    {lastResult.expected && (
                      <>
                        Đáp án đúng:{" "}
                        <span className="font-semibold">
                          {lastResult.expected}
                        </span>
                      </>
                    )}
                    {latestMistake && (
                      <div className="mt-2 text-xs text-slate-600">
                        Đã lưu vào ôn tập (Mistake #{latestMistake.id}).
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Out of hearts */}
            {hearts === 0 && (
              <div className="mt-6 rounded-xl bg-rose-50 border border-rose-200 p-4 text-rose-700">
                Bạn đã hết tim. Hãy thử lại hoặc tiếp tục câu khác.
              </div>
            )}

            {/* Mistakes panel */}
            {currentSkill && (
              <div className="mt-8">
                <button
                  onClick={fetchAllMistakes}
                  className="text-sm text-slate-600 underline"
                >
                  Xem Mistake của kỹ năng này
                </button>
                {showMistakes && (
                  <div className="mt-3 rounded-xl border border-slate-200">
                    <div className="border-b px-4 py-2 text-sm font-semibold">
                      Mistakes cho: {currentSkill.title}
                    </div>
                    <div className="divide-y">
                      {mistakes.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-slate-500">
                          Không có Mistake.
                        </div>
                      ) : (
                        mistakes.map((m) => (
                          <div key={m.id} className="px-4 py-3 text-sm">
                            <div className="text-slate-800">
                              <b>Prompt:</b> {m.prompt || "(n/a)"}
                            </div>
                            <div className="text-slate-600">
                              <b>Expected:</b> {m.expected || "(n/a)"}{" "}
                              &nbsp;|&nbsp; <b>Answer:</b>{" "}
                              {m.user_answer || "(n/a)"}
                            </div>
                            <div className="text-[12px] text-slate-400">
                              #{m.id} · {m.source}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Done lesson */}
        {state === "done" && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
            <div className="text-3xl">🎉</div>
            <h3 className="mt-2 text-xl font-semibold">
              {doneReason === "exhausted"
                ? "Bạn đã hết tim"
                : "Bạn đã hoàn thành lesson!"}
            </h3>
            <div className="mt-1 text-sm text-slate-600">
              {doneReason === "exhausted"
                ? "Chọn “Luyện lại lesson” để bắt đầu session mới, hoặc “Hoàn tất” để kết thúc session hiện tại."
                : "Bạn có thể luyện lại lesson (tạo session mới) hoặc hoàn tất để ghi nhận và quay về."}
            </div>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={onRestartLesson}
                className="px-5 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-white"
                disabled={canceling}
              >
                Luyện lại lesson
              </button>
              <button
                onClick={onFinishSession}
                className="px-6 py-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                disabled={canceling}
              >
                Hoàn tất Lesson
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
