import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Mic,
  Square,
  Play,
  Volume2,
  ChevronLeft,
  ChevronRight,
  Award,
  Activity,
  Loader2,
  Info,
  Sparkles,
  ListFilter,
} from "lucide-react";
import { api } from "../../api/api";

// ===== Helpers =====
const clsx = (...xs) => xs.filter(Boolean).join(" ");
const ms = (n) => (n < 10 ? `0${n}` : `${n}`);
const fmtDuration = (secs) =>
  `${ms(Math.floor(secs / 60))}:${ms(Math.floor(secs % 60))}`;
const getQuery = (k) =>
  typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get(k)
    : null;
const parseJSON = (s) => {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
};

// Đọc `learn` (L2) từ localStorage: có thể là string code, hoặc object có abbreviation/code...
function readLearn() {
  if (typeof window === "undefined") return { lang: null, enrollmentId: null };
  const raw = localStorage.getItem("learn");
  if (!raw) return { lang: null, enrollmentId: null };

  const obj = parseJSON(raw);
  if (obj && typeof obj === "object") {
    const lang =
      obj?.language?.abbreviation ||
      obj?.language?.code ||
      obj?.language_code ||
      obj?.abbreviation ||
      obj?.code ||
      (typeof obj?.language === "string" ? obj.language : null) ||
      null;

    const enrollmentId =
      obj?.enrollment_id || obj?.id || obj?.enrollment?.id || null;

    return { lang, enrollmentId };
  }
  return { lang: raw.toString().trim() || null, enrollmentId: null };
}

// Lấy câu chuẩn (answer) để đọc/chấm: ưu tiên expected_text/answer
function getExpectedText(p) {
  const cands = [p?.expected_text, p?.answer, p?.text, p?.phrase, p?.word];
  const s = cands.find((x) => typeof x === "string" && x.trim());
  return s ? s.trim() : "";
}

// Chuyển Blob -> base64 (không kèm "data:*;base64,")
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onloadend = () => {
      const res = typeof r.result === "string" ? r.result : "";
      const base64 = res.includes(",") ? res.split(",")[1] : res;
      resolve(base64);
    };
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

// Centralize endpoints cho view
const ENDPOINTS = {
  listPronSkillsByLanguage: (code) =>
    `/skills/?type=pron&language=${encodeURIComponent(code)}&limit=50`,
  listPronSkills: () => `/skills/?type=pron&limit=50`,
  promptsLegacy: (skillId) => `/pronunciation-prompts/?skill=${skillId}`,
  skillQuestions: (skillId) => `/skills/${skillId}/questions/`,
  // (đã chuyển sang api.SkillSessions.* cho start/complete/attempts)
};

function useRecorder({ mimeType = "audio/webm" } = {}) {
  const [recording, setRecording] = useState(false);
  const [permission, setPermission] = useState(null);
  const [blob, setBlob] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const mediaRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRef.current && mediaRef.current.state !== "inactive")
        mediaRef.current.stop();
    };
  }, []);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setPermission(true);
      const rec = new MediaRecorder(stream, { mimeType });
      const chunks = [];
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.onstop = () => setBlob(new Blob(chunks, { type: mimeType }));
      rec.start();
      mediaRef.current = rec;
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
      setRecording(true);
    } catch (e) {
      console.warn("Mic error:", e);
      setPermission(false);
    }
  };

  const stop = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRef.current && mediaRef.current.state !== "inactive")
      mediaRef.current.stop();
    setRecording(false);
  };

  const reset = () => setBlob(null);

  return { recording, permission, blob, elapsed, start, stop, reset };
}

function ScoreBadge({ score }) {
  const color =
    score >= 90
      ? "bg-emerald-500"
      : score >= 75
      ? "bg-sky-500"
      : score >= 60
      ? "bg-amber-500"
      : "bg-rose-500";
  return (
    <div
      className={clsx(
        "inline-flex items-center px-2 py-1 rounded-full text-white text-xs font-semibold",
        color
      )}
    >
      <Award className="w-3.5 h-3.5 mr-1" /> {Math.round(score)}
    </div>
  );
}

function StatChip({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 bg-white/60">
      <Icon className="w-4 h-4 text-gray-500" />
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function ProgressBar({ value }) {
  const v = Math.max(0, Math.min(100, Math.round(value ?? 0)));
  const bar =
    v >= 90
      ? "bg-emerald-500"
      : v >= 75
      ? "bg-sky-500"
      : v >= 60
      ? "bg-amber-500"
      : "bg-rose-500";
  return (
    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className={clsx("h-2", bar)} style={{ width: `${v}%` }} />
    </div>
  );
}

export default function Speech({
  languageCode: propLang,
  enrollmentId: propEnrollId,
  skillId: propSkillId,
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ===== Separate UI lang (L1) vs Learning lang (L2) =====
  const [uiLang, setUiLang] = useState(null); // from localStorage.lang
  const [learnLang, setLearnLang] = useState(null); // from localStorage.learn (or props)
  const [ctxEnrollId, setCtxEnrollId] = useState(null); // enrollment_id

  // Data
  const [skills, setSkills] = useState([]);
  const [selectedSkillId, setSelectedSkillId] = useState(null);
  const selectedSkill = useMemo(
    () => skills.find((s) => String(s.id) === String(selectedSkillId)) || null,
    [skills, selectedSkillId]
  );

  const [prompts, setPrompts] = useState([]);
  const [idx, setIdx] = useState(0);

  const [session, setSession] = useState(null); // {id, skill_session, started_at}
  const [history, setHistory] = useState([]);
  const [xpTotal, setXpTotal] = useState(0);

  const [submitting, setSubmitting] = useState(false);

  const audioRef = useRef(null);
  const ttsUrlRef = useRef(null); // revoke để tránh leak
  const initialSkillFromQuery = getQuery("skill");

  const { recording, permission, blob, elapsed, start, stop, reset } =
    useRecorder();
  const current = prompts[idx] || null;

  // ===== Resolve L1 (UI) & L2 (Learning) + enrollment_id (ONLY from localStorage.learn) =====
  useEffect(() => {
    (async () => {
      // L1 = ngôn ngữ giao diện
      let L1 =
        (typeof window !== "undefined" && localStorage.getItem("lang")) || null;

      // L2 + enrollment từ learn
      const { lang: L2raw, enrollmentId: eidFromLearn } = readLearn();
      let L2 = (L2raw || "").trim();
      let eid = eidFromLearn ? String(eidFromLearn) : null;

      // Nếu chưa có enrollment_id trong learn => resolve theo abbreviation L2
      if (!eid && L2) {
        try {
          let data =
            (await api.Enrollments.findByAbbr(L2)) ||
            (await api.Enrollments.findByLangCode(L2)) ||
            (await api.Enrollments.findByCodeAlias(L2));
          const first =
            (data && data.results && data.results[0]) ||
            (Array.isArray(data) ? data[0] : data);
          if (first?.id) eid = String(first.id);
        } catch {
          /* ignore */
        }
      }

      if (!L1) L1 = "en"; // fallback giao diện
      if (!L2) L2 = "en"; // fallback học (nếu learn trống)

      if (typeof window !== "undefined" && eid) {
        localStorage.setItem("enrollment_id", String(eid));
      }

      setUiLang(L1);
      setLearnLang(L2);
      setCtxEnrollId(eid || null);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tự cập nhật khi user đổi lang/learn ở tab khác hoặc runtime
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "lang" || e.key === "learn") {
        const L1 = localStorage.getItem("lang") || "en";
        const { lang: L2raw, enrollmentId } = readLearn();
        const L2 = (L2raw || "en").trim();
        setUiLang(L1);
        setLearnLang(L2);
        setCtxEnrollId(enrollmentId ? String(enrollmentId) : null);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // ===== Load PRON skills (by L2 from localStorage.learn) =====
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        let list = [];
        if (learnLang) {
          try {
            const sres = await api.get(
              ENDPOINTS.listPronSkillsByLanguage(learnLang)
            );
            list = sres?.results || sres || [];
          } catch {
            const sres = await api.get(ENDPOINTS.listPronSkills());
            list = sres?.results || sres || [];
          }
        } else {
          const sres = await api.get(ENDPOINTS.listPronSkills());
          list = sres?.results || sres || [];
        }

        setSkills(list);
        const fromQuery = initialSkillFromQuery
          ? String(initialSkillFromQuery)
          : null;
        const preferred = fromQuery || (list[0] ? String(list[0].id) : null);
        setSelectedSkillId(preferred);
        if (preferred && typeof window !== "undefined")
          localStorage.setItem("pron_skill_id", preferred);
      } catch (e) {
        console.warn(e);
        setError(
          e?.response?.data?.detail || e.message || "Lỗi tải danh sách kỹ năng"
        );
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [learnLang]);

  // ===== Load prompts when skill changes =====
  useEffect(() => {
    (async () => {
      if (!selectedSkillId) return;
      setLoading(true);
      setError("");
      try {
        let list = [];
        try {
          const qres = await api.Skills.questions(selectedSkillId);
          list = qres?.pronunciation_prompts || [];
        } catch {
          const pres = await api.get(ENDPOINTS.promptsLegacy(selectedSkillId));
          list = pres?.results || pres || [];
        }
        setPrompts(list);
        setIdx(0);
      } catch (e) {
        console.warn(e);
        setPrompts([]);
        setError(
          e?.response?.data?.detail || e.message || "Lỗi tải prompt cho kỹ năng"
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedSkillId]);

  // ===== Helpers: history from server =====
  const mapAttempt = (a) => ({
    id: a.id,
    prompt_id: a.prompt_id,
    expected: a.expected_text,
    recognized: a.recognized,
    score_overall: a.score_overall,
    wer: a?.details?.wer,
    cer: a?.details?.cer,
    at: a.created_at,
    audio_path: a.audio_path,
  });

  const loadAttempts = async (sid) => {
    try {
      const id = sid || session?.id;
      if (!id) return;
      const ats = await api.SkillSessions.attempts(id);
      const mapped = Array.isArray(ats) ? ats.map(mapAttempt) : [];
      setHistory(mapped);
    } catch (e) {
      // không chặn UI
      console.warn("Load attempts failed", e);
    }
  };

  // ===== Session controls =====
  const handleStartSession = async () => {
    try {
      const payload = {
        skill: selectedSkill?.id,
        enrollment: ctxEnrollId,
        // lesson: optional (null)
      };
      const res = await api.SkillSessions.start(payload);
      setSession(res);
      setHistory([]);
      setXpTotal(0);
      await loadAttempts(res?.id);
    } catch (e) {
      setError(e?.response?.data?.detail || "Không thể bắt đầu phiên học");
    }
  };

  const handleFinishSession = async () => {
    try {
      if (session?.id)
        await api.SkillSessions.complete(session.id, { final_xp: xpTotal || 0 });
    } catch {
      // non-blocking
    } finally {
      setSession(null);
      setHistory([]);
    }
  };

  // ===== Submit attempt (multipart + timeout dài + fallback base64) =====
  const submitAttempt = async () => {
    if (!current) return;
    if (!blob) return;
    setSubmitting(true);
    setError("");

    const expected = getExpectedText(current);
    const commonMeta = {
      prompt_id: current?.id ? String(current.id) : undefined,
      // QUAN TRỌNG: server mong đợi skill_session (string), không phải id numeric
      skill_session:
        session?.skill_session ? String(session.skill_session) : undefined,
      skill_id: selectedSkill?.id ? String(selectedSkill.id) : undefined,
      enrollment_id: ctxEnrollId ? String(ctxEnrollId) : undefined,
      language_code: learnLang || "en",
      lang: learnLang || "en",
    };

    try {
      // Cách 1: gửi file (multipart) với timeout dài hơn
      const fd = new FormData();
      const file = new File(
        [blob],
        `pron-${selectedSkillId || "skill"}-${Date.now()}.webm`,
        { type: blob.type || "audio/webm" }
      );
      fd.append("audio", file);
      fd.append("expected_text", expected);
      if (commonMeta.prompt_id) fd.append("prompt_id", commonMeta.prompt_id);
      if (commonMeta.skill_session) fd.append("skill_session", commonMeta.skill_session);
      if (commonMeta.skill_id) fd.append("skill_id", commonMeta.skill_id);
      if (commonMeta.enrollment_id)
        fd.append("enrollment_id", commonMeta.enrollment_id);
      fd.append("language_code", commonMeta.language_code);
      fd.append("lang", commonMeta.lang);

      const res = await api.SpeechPron.up(fd, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000, // ⏳ tăng riêng cho request nặng
      });

      // BE mới trả "recognized", "details"…
      const r = {
        id: crypto?.randomUUID?.() || `${Date.now()}`,
        prompt_id: current.id,
        expected,
        recognized: res?.recognized || res?.recognized_text || res?.text || "",
        score_overall: res?.score_overall ?? res?.score ?? 0,
        wer:
          (typeof res?.details?.wer === "number" && res?.details?.wer) ??
          res?.meta?.wer ??
          res?.wer,
        cer:
          (typeof res?.details?.cer === "number" && res?.details?.cer) ??
          res?.meta?.cer ??
          res?.cer,
        alignment: res?.details?.alignment ?? res?.alignment,
        mistakes: res?.mistakes || res?.mispronounced_words || [],
        xp: res?.xp_awarded || 0,
        model: res?.ai_model || res?.model_version || null,
        at: new Date().toISOString(),
      };
      // Optimistic UI
      setHistory((h) => [r, ...h]);
      setXpTotal((x) => x + (r.xp || 0));

      // Đồng bộ lại từ server (đã ghi PronAttempt)
      await loadAttempts();
    } catch (e) {
      // Nếu lỗi do timeout → fallback gửi base64 JSON
      if (e?.code === "ECONNABORTED") {
        try {
          const audio_base64 = await blobToBase64(blob);
          const payload = {
            audio_base64,
            expected_text: expected,
            language_code: commonMeta.language_code,
            lang: commonMeta.lang,
            ...(commonMeta.prompt_id ? { prompt_id: commonMeta.prompt_id } : {}),
            ...(commonMeta.skill_session ? { skill_session: commonMeta.skill_session } : {}),
            ...(commonMeta.skill_id ? { skill_id: commonMeta.skill_id } : {}),
            ...(commonMeta.enrollment_id
              ? { enrollment_id: commonMeta.enrollment_id }
              : {}),
          };

          const res = await api.post("/speech/pron/up/", payload, {
            headers: { "Content-Type": "application/json" },
            timeout: 120000,
          });

          const r = {
            id: crypto?.randomUUID?.() || `${Date.now()}`,
            prompt_id: current.id,
            expected,
            recognized: res?.recognized || res?.recognized_text || res?.text || "",
            score_overall: res?.score_overall ?? res?.score ?? 0,
            wer:
              (typeof res?.details?.wer === "number" && res?.details?.wer) ??
              res?.meta?.wer ??
              res?.wer,
            cer:
              (typeof res?.details?.cer === "number" && res?.details?.cer) ??
              res?.meta?.cer ??
              res?.cer,
            alignment: res?.details?.alignment ?? res?.alignment,
            mistakes: res?.mistakes || res?.mispronounced_words || [],
            xp: res?.xp_awarded || 0,
            model: res?.ai_model || res?.model_version || null,
            at: new Date().toISOString(),
          };
          setHistory((h) => [r, ...h]);
          setXpTotal((x) => x + (r.xp || 0));

          await loadAttempts();
        } catch (e2) {
          setError(
            e2?.response?.data?.detail || "Chấm điểm thất bại (base64)."
          );
        }
      } else {
        setError(e?.response?.data?.detail || "Chấm điểm thất bại.");
      }
    } finally {
      setSubmitting(false);
      reset();
    }
  };

  const last = history[0] || null;

  function toApiOriginMediaUrl(url) {
    try {
      const u = new URL(url);
      const path = u.pathname + (u.search || "");
      const apiBase = new URL(api.baseURL);
      return `${apiBase.origin}${path.startsWith("/") ? path : `/${path}`}`;
    } catch {
      return url;
    }
  }

  // ===== Play reference audio (ưu tiên URL cache → fallback base64) =====
  const playRefAudio = async () => {
    if (!current) return;
    const expected = getExpectedText(current);
    if (!expected) return;

    // cleanup objectURL cũ
    if (ttsUrlRef.current) {
      URL.revokeObjectURL(ttsUrlRef.current);
      ttsUrlRef.current = null;
    }

    try {
      // 🔄 CHỈ ĐỔI ENDPOINT: từ /speech/tts/ → /speech/pron/tts/ (truyền prompt_id để BE cache)
      const res = await api.instance.post(
        "/speech/pron/tts/",
        { prompt_id: current?.id, lang: learnLang || "en" },
        {
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          timeout: 60000,
        }
      );

      const data = res?.data || {};
      const urlAny = (data.url || data.audio_url || "").trim();
      const b64 = data.audio_base64;
      const mime = String(data.mimetype || data.mime_type || "audio/mpeg");

      // 1) ƯU TIÊN: URL (đã cache)
      if (urlAny) {
        const norm = toApiOriginMediaUrl(urlAny);
        try {
          const blobRes = await api.instance.get(norm, {
            responseType: "blob",
            timeout: 60000,
          });
          const blob = blobRes?.data;
          if (!(blob instanceof Blob)) throw new Error("Prefetch TTS is not Blob");
          const obj = URL.createObjectURL(blob);
          ttsUrlRef.current = obj;
          if (audioRef.current) {
            audioRef.current.src = obj;
            audioRef.current.load();
            await audioRef.current.play();
          }
          return;
        } catch (e1) {
          console.warn("[TTS] Prefetch audio url failed", e1);
        }
      }

      // 2) Fallback: base64
      if (typeof b64 === "string" && b64.trim()) {
        const dataUrl = `data:${mime};base64,${b64.trim()}`;
        if (audioRef.current) {
          audioRef.current.src = dataUrl;
          audioRef.current.load();
          await audioRef.current.play();
        }
        return;
      }

      throw new Error("TTS JSON thiếu/không phát được: url & audio_base64");
    } catch (e) {
      console.warn("Play audio failed", e);
    }
  };

  useEffect(() => {
    // cleanup khi unmount
    return () => {
      if (ttsUrlRef.current) {
        URL.revokeObjectURL(ttsUrlRef.current);
        ttsUrlRef.current = null;
      }
    };
  }, []);

  // ===== Render =====
  if (loading && !skills.length && !prompts.length) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" /> Đang tải trang phát âm…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700 flex items-start gap-3">
          <Info className="w-5 h-5 mt-0.5" />
          <div>
            <div className="font-semibold mb-1">Lỗi</div>
            <div>{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Phát âm</h1>
          {selectedSkill && (
            <div className="mt-1 text-sm text-gray-500">
              {selectedSkill.title_i18n?.[uiLang || "en"] ||
                selectedSkill.title ||
                `Skill #${selectedSkill.id}`}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 pl-3 pr-2 py-2 bg-white/60">
            <ListFilter className="w-4 h-4 text-gray-500" />
            <span className="text-xs text-gray-500">Chọn bài</span>
            <select
              value={selectedSkillId || ""}
              onChange={(e) => {
                const v = e.target.value;
                setSelectedSkillId(v);
                if (typeof window !== "undefined")
                  localStorage.setItem("pron_skill_id", v);
              }}
              className="text-sm bg-transparent outline-none"
            >
              {skills.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title_i18n?.[uiLang || "en"] || s.title || s.id}
                </option>
              ))}
            </select>
          </div>

          <StatChip
            icon={Activity}
            label="Độ khó"
            value={selectedSkill?.difficulty ?? "-"}
          />
          <StatChip
            icon={Sparkles}
            label="XP/Phiên"
            value={selectedSkill?.xp ?? 10}
          />
          <StatChip
            icon={Info}
            label="Thời lượng"
            value={`${selectedSkill?.duration || 5}’`}
          />

          {session ? (
            <button
              onClick={handleFinishSession}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700"
            >
              <Square className="w-4 h-4" /> Kết thúc phiên
            </button>
          ) : (
            <button
              onClick={handleStartSession}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
              disabled={!ctxEnrollId}
            >
              <Play className="w-4 h-4" /> Bắt đầu phiên
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Prompt list */}
        <div className="lg:col-span-5">
          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="font-medium">Danh sách câu/ từ luyện</div>
              <div className="text-xs text-gray-500">{prompts.length} mục</div>
            </div>
            <div className="max-h-[55vh] overflow-auto divide-y divide-gray-100">
              {prompts.map((p, i) => (
                // outer: DIV role="button" (tránh nested button)
                <div
                  key={p.id ?? i}
                  role="button"
                  tabIndex={0}
                  onClick={() => setIdx(i)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") setIdx(i);
                  }}
                  className={clsx(
                    "w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 cursor-pointer",
                    i === idx && "bg-sky-50/60"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">
                        {p.text || p.phrase || p.word}
                      </div>
                      {(p.phonetic || p.ipa) && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          /{p.phonetic || p.ipa}/
                        </div>
                      )}
                      {p.tip && (
                        <div className="text-xs text-amber-700 mt-1">
                          💡 {p.tip}
                        </div>
                      )}
                    </div>
                    <div className="shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIdx(i);
                          playRefAudio();
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-xs hover:bg-gray-50"
                      >
                        <Volume2 className="w-3.5 h-3.5" /> Nghe mẫu
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {prompts.length === 0 && (
                <div className="p-4 text-sm text-gray-500">
                  Chưa có dữ liệu Prompt cho kỹ năng này.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Practice area */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            {/* Current prompt header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <button
                  disabled={idx <= 0}
                  onClick={() => setIdx((i) => Math.max(0, i - 1))}
                  className="p-2 rounded-xl border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={idx >= prompts.length - 1}
                  onClick={() =>
                    setIdx((i) => Math.min(prompts.length - 1, i + 1))
                  }
                  className="p-2 rounded-xl border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="text-xs text-gray-500">
                {idx + 1} / {prompts.length || 1}
              </div>
            </div>

            <div className="mb-4">
              <div className="text-lg font-semibold">
                {current?.text || current?.phrase || current?.word || "—"}
              </div>
              {(current?.phonetic || current?.ipa) && (
                <div className="text-sm text-gray-500">
                  /{current?.phonetic || current?.ipa}/
                </div>
              )}
            </div>

            {/* Reference audio */}
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={playRefAudio}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50"
              >
                <Volume2 className="w-4 h-4" /> Nghe mẫu
              </button>
              <audio ref={audioRef} preload="auto" crossOrigin="anonymous" hidden />
            </div>

            {/* Recorder */}
            <div className="flex items-center gap-3 mb-3">
              {!recording ? (
                <button
                  onClick={start}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  <Mic className="w-5 h-5" /> Bắt đầu đọc
                </button>
              ) : (
                <button
                  onClick={stop}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-rose-600 text-white hover:bg-rose-700"
                >
                  <Square className="w-5 h-5" /> Dừng ghi •{" "}
                  {fmtDuration(elapsed)}
                </button>
              )}

              {blob && (
                <>
                  <audio
                    controls
                    src={URL.createObjectURL(blob)}
                    className="h-10"
                  />
                  <button
                    disabled={submitting}
                    onClick={submitAttempt}
                    className={clsx(
                      "inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50",
                      submitting && "opacity-60 cursor-not-allowed"
                    )}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Đang chấm…
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" /> Gửi chấm điểm
                      </>
                    )}
                  </button>
                </>
              )}

              {permission === false && (
                <div className="text-sm text-rose-600">
                  Trình duyệt bị chặn micro. Vui lòng cấp quyền microphone.
                </div>
              )}
            </div>

            {/* Live result */}
            {last && (
              <div className="rounded-xl border border-gray-200 p-4 bg-white/60">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">Kết quả gần nhất</div>
                  <ScoreBadge score={last.score_overall || 0} />
                </div>
                <ProgressBar value={last.score_overall || 0} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 text-sm">
                  <div>
                    <div className="text-gray-500">Expected</div>
                    <div className="font-medium">{last.expected}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Recognized</div>
                    <div className="font-medium">
                      {last.recognized || "(trống)"}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-gray-600">
                  {typeof last.wer === "number" && (
                    <div className="px-2 py-1 rounded-lg bg-gray-100">
                      WER: {(last.wer * 100).toFixed(1)}%
                    </div>
                  )}
                  {typeof last.cer === "number" && (
                    <div className="px-2 py-1 rounded-lg bg-gray-100">
                      CER: {(last.cer * 100).toFixed(1)}%
                    </div>
                  )}
                  {last.xp ? (
                    <div className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700">
                      +{last.xp} XP
                    </div>
                  ) : null}
                  {last.model && (
                    <div className="px-2 py-1 rounded-lg bg-sky-50 text-sky-700">
                      Model:{" "}
                      {typeof last.model === "string"
                        ? last.model
                        : last.model?.name || "—"}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* History */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium">Lịch sử lần thử</div>
                <div className="text-xs text-gray-500">Tổng XP: {xpTotal}</div>
              </div>
              <div className="space-y-2">
                {history.map((h) => (
                  <div
                    key={h.id}
                    className="rounded-lg border border-gray-200 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        {new Date(h.at).toLocaleTimeString()}
                      </div>
                      <ScoreBadge score={h.score_overall || 0} />
                    </div>
                    <div className="mt-1 text-sm">
                      <span className="text-gray-500">Expected:</span>{" "}
                      <span className="font-medium">{h.expected}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500">Recognized:</span>{" "}
                      <span className="font-medium">
                        {h.recognized || "(trống)"}
                      </span>
                    </div>
                  </div>
                ))}
                {history.length === 0 && (
                  <div className="text-sm text-gray-500">
                    Chưa có lần thử nào trong phiên này.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {!ctxEnrollId && (
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800 flex items-start gap-3">
          <Info className="w-5 h-5 mt-0.5" />
          <div>
            <div className="font-semibold mb-1">Thiếu ngữ cảnh học</div>
            <div>
              Không tìm thấy <code>enrollment_id</code>. Đã đọc{" "}
              <code>localStorage.learn</code> (L2) và resolve theo mã học nhưng
              không thành công.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
