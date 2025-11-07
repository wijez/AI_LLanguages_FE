// test.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

// ====== CONFIG ======
const API_BASE = "http://127.0.0.1:8000";
const START_URL = `${API_BASE}/api/roleplay-session/start/`;
const SUBMIT_URL = `${API_BASE}/api/roleplay-session/submit/`;
const SCENARIO_URL = `${API_BASE}/api/roleplay-scenario/`;     // list scenarios
const PRON_URL = `${API_BASE}/api/speech/pron/up/`;             // STT endpoint
const ASK_GEMINI_URL = `${API_BASE}/api/roleplay-block/ask_gemini/`; // RAG+Gemini

// ====== HELPERS ======
const roleLabel = {
  teacher: "Teacher",
  student_a: "Student A",
  student_b: "Student B",
  narrator: "Narrator",
  assistant: "Assistant",
};
const clsx = (...xs) => xs.filter(Boolean).join(" ");

async function postJSON(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data && (data.detail || data.message)) || `HTTP ${res.status}`;
    console.error("[POST FAIL]", { url, body, status: res.status, data });
    throw new Error(msg);
  }
  return data;
}

// blob → base64 (no data URL prefix)
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      try {
        const dataUrl = reader.result || ""; // data:audio/webm;base64,xxx
        const base64 = String(dataUrl).split(",").pop() || "";
        resolve(base64);
      } catch (e) { reject(e); }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

const toFixed1 = (n) => {
  const x = (typeof n === "number") ? n : Number(n);
  return Number.isFinite(x) ? x.toFixed(1) : "0.0";
};

// ====== UI ATOMS ======
const Tag = ({ children, color = "" }) => (
  <span className={clsx("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium", color || "bg-slate-100 text-slate-600")}>{children}</span>
);

const MessageBubble = ({ side, role, text, highlight = false, meta }) => (
  <div className={clsx("flex w-full gap-3", side === "right" ? "justify-end" : "justify-start")}>
    {side === "left" && (
      <div className="mt-0.5 h-7 w-7 shrink-0 rounded-full bg-slate-200 grid place-items-center text-xs text-slate-600">
        {(roleLabel[role] || role || "?").slice(0,1)}
      </div>
    )}
    <div
      className={clsx(
        "max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm",
        side === "right" ? "bg-blue-600 text-white" : "bg-white text-slate-800 border border-slate-200",
        highlight && "ring-2 ring-amber-400"
      )}
    >
      <div className="mb-1 flex items-center gap-2">
        <span className="text-[11px] uppercase tracking-wide opacity-70">{roleLabel[role] || role}</span>
        {meta?.section && <Tag>{meta.section}</Tag>}
        {typeof meta?.order === "number" && <Tag>#{meta.order}</Tag>}
        {highlight && <Tag color="bg-amber-100 text-amber-700">Your turn</Tag>}
      </div>
      <div className="whitespace-pre-wrap leading-relaxed">{text}</div>
    </div>
    {side === "right" && (
      <div className="mt-0.5 h-7 w-7 shrink-0 rounded-full bg-blue-600/20 grid place-items-center text-xs text-blue-800">You</div>
    )}
  </div>
);

// === CONTEXT CARD (Practice mode) ===
function ContextCard({ items = [] }) {
  if (!items?.length) return null;
  return (
    <details className="mx-10 rounded-xl border border-slate-200 bg-white shadow-sm p-3 text-xs text-slate-700">
      <summary className="cursor-pointer text-slate-600">Context (top {items.length})</summary>
      <div className="mt-2 space-y-2">
        {items.map((b, i) => (
          <div key={b.id || i} className="rounded-lg border border-slate-100 p-2">
            <div className="mb-1 flex items-center gap-2">
              {b.section && <Tag>{b.section}</Tag>}
              {typeof b.order === "number" && <Tag>#{b.order}</Tag>}
              {b.role && <Tag color="bg-slate-100 text-slate-700">{b.role}</Tag>}
            </div>
            <div className="text-slate-700">{b.text}</div>
          </div>
        ))}
      </div>
    </details>
  );
}

// === PRON FEEDBACK CARD (Roleplay mode) ===
function PronCard({ pron }) {
  if (!pron) return null;
  const { recognized, score_overall, words = [], details = {} } = pron;
  const mis = words.filter(w => (w.status || "").toLowerCase().includes("mis"));
  const missed = words.filter(w => (w.status || "").toLowerCase().includes("missed"));
  const ok = words.filter(w => (w.status || "").toLowerCase() === "ok");

  return (
    <div className="mx-10 rounded-xl border border-slate-200 bg-white shadow-sm p-3 text-xs text-slate-700">
      <div className="flex items-center justify-between">
        <div className="font-semibold">Pronunciation feedback</div>
        <div className="text-[11px] text-slate-500">Score: <span className="font-semibold">{toFixed1(score_overall)}</span></div>
      </div>

      <div className="mt-1 text-slate-600"><span className="text-[11px] uppercase">ASR</span>: {recognized || "—"}</div>

      <div className="mt-2 flex flex-wrap gap-1">
        {mis.map((w, i) => (
          <Tag key={`mis-${i}`} color="bg-rose-100 text-rose-700">✖ {w.word}</Tag>
        ))}
        {missed.map((w, i) => (
          <Tag key={`missed-${i}`} color="bg-amber-100 text-amber-700">… {w.word}</Tag>
        ))}
        {ok.slice(0, 6).map((w, i) => (
          <Tag key={`ok-${i}`} color="bg-emerald-100 text-emerald-700">✓ {w.word}</Tag>
        ))}
        {ok.length > 6 && <Tag color="bg-emerald-50 text-emerald-600">+{ok.length - 6} ok</Tag>}
      </div>

      <details className="mt-2">
        <summary className="cursor-pointer text-[11px] text-slate-500">Details</summary>
        <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
          <div>WER: <b>{details.wer ?? "—"}</b></div>
          <div>CER: <b>{details.cer ?? "—"}</b></div>
          <div>Conf: <b>{details.conf ?? "—"}</b></div>
          <div>Duration: <b>{details.duration ?? "—"}</b>s</div>
          <div>Speed: <b>{details.speed_sps ?? "—"}</b> sps</div>
        </div>
      </details>
    </div>
  );
}

// ====== MAIN COMPONENT ======
export default function RoleplayChatDemo({ embedded = false, defaultRole = "student_b", autoStart = true }) {
  // NEW: mode state
  const [mode, setMode] = useState("roleplay"); // 'roleplay' | 'practice'

  // state
  const [scenario, setScenario] = useState(""); // slug selected
  const [scenarioOpts, setScenarioOpts] = useState([]); // [{slug,title}]
  const [scLoading, setScLoading] = useState(false);

  const [userRole, setUserRole] = useState(defaultRole);
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState([]); // array: message | {type:'pron',pron} | {type:'context', context:[]}
  const [awaitUser, setAwaitUser] = useState(null); // {block_id, role, order, expected_text|expected_hint}
  const [finished, setFinished] = useState(false);

  const [input, setInput] = useState("");
  const [loadingStart, setLoadingStart] = useState(false);
  const [loadingSend, setLoadingSend] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);

  // ===== Voice recording state (for embedded widget) =====
  const [recOn, setRecOn] = useState(false);
  const [recBusy, setRecBusy] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const audioCtxRef = useRef(null);   // AudioContext cho chuỗi lọc
  const destNodeRef = useRef(null);   // MediaStreamDestination sau lọc

  useEffect(() => {
    return () => {
      try {
        streamRef.current?.getTracks()?.forEach(t => t.stop());
        if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
      } catch {
        console.warn("Cleanup audio resources failed");
      }
    };
  }, []);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }); }, [messages]);

  const resetUI = () => {
    setSessionId("");
    setMessages([]);
    setAwaitUser(null);
    setFinished(false);
    setInput("");
    setError("");
  };

  // load scenarios
  const loadScenarios = async () => {
    setScLoading(true);
    try {
      const all = [];
      let url = SCENARIO_URL;
      let guard = 0;
      while (url && guard < 20) {
        const res = await fetch(url, { headers: { "Accept": "application/json" } });
        const data = await res.json();
        const items = Array.isArray(data) ? data : (data.results || []);
        for (const it of items) {
          if (it?.slug) all.push({ slug: it.slug, title: it.title || it.slug });
        }
        url = Array.isArray(data) ? null : data.next;
        guard += 1;
      }
      setScenarioOpts(all);
      setScenario((prev) => prev || (all[0]?.slug || ""));
    } catch (e) {
      setError(`Load scenarios failed: ${e.message || e}`);
    } finally {
      setScLoading(false);
    }
  };
  useEffect(() => { loadScenarios(); }, []);

  // START roleplay
  const startRoleplay = async () => {
    resetUI();
    if (!scenario) { setError("Please select a scenario"); return; }
    setLoadingStart(true);
    try {
      const data = await postJSON(START_URL, { scenario, role: userRole });
      setSessionId(data.session_id);

      const prologueMsgs = (data.prologue || []).map((p, i) => ({
        id: `pro-${i}`,
        role: p.role,
        text: p.text,
        side: "left",
        meta: { section: p.section, order: p.order },
      }));

      const aiMsgs = (data.ai_utterances || []).map((a, i) => ({
        id: `ai-${i}`,
        role: a.role,
        text: a.text,
        side: "left",
      }));

      setMessages([...prologueMsgs, ...aiMsgs]);
      setAwaitUser(data.await_user || null);
      setFinished(false);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoadingStart(false);
    }
  };

  // INIT per mode/role/scenario
  useEffect(() => {
    if (!autoStart) return;
    if (mode === "roleplay" && scenario) startRoleplay();
    if (mode === "practice") {
      resetUI();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, userRole, scenario]);

  // ---- PRACTICE: ask gemini
  const askGemini = async (query) => {
    try {
      const body = { query, top_k: 8 };
      if (scenario) body.scenario = scenario;
      const data = await postJSON(ASK_GEMINI_URL, body);
      const answer = (data && data.answer) || "(no answer)";
      const ctx = Array.isArray(data?.context) ? data.context : [];

      setMessages((m) => [
        ...m,
        { id: `ans-${Date.now()}`, role: "assistant", text: answer, side: "left" },
        { id: `ctx-${Date.now()}`, type: "context", context: ctx },
      ]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { id: `err-${Date.now()}`, role: "assistant", side: "left", text: `⚠️ Ask error: ${e.message || e}` },
      ]);
    }
  };

  // ---- SUBMIT (roleplay)
  const sendToSubmit = async (line, pron = null) => {
    const body = pron ? { session_id: sessionId, transcript: line, pron } : { session_id: sessionId, transcript: line };
    const res = await postJSON(SUBMIT_URL, body);

    if (res.status === "finished") {
      setFinished(true);
      setAwaitUser(null);
      setMessages((m) => [ ...m, { id: `done-${Date.now()}`, role: "teacher", side: "left", text: "Scenario finished. Great job!" } ]);
      return;
    }

    if (res.passed === false) {
      setMessages((m) => [
        ...m,
        { id: `fb-${Date.now()}`, role: "teacher", side: "left", text: res.feedback || "Try again." },
      ]);
      return;
    }

    const scoreTag =
      (res.score && (typeof res.score.cosine === "number" || typeof res.score.lexical === "number"))
        ? ` (cos ${res.score.cosine ?? "-"}, lex ${res.score.lexical ?? "-"})`
        : "";
    setMessages((m) => [
      ...m,
      { id: `ok-${Date.now()}`, role: "teacher", side: "left", text: `✓ Good!${scoreTag}` },
    ]);

    const nextAi = (res.next_ai || []).map((a, i) => ({ id: `nai-${Date.now()}-${i}`, role: a.role, text: a.text, side: "left" }));
    setMessages((m) => [ ...m, ...nextAi ]);

    setAwaitUser(res.await_user || null);
    setFinished(Boolean(res.finished));

    if (res.finished) {
      setMessages((m) => [ ...m, { id: `done-${Date.now()}`, role: "teacher", side: "left", text: "Scenario finished. Great job!" } ]);
    }
  };

  const handleSend = async () => {
    const line = input.trim();
    if (!line) return;
    setLoadingSend(true);
    setError("");

    // user bubble
    setMessages((m) => [ ...m, { id: `u-${Date.now()}`, role: userRole, text: line, side: "right" } ]);
    setInput("");

    try {
      if (mode === "practice") {
        await askGemini(line);
      } else {
        if (!awaitUser || !sessionId) throw new Error("Not ready yet");
        await sendToSubmit(line);
      }
    } catch (e) {
      setError(e.message || String(e));
      setMessages((m) => [ ...m, { id: `err-${Date.now()}`, role: "teacher", side: "left", text: `⚠️ ${e.message || e}` } ]);
    } finally {
      setLoadingSend(false);
    }
  };

  // === Hardware noise suppression + Web Audio filters ===
  async function getNoiseReducedStream() {
    const sup = (navigator.mediaDevices.getSupportedConstraints?.() || {});
    // 1) Bật chống ồn/khử vọng/AGC ở driver nếu có
    const raw = await navigator.mediaDevices.getUserMedia({
      audio: {
        noiseSuppression: sup.noiseSuppression ? { ideal: true } : true,
        echoCancellation: sup.echoCancellation ? { ideal: true } : true,
        autoGainControl: sup.autoGainControl ? { ideal: true } : true,
        channelCount: sup.channelCount ? { ideal: 1 } : undefined,
        sampleRate: sup.sampleRate ? { ideal: 48000 } : undefined,
      },
      video: false,
    });

    // 2) Chuỗi lọc Web Audio: High-pass → Low-pass → Compressor → Destination
    const AC = window.AudioContext || window.webkitAudioContext;
    const ctx = new AC();
    audioCtxRef.current = ctx;

    const src = ctx.createMediaStreamSource(raw);

    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 120;     // cắt ù thấp

    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 3800;    // cắt hiss cao

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -40;
    comp.knee.value = 28;
    comp.ratio.value = 12;
    comp.attack.value = 0.003;
    comp.release.value = 0.25;

    src.connect(hp);
    hp.connect(lp);
    lp.connect(comp);

    const dest = ctx.createMediaStreamDestination();
    comp.connect(dest);
    destNodeRef.current = dest;

    // stream đã lọc (ghi) + raw (để stop track gốc)
    return { stream: dest.stream, raw };
  }

  // ===== RECORDING =====
  const startRec = async () => {
    try {
      // lấy stream đã chống ồn (constraints + Web Audio chain)
      const { stream, raw } = await getNoiseReducedStream();

      // Debug nhanh
      const track = raw?.getAudioTracks?.()[0];
      const settings = track?.getSettings?.() || {};
      console.log("[Mic settings]", settings);
      console.log("[AudioContext]", {
        state: audioCtxRef.current?.state,
        sampleRate: audioCtxRef.current?.sampleRate,
      });

      streamRef.current = raw || stream;
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => { if (e.data?.size) chunksRef.current.push(e.data); };

      mr.onstop = async () => {
        try {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          // dọn resource an toàn
          streamRef.current?.getTracks()?.forEach(t => t.stop());
          if (audioCtxRef.current) { audioCtxRef.current.close().catch(() => {}); }
          audioCtxRef.current = null; destNodeRef.current = null;

          setRecOn(false);
          setRecBusy(true);
          const base64 = await blobToBase64(blob);

          // Always use pron/up to get recognized text (even in practice)
          const payload = {
            audio_base64: `data:audio/webm;base64,${base64}`,
            language_code: "en",
            lang: "en",
          };

          // If roleplay and we know expected, pass it for scoring
          const target = awaitUser?.expected_text || awaitUser?.expected_hint || "";
          if (mode === "roleplay" && target) {
            payload.expected_text = target;
            payload.target_text = target;
          }

          const stt = await postJSON(PRON_URL, payload);
          const recognized =
            stt.recognized ||
            stt.text ||
            stt.transcript ||
            stt.asr_text ||
            stt.result?.text ||
            "";

          if (!recognized) throw new Error("Không nhận được văn bản từ STT");

          // show user's recognized text
          setMessages((m) => [ ...m, { id: `u-${Date.now()}`, role: userRole, text: recognized, side: "right" } ]);

          if (mode === "practice") {
            await askGemini(recognized);
          } else {
            // roleplay: show pronunciation card then submit
            const pron = {
              recognized,
              score_overall: stt.score_overall,
              words: Array.isArray(stt.words) ? stt.words : [],
              details: stt.details || {},
            };
            setMessages((m) => [ ...m, { id: `pron-${Date.now()}`, type: "pron", pron } ]);

            if (!awaitUser || !sessionId) throw new Error("Not ready yet");
            setLoadingSend(true);
            await sendToSubmit(recognized, pron);
          }
        } catch (e) {
          setError(e.message || String(e));
          setMessages((m) => [ ...m, { id: `err-${Date.now()}`, role: "teacher", side: "left", text: `⚠️ ${e.message || e}` } ]);
        } finally {
          setRecBusy(false);
          setLoadingSend(false);
        }
      };

      mr.start();
      setRecOn(true);
    } catch (e) {
      setError(e.message || String(e));
      setMessages((m) => [ ...m, { id: `err-${Date.now()}`, role: "teacher", side: "left", text: `⚠️ Mic error: ${e.message || e}` } ]);
    }
  };

  const stopRec = () => {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== "inactive") mr.stop();
    // đảm bảo đóng track/context dù onstop không chạy
    streamRef.current?.getTracks()?.forEach(t => t.stop());
    if (audioCtxRef.current) { audioCtxRef.current.close().catch(() => {}); }
    audioCtxRef.current = null; destNodeRef.current = null;
  };

  const toggleRec = async () => {
    if (recBusy) return;
    if (!recOn) await startRec(); else stopRec();
  };

  const nextExpectedHint = useMemo(() => {
    if (mode !== "roleplay") return "";
    if (!awaitUser) return "";
    return awaitUser.expected_hint || "";
  }, [awaitUser, mode]);

  // ====== LAYOUTS ======
  // Mode switcher UI
  const ModeSwitch = () => (
    <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5 text-xs shadow-sm">
      <button
        onClick={() => { setMode("roleplay"); resetUI(); }}
        className={clsx(
          "px-2 py-1 rounded-md",
          mode === "roleplay" ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-slate-50"
        )}
      >Roleplay</button>
      <button
        onClick={() => { setMode("practice"); resetUI(); }}
        className={clsx(
          "px-2 py-1 rounded-md",
          mode === "practice" ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-slate-50"
        )}
      >Practice</button>
    </div>
  );

  if (embedded) {
    // Compact widget
    return (
      <div className="h-full flex flex-col bg-white">
        {/* Toolbar */}
        <div className="flex items-center gap-2 border-b border-slate-200 px-2 py-2 bg-slate-50">
          <ModeSwitch />
          <select
            className="flex-1 min-w-0 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs shadow-sm"
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            disabled={scLoading || !scenarioOpts.length}
            title="Scenario"
          >
            {scLoading && <option>Loading…</option>}
            {!scLoading && !scenarioOpts.length && <option>No scenarios</option>}
            {scenarioOpts.map((s) => (
              <option key={s.slug} value={s.slug}>{s.title}</option>
            ))}
          </select>

          {mode === "roleplay" && (
            <>
              <select
                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs shadow-sm"
                value={userRole}
                onChange={(e) => setUserRole(e.target.value)}
                title="Your role"
              >
                <option value="student_a">A</option>
                <option value="student_b">B</option>
                <option value="teacher">Tch</option>
                <option value="narrator">Nar</option>
              </select>
              <button
                onClick={startRoleplay}
                className={clsx("rounded-md px-3 py-1 text-xs shadow-sm border", loadingStart ? "bg-slate-100 text-slate-400 border-slate-200" : "bg-white hover:bg-slate-50 text-slate-700 border-slate-300")}
                disabled={loadingStart || !scenario}
                title="Start"
              >{loadingStart ? "…" : "Start"}</button>
            </>
          )}
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/60">
          {messages.map((m) =>
            m.type === "pron" ? (
              <PronCard key={m.id} pron={m.pron} />
            ) : m.type === "context" ? (
              <ContextCard key={m.id} items={m.context} />
            ) : (
              <MessageBubble key={m.id} side={m.side} role={m.role} text={m.text} meta={m.meta} />
            )
          )}
          {mode === "roleplay" && awaitUser && (
            <MessageBubble
              key="await"
              side="left"
              role={awaitUser.role}
              text={nextExpectedHint || "It's your turn."}
              highlight
              meta={{ order: awaitUser.order }}
            />
          )}
          {finished && (
            <div className="mt-6 text-center text-xs text-emerald-700">🎉 Scenario finished. Great job!</div>
          )}
        </div>

        {/* Voice-only composer */}
        <div className="flex items-center justify-between gap-2 border-t border-slate-200 p-2">
          <div className="text-[11px] text-slate-500">
            {recOn ? "Listening… tap to stop"
              : recBusy ? "Processing…"
              : (mode === "practice" ? "Press to ask (voice)" : (awaitUser ? "Press to speak your turn" : "Waiting for your turn…"))}
          </div>
          <button
            onClick={toggleRec}
            disabled={(mode === "roleplay" && !awaitUser) || loadingSend || recBusy}
            className={clsx(
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-sm",
              ((mode === "roleplay" && !awaitUser) || loadingSend || recBusy)
                ? "bg-slate-200 text-slate-500"
                : recOn
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-blue-600 text-white hover:bg-blue-700"
            )}
            title={recOn ? "Stop" : "Record"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Z" />
              <path d="M5 11a1 1 0 1 0-2 0 9 9 0 0 0 8 8.944V22a1 1 0 1 0 2 0v-2.056A9 9 0 0 0 21 11a1 1 0 1 0-2 0 7 7 0 1 1-14 0Z" />
            </svg>
            {recOn ? "Stop" : "Speak"}
          </button>
        </div>

        {/* Footer mini */}
        <div className="px-3 py-1 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100">
          <span className="truncate">Session: <code className="bg-slate-100 px-1 rounded">{mode === "roleplay" ? (sessionId || "—") : "—"}</code></span>
          {error && <span className="text-red-600">⚠️ {error}</span>}
        </div>
      </div>
    );
  }

  // ==== Full page layout ====
  return (
    <div className="min-h-[100vh] w-full bg-gradient-to-b from-slate-50 to-slate-100 py-8">
      <div className="mx-auto w-full max-w-3xl px-4">
        {/* Header */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-800">Roleplay / Practice</h1>
            <p className="text-sm text-slate-500">
              Roleplay dùng <code className="rounded bg-slate-100 px-1">/roleplay-session/start</code> + <code className="rounded bg-slate-100 px-1">/submit</code>. Practice dùng <code className="rounded bg-slate-100 px-1">/roleplay-block/ask_gemini</code>.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ModeSwitch />

            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-600">Scenario</label>
              <select
                className="w-72 rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm shadow-sm"
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
                disabled={scLoading || !scenarioOpts.length}
              >
                {scLoading && <option>Loading…</option>}
                {!scLoading && !scenarioOpts.length && <option>No scenarios</option>}
                {scenarioOpts.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.title} — {s.slug}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={loadScenarios}
                className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm shadow-sm hover:bg-slate-50"
              >Refresh</button>
            </div>

            {mode === "roleplay" && (
              <>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-slate-600">Your role</label>
                  <select
                    className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm shadow-sm"
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value)}
                  >
                    <option value="student_a">Student A</option>
                    <option value="student_b">Student B</option>
                    <option value="teacher">Teacher</option>
                    <option value="narrator">Narrator</option>
                  </select>
                </div>
                <button
                  onClick={startRoleplay}
                  className={clsx("rounded-lg px-3 py-1.5 text-sm shadow-sm border", loadingStart ? "bg-slate-100 text-slate-400 border-slate-200" : "bg-white hover:bg-slate-50 text-slate-700 border-slate-300")}
                  disabled={loadingStart || !scenario}
                >{loadingStart ? "Starting…" : "Start"}</button>
              </>
            )}
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-md">
          <div ref={scrollRef} className="h-[60vh] overflow-y-auto p-4 space-y-3 bg-slate-50/60">
            {messages.map((m) =>
              m.type === "pron" ? (
                <PronCard key={m.id} pron={m.pron} />
              ) : m.type === "context" ? (
                <ContextCard key={m.id} items={m.context} />
              ) : (
                <MessageBubble key={m.id} side={m.side} role={m.role} text={m.text} meta={m.meta} />
              )
            )}

            {mode === "roleplay" && awaitUser && (
              <MessageBubble
                key="await"
                side="left"
                role={awaitUser.role}
                text={nextExpectedHint || "It's your turn."}
                highlight
                meta={{ order: awaitUser.order }}
              />
            )}

            {finished && (
              <div className="mt-6 text-center text-sm text-emerald-700">🎉 Scenario finished. Great job!</div>
            )}
          </div>

          {/* Composer */}
          <div className="flex items-center gap-2 border-t border-slate-200 p-3">
            <input
              className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={
                mode === "practice"
                  ? "Hỏi gì cũng được… (Enter để hỏi)"
                  : (awaitUser ? "Nhập câu của bạn… (hoặc dán transcript Whisper)" : (finished ? "Scenario đã kết thúc" : "Chờ đến lượt…"))
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
              disabled={loadingSend || (mode === "roleplay" && !awaitUser)}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loadingSend || (mode === "roleplay" && !awaitUser)}
              className={clsx(
                "rounded-xl px-4 py-2 text-sm font-medium shadow-sm",
                (!input.trim() || loadingSend || (mode === "roleplay" && !awaitUser))
                  ? "bg-slate-200 text-slate-500"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              )}
            >{loadingSend ? "Sending…" : (mode === "practice" ? "Ask" : "Send")}</button>

            {/* Voice button (optional on full layout) */}
            <button
              onClick={toggleRec}
              disabled={recBusy || loadingSend || (mode === "roleplay" && !awaitUser)}
              className={clsx(
                "rounded-xl px-3 py-2 text-sm font-medium shadow-sm",
                (recBusy || loadingSend || (mode === "roleplay" && !awaitUser))
                  ? "bg-slate-200 text-slate-500"
                  : recOn
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              )}
              title={recOn ? "Stop" : "Record"}
            >{recOn ? "Stop" : "🎙️ Voice"}</button>
          </div>
        </div>

        {/* Footer & errors */}
        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
          <div className="truncate">Mode: <code className="bg-slate-100 px-1 rounded">{mode}</code> — Session: <code className="bg-slate-100 px-1 rounded">{mode === "roleplay" ? (sessionId || "—") : "—"}</code></div>
          {error && <div className="text-red-600">⚠️ {error}</div>}
        </div>
      </div>
    </div>
  );
}

// ====== FLOATING CHAT WIDGET — BONG BÓNG ======
export function ChatWidget({ title = "Roleplay Assistant", badge = "AI" }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const btnRef = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (!open) return;
      const p = panelRef.current;
      const b = btnRef.current;
      if (p && !p.contains(e.target) && b && !b.contains(e.target)) {
        setOpen(false);
      }
    }
    function onEsc(e) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return createPortal(
    <>
      {/* Floating Button */}
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-[2147483647] grid place-items-center h-14 w-14 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 active:scale-95 transition"
        aria-label="Open chat"
      >
        <span className="text-sm font-semibold">{badge}</span>
      </button>

      {/* Popover bubble */}
      <div
        className={clsx(
          "fixed bottom-24 right-5 z-[2147483647] transition ease-out duration-150",
          open ? "opacity-100 translate-y-0 scale-100" : "pointer-events-none opacity-0 translate-y-2 scale-95"
        )}
      >
        <div
          ref={panelRef}
          className="relative w-[92vw] max-w-[360px] h-[70vh] sm:w-[360px] sm:h-[520px] rounded-2xl border border-slate-300 bg-white shadow-2xl overflow-hidden"
          role="dialog"
          aria-label={title}
        >
          {/* tail */}
          <div className="absolute -bottom-2 right-8 h-4 w-4 rotate-45 bg-white border-b border-r border-slate-300"></div>

          {/* header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2 bg-slate-50">
            <div className="flex items-center gap-2">
              <span className="inline-grid h-6 w-6 place-items-center rounded-full bg-blue-600 text-white text-[10px]">{badge}</span>
              <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
            </div>
            <button
              className="rounded-md px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
              onClick={() => setOpen(false)}
            >Close</button>
          </div>

          {/* content */}
          <div className="h-full">
            {open && <RoleplayChatDemo embedded defaultRole="student_b" autoStart />} {/* compact mode */}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
