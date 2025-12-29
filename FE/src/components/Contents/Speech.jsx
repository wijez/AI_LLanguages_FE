import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  ListFilter,
  ChevronDown,
  CheckCircle2,
  XCircle,
  RefreshCcw,
  Clock,
  X,
  CalendarDays,
  BarChart2
} from "lucide-react";
import { api } from "../../api/api";

// ===== Helpers & Components =====
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

function ColoredWord({ word, score }) {
  let colorClass = "text-rose-600";
  if (score >= 80) colorClass = "text-emerald-600";
  else if (score >= 50) colorClass = "text-amber-600";

  return (
    <span className={clsx("mx-1 font-medium relative group cursor-default", colorClass)}>
      {word}
      <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
        {Math.round(score)}
      </span>
    </span>
  );
}

// --- Motion Variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};
const pulseVariants = {
  pulse: {
    scale: [1, 1.05, 1],
    boxShadow: [
      "0 0 0 0 rgba(220, 38, 38, 0.4)",
      "0 0 0 10px rgba(220, 38, 38, 0)",
      "0 0 0 0 rgba(220, 38, 38, 0)",
    ],
    transition: { duration: 1.5, repeat: Infinity },
  },
};

// --- Logic Helpers ---
function readLearn() {
  if (typeof window === "undefined") return { lang: null, enrollmentId: null };
  const raw = localStorage.getItem("learn");
  if (!raw) return { lang: null, enrollmentId: null };
  const obj = parseJSON(raw);
  if (obj && typeof obj === "object") {
    const lang = obj?.language?.abbreviation || obj?.language?.code || obj?.language_code || obj?.abbreviation || obj?.code || (typeof obj?.language === "string" ? obj.language : null) || null;
    const enrollmentId = obj?.enrollment_id || obj?.id || obj?.enrollment?.id || null;
    return { lang, enrollmentId };
  }
  return { lang: raw.toString().trim() || null, enrollmentId: null };
}

function getExpectedText(p) {
  const cands = [p?.expected_text, p?.answer, p?.text, p?.phrase, p?.word];
  const s = cands.find((x) => typeof x === "string" && x.trim());
  return s ? s.trim() : "";
}

function toApiOriginMediaUrl(url) {
  if (!url) return "";
  try {
    if (url.startsWith("http")) return url;
    const apiBase = new URL(api.baseURL);
    const path = url.startsWith("/") ? url : `/${url}`;
    return `${apiBase.origin}${path}`;
  } catch {
    return url;
  }
}

// --- Hook Recorder ---
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
  const color = score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : "bg-rose-500";
  return (
    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={clsx("inline-flex items-center px-2 py-1 rounded-full text-white text-xs font-semibold shadow-sm", color)}>
      <Award className="w-3.5 h-3.5 mr-1" /> {Math.round(score)}
    </motion.div>
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
  const bar = v >= 80 ? "bg-emerald-500" : v >= 60 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mt-2">
      <motion.div className={clsx("h-2", bar)} initial={{ width: 0 }} animate={{ width: `${v}%` }} transition={{ duration: 1, ease: "easeOut" }} />
    </div>
  );
}

// ===== MAIN COMPONENT =====
export default function Speech({ languageCode: propLang, enrollmentId: propEnrollId, skillId: propSkillId }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [uiLang, setUiLang] = useState(null);
  const [learnLang, setLearnLang] = useState(null);
  const [ctxEnrollId, setCtxEnrollId] = useState(null);

  const [skills, setSkills] = useState([]);
  const [selectedSkillId, setSelectedSkillId] = useState(null);
  const selectedSkill = useMemo(() => skills.find((s) => String(s.id) === String(selectedSkillId)) || null, [skills, selectedSkillId]);

  const [prompts, setPrompts] = useState([]);
  const [idx, setIdx] = useState(0);

  const [session, setSession] = useState(null);
  const [history, setHistory] = useState([]);
  const [xpTotal, setXpTotal] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [restoringSession, setRestoringSession] = useState(true);

  // Modal History
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [pastSessions, setPastSessions] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const audioRef = useRef(null);
  const ttsUrlRef = useRef(null);
  const initialSkillFromQuery = getQuery("skill");

  const { recording, permission, blob, elapsed, start, stop, reset } = useRecorder();
  const current = prompts[idx] || null;

  // --- Mapper ---
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
    xp: a.xp || a.xp_awarded || 0,
    words: a.words || [],
  });

  // 1. Init Auth & Lang
  useEffect(() => {
    (async () => {
      let L1 = (typeof window !== "undefined" && localStorage.getItem("lang")) || "en";
      const { lang: L2raw, enrollmentId: eidFromLearn } = readLearn();
      let L2 = (L2raw || "").trim() || "en";
      let eid = eidFromLearn ? String(eidFromLearn) : null;

      if (!eid && L2) {
        try {
          let data = (await api.Enrollments.findByAbbr(L2)) || (await api.Enrollments.findByLangCode(L2));
          const first = Array.isArray(data?.results) ? data.results[0] : (Array.isArray(data) ? data[0] : data);
          if (first?.id) eid = String(first.id);
        } catch {}
      }
      if (typeof window !== "undefined" && eid) localStorage.setItem("enrollment_id", String(eid));

      setUiLang(L1);
      setLearnLang(L2);
      setCtxEnrollId(eid);
    })();
  }, []);

  // 2. Restore Session
  useEffect(() => {
    const restoreSession = async () => {
      if (typeof window === "undefined") return;
      const savedSid = localStorage.getItem("current_pron_session_id");
      if (!savedSid) {
        setRestoringSession(false);
        return;
      }

      try {
        const res = await api.SkillSessions.get(savedSid);
        if (res && res.status === 'in_progress') {
          setSession(res);
          if (res.skill) {
            setSelectedSkillId(String(res.skill));
            localStorage.setItem("pron_skill_id", String(res.skill));
          }
          try {
            const attemptsRes = await api.SkillSessions.attempts(savedSid);
            const mapped = Array.isArray(attemptsRes) ? attemptsRes.map(mapAttempt) : [];
            setHistory(mapped);
            const total = mapped.reduce((acc, curr) => acc + (curr.xp || 0), 0);
            setXpTotal(total);
          } catch (errAtt) {
            console.warn("Không tải được attempts cũ", errAtt);
          }
        } else {
          localStorage.removeItem("current_pron_session_id");
        }
      } catch (e) {
        console.warn("Không thể khôi phục session cũ:", e);
        localStorage.removeItem("current_pron_session_id");
      } finally {
        setRestoringSession(false);
      }
    };
    restoreSession();
  }, []);

  // 3. Load Skills
  useEffect(() => {
    if (!learnLang) return;
    (async () => {
      setLoading(true);
      setError("");
      try {
        let list = [];
        const sres = await api.Skills.list({ type: 'pron', language: learnLang, limit: 50 });
        list = sres?.results || sres || [];
        setSkills(list);

        if (!selectedSkillId && !session) {
          const fromQuery = initialSkillFromQuery ? String(initialSkillFromQuery) : null;
          const fromStorage = typeof window !== "undefined" ? localStorage.getItem("pron_skill_id") : null;
          const preferred = fromQuery || fromStorage || (list[0] ? String(list[0].id) : null);
          setSelectedSkillId(preferred);
        }
      } catch (e) {
        setError("Lỗi tải danh sách kỹ năng");
      } finally {
        setLoading(false);
      }
    })();
  }, [learnLang]);

  // 4. Load Prompts
  useEffect(() => {
    (async () => {
      if (!selectedSkillId) return;
      try {
        let list = [];
        try {
          const qres = await api.Skills.questions(selectedSkillId);
          list = qres?.pronunciation_prompts || [];
        } catch {
          if (api.PronunciationPrompts) {
            const pres = await api.PronunciationPrompts.list({ skill: selectedSkillId });
            list = pres?.results || pres || [];
          }
        }
        setPrompts(list);
        setIdx(0);
      } catch (e) {
        setPrompts([]);
      }
    })();
  }, [selectedSkillId]);

  // ===== FETCH GLOBAL HISTORY =====
  const handleOpenHistory = async () => {
    if (!ctxEnrollId) return;
    setShowHistoryModal(true);
    setLoadingHistory(true);
    try {
      const res = await api.SkillSessions.list({ 
          enrollment: ctxEnrollId, 
          ordering: '-started_at' 
      });
      setPastSessions(res.results || res || []);
    } catch (e) {
      console.warn("Lỗi tải lịch sử:", e);
    } finally {
      setLoadingHistory(false);
    }
  };

  // ===== ACTIONS =====
  const handleStartSession = async () => {
    try {
      const payload = { skill: selectedSkill?.id, enrollment: ctxEnrollId };
      const res = await api.SkillSessions.start(payload);
      if (typeof window !== "undefined") {
        localStorage.setItem("current_pron_session_id", String(res.id));
      }
      setSession(res);
      setHistory([]);
      setXpTotal(0);
    } catch (e) {
      setError(e?.response?.data?.detail || "Không thể bắt đầu phiên học");
    }
  };

  const handleFinishSession = async () => {
    try {
      if (session?.id)
        await api.SkillSessions.complete(session.id, { final_xp: xpTotal || 0 });
    } catch {
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("current_pron_session_id");
      }
      setSession(null);
      setHistory([]);
    }
  };

  // === SUBMIT LOGIC ===
  const submitAttempt = async () => {
    if (!current || !blob) return;
    setSubmitting(true);
    setError("");
    const expected = getExpectedText(current);
    
    const fd = new FormData();
    fd.append("audio", new File([blob], "audio.webm", { type: blob.type }));
    fd.append("expected_text", expected);
    fd.append("language_code", learnLang || "en"); 

    try {
      const resScore = await api.SpeechPron.up(fd, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 60000,
      });

      const audioPath = resScore.debug_upload?.saved_path || resScore.saved_path || ""; 
      
      const payloadToSave = {
          prompt_id: current.id,
          expected_text: expected,
          recognized: resScore.recognized || "", 
          score_overall: resScore.score_overall,
          words: resScore.words || [],
          details: resScore.details,
          audio_path: audioPath
      };

      if (session?.id) {
          const updatedSession = await api.post(`/skill_sessions/${session.id}/save_attempt/`, payloadToSave);
          setSession(updatedSession);
      }

      const newHistoryItem = mapAttempt({
          id: Date.now(),
          prompt_id: current.id,
          expected_text: expected,
          ...payloadToSave, 
          created_at: new Date().toISOString()
      });
      
      setHistory((prev) => [newHistoryItem, ...prev]);
      
      const xpGain = (resScore.score_overall >= 80) ? 1 : 0; 
      setXpTotal((prev) => prev + xpGain);

    } catch (e) {
      console.error(e);
      setError("Chấm điểm thất bại. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
      reset();
    }
  };

  const playRefAudio = async (targetPrompt = null) => {
    const p = targetPrompt || current;
    if (!p) return;

    const existingAudio = p.audio || p.audio_url || p.file || p.audio_file;
    if (existingAudio) {
      const fullUrl = toApiOriginMediaUrl(existingAudio);
      if (audioRef.current) {
        audioRef.current.src = fullUrl;
        audioRef.current.load();
        audioRef.current.play().catch(e => console.warn(e));
      }
      return;
    }

    const expected = getExpectedText(p);
    if (!expected) return;

    if (ttsUrlRef.current) {
        URL.revokeObjectURL(ttsUrlRef.current);
        ttsUrlRef.current = null;
    }

    try {
      const data = await api.SpeechPron.ttsPrompt(p.id, learnLang || "en");
      
      if (data.audio_base64) {
          const mime = data.mimetype || "audio/mpeg";
          const d = `data:${mime};base64,${data.audio_base64}`;
          if (audioRef.current) {
             audioRef.current.src = d;
             audioRef.current.play();
          }
      } else if (data.url || data.audio_url) {
          const u = toApiOriginMediaUrl(data.url || data.audio_url);
          if (audioRef.current) {
             audioRef.current.src = u;
             audioRef.current.play();
          }
      }
    } catch (e) {
      console.warn("TTS failed", e);
    }
  };

  if (restoringSession) {
      return (
          <div className="flex h-screen items-center justify-center bg-gray-50">
              <div className="text-center">
                  <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-3"/>
                  <p className="text-gray-500">Đang khôi phục phiên học...</p>
              </div>
          </div>
      );
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto min-h-screen relative">
      {/* HEADER */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6 sticky top-0 bg-white/90 backdrop-blur-md z-10 py-2 border-b border-gray-100"
      >
        <motion.div variants={itemVariants}>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Phát âm</h1>
          {selectedSkill ? (
            <div className="mt-1 text-sm text-gray-500">
              {selectedSkill.title_i18n?.[uiLang || "en"] || selectedSkill.title}
            </div>
          ) : (
            <div className="mt-1 text-sm text-gray-400">Chọn bài học để bắt đầu</div>
          )}
        </motion.div>

        <motion.div variants={itemVariants} className="flex items-center gap-2 flex-wrap">
          <button 
             onClick={handleOpenHistory}
             className="p-2 hover:bg-gray-100 rounded-xl text-gray-600 border border-gray-200 bg-white shadow-sm flex items-center justify-center transition-colors"
             title="Lịch sử luyện tập"
          >
             <Clock className="w-4 h-4"/>
          </button>

          <div className="relative group">
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 pl-3 pr-8 py-2 bg-white hover:border-blue-400 transition-colors shadow-sm cursor-pointer min-w-[200px]">
              <ListFilter className="w-4 h-4 text-gray-500" />
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Chọn bài</span>
                <select
                  value={selectedSkillId || ""}
                  onChange={(e) => {
                    const newVal = e.target.value;
                    setSelectedSkillId(newVal);
                    if (typeof window !== "undefined")
                      localStorage.setItem("pron_skill_id", newVal);
                  }}
                  className="appearance-none bg-transparent outline-none text-sm font-medium text-gray-800 w-full absolute inset-0 pl-10 cursor-pointer z-10 opacity-0"
                  disabled={loading && !skills.length}
                >
                  {skills.map((s) => (
                    <option key={s.id} value={s.id}>{s.title_i18n?.[uiLang || "en"] || s.title || s.id}</option>
                  ))}
                </select>
                <span className="text-sm font-medium text-gray-800 truncate max-w-[150px]">
                  {skills.find((s) => String(s.id) === String(selectedSkillId))?.title || "Đang tải..."}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 pointer-events-none" />
            </div>
          </div>

          <div className="hidden md:flex gap-2">
            <StatChip icon={Activity} label="Độ khó" value={selectedSkill?.difficulty ?? "-"} />
            <StatChip icon={Info} label="Thời lượng" value={`${selectedSkill?.duration || 5}’`} />
          </div>

          {session ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleFinishSession}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 shadow-sm"
            >
              <Square className="w-4 h-4" /> Kết thúc
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStartSession}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm disabled:opacity-50"
              disabled={!ctxEnrollId || !selectedSkillId}
            >
              <Play className="w-4 h-4" /> Bắt đầu
            </motion.button>
          )}
        </motion.div>
      </motion.div>

      {/* ERROR / CONTENT */}
      {error && !prompts.length ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 text-center text-rose-600 bg-rose-50 rounded-2xl border border-rose-100">
          <Info className="w-8 h-8 mx-auto mb-2" />
          <p>{error}</p>
        </motion.div>
      ) : loading && !skills.length ? (
        <div className="flex justify-center py-20 text-gray-400"><Loader2 className="w-8 h-8 animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: Prompt List */}
          <motion.div className="lg:col-span-5" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col max-h-[70vh]">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 font-medium text-gray-700 flex justify-between">
                <span>Danh sách câu ({prompts.length})</span>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {prompts.map((p, i) => (
                  <div key={i} onClick={() => setIdx(i)} className={clsx("px-4 py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors flex justify-between items-start", i === idx ? "bg-blue-50 border-l-4 border-l-blue-500" : "")}>
                    <div>
                      <div className={clsx("font-medium", i === idx ? "text-blue-900" : "text-gray-900")}>{p.text || p.phrase || p.word}</div>
                      <div className="text-xs text-gray-500 font-mono mt-1">/{p.phonetic || p.ipa}/</div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setIdx(i); playRefAudio(p); }} className="p-1.5 rounded-md hover:bg-blue-100 text-gray-400 hover:text-blue-600">
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {!prompts.length && <div className="p-4 text-center text-gray-500 italic">Trống</div>}
              </div>
            </div>
          </motion.div>

          {/* Right: Practice Area */}
          <motion.div className="lg:col-span-7" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
            {current ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex justify-between mb-6">
                  <button onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0} className="p-2 hover:bg-gray-100 rounded-full disabled:opacity-30"><ChevronLeft /></button>
                  <span className="text-sm font-mono text-gray-400 pt-2">{idx + 1}/{prompts.length}</span>
                  <button onClick={() => setIdx((i) => Math.min(prompts.length - 1, i + 1))} disabled={idx === prompts.length - 1} className="p-2 hover:bg-gray-100 rounded-full disabled:opacity-30"><ChevronRight /></button>
                </div>

                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">{current.text || current.word}</h2>
                  <p className="text-lg text-gray-500 font-mono">/{current.phonetic || current.ipa}/</p>
                </div>

                <div className="flex justify-center gap-6 mb-8">
                  <button onClick={() => playRefAudio(current)} className="flex flex-col items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center"><Volume2 /></div>
                    <span className="text-xs font-medium">Nghe mẫu</span>
                  </button>
                  <audio ref={audioRef} preload="auto" crossOrigin="anonymous" hidden />

                  {!recording ? (
                    <button onClick={start} className="flex flex-col items-center gap-2 text-gray-600 hover:text-emerald-600 transition-colors">
                      <motion.div whileHover={{ scale: 1.1 }} className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg hover:shadow-emerald-200"><Mic size={32} /></motion.div>
                      <span className="text-xs font-medium text-emerald-600">Ghi âm</span>
                    </button>
                  ) : (
                    <button onClick={stop} className="flex flex-col items-center gap-2 text-rose-600">
                      <motion.div variants={pulseVariants} animate="pulse" className="w-16 h-16 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg"><Square size={32} fill="currentColor" /></motion.div>
                      <span className="text-xs font-medium">Dừng ({fmtDuration(elapsed)})</span>
                    </button>
                  )}
                </div>

                <AnimatePresence>
                  {blob && !recording && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-center">
                      <audio src={URL.createObjectURL(blob)} controls className="mx-auto mb-4 h-8" />
                      <div className="flex justify-center gap-3">
                        <button onClick={reset} className="px-4 py-2 rounded-full border border-gray-300 text-sm hover:bg-gray-50">Thu lại</button>
                        <button onClick={submitAttempt} disabled={submitting} className="px-6 py-2 rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-70 flex items-center gap-2">
                          {submitting ? <Loader2 className="animate-spin w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />} Chấm điểm
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* LIVE FEEDBACK */}
                {history[0] && (history[0].id || history[0].prompt_id) && (
                  <motion.div key={history[0].id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-bold text-blue-900 flex items-center gap-2"><Activity className="w-4 h-4" /> Kết quả vừa thu</span>
                      <ScoreBadge score={history[0].score_overall || 0} />
                    </div>
                    <div className="mb-4"><ProgressBar value={history[0].score_overall || 0} /></div>
                    
                    {/* BẠN ĐÃ NÓI (RAW RECOGNIZED) */}
                    <div className="space-y-3">
                      <div className="bg-white/80 p-3 rounded-xl border border-white/50">
                         <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Bạn đã nói:</div>
                         <div className="text-lg leading-relaxed text-gray-800 font-medium">
                            {history[0].recognized || <span className="italic text-gray-400">Không nhận diện được</span>}
                         </div>
                      </div>

                      {/* CHI TIẾT CHẤM ĐIỂM (TARGET WORDS COLORED) */}
                      <div className="px-3">
                          <div className="text-xs text-gray-400 mb-1">Chi tiết chấm điểm:</div>
                          <div className="text-lg leading-relaxed">
                            {history[0].words && history[0].words.length > 0 ? (
                               history[0].words.map((w, idx) => <ColoredWord key={idx} word={w.word} score={w.score} />)
                            ) : (
                               <span className="text-gray-500 italic">{history[0].expected}</span>
                            )}
                          </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* --- LOCAL SESSION HISTORY --- */}
                <div className="mt-10 border-t border-gray-100 pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-base font-bold text-gray-800 flex items-center gap-2"><ListFilter className="w-4 h-4"/> Lịch sử phiên tập</h3>
                    <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">Tổng XP: {xpTotal}</span>
                  </div>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {history.map((h, index) => (
                      <motion.div key={h.id || index} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className="bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-colors shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-mono text-gray-400">{new Date(h.at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                {h.score_overall >= 80 ? <CheckCircle2 className="w-4 h-4 text-emerald-500"/> : <XCircle className="w-4 h-4 text-rose-400"/>}
                            </div>
                            <ScoreBadge score={h.score_overall} />
                        </div>
                        
                        {/* UPDATE HIỂN THỊ LỊCH SỬ CHO ĐÚNG LOGIC */}
                        <div className="mb-3 space-y-2">
                             {/* Dòng 1: User nói gì */}
                             <div>
                                 <span className="text-[10px] text-gray-400 uppercase font-bold mr-2">Bạn nói:</span>
                                 <span className="text-sm text-gray-800 font-medium">
                                     {h.recognized || <span className="italic text-gray-400">...</span>}
                                 </span>
                             </div>
                             
                             {/* Dòng 2: Mẫu câu / Chấm điểm */}
                             <div>
                                 <span className="text-[10px] text-gray-400 uppercase font-bold mr-2">Mẫu câu:</span>
                                 <span className="text-sm text-gray-600">
                                    {h.words && h.words.length > 0 ? (
                                        h.words.map((w, idx) => <ColoredWord key={`hist-${h.id}-${idx}`} word={w.word} score={w.score} />)
                                    ) : (
                                        h.expected
                                    )}
                                 </span>
                             </div>
                        </div>

                        {h.audio_path && (
                            <div className="bg-gray-50 rounded-lg p-2 flex items-center gap-2 mt-2">
                                <Volume2 className="w-3.5 h-3.5 text-gray-400"/>
                                <audio src={toApiOriginMediaUrl(h.audio_path)} controls className="w-full h-6" style={{ height: 24 }} />
                            </div>
                        )}
                      </motion.div>
                    ))}
                    {!history.length && <div className="text-center py-6 text-gray-400 text-sm italic">Chưa có lượt tập nào trong phiên này.</div>}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 bg-white rounded-2xl border border-gray-200 min-h-[400px]">Chọn một câu bên trái để luyện tập</div>
            )}
          </motion.div>
        </div>
      )}

      {/* --- MODAL GLOBAL HISTORY --- */}
      <AnimatePresence>
          {showHistoryModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                  <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden max-h-[80vh] flex flex-col"
                  >
                      <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                          <h3 className="font-bold text-gray-800 flex items-center gap-2">
                              <Clock className="w-5 h-5 text-blue-600"/> Lịch sử luyện tập
                          </h3>
                          <button onClick={() => setShowHistoryModal(false)} className="p-1 hover:bg-gray-200 rounded-full">
                              <X className="w-5 h-5 text-gray-500"/>
                          </button>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                          {loadingHistory ? (
                              <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-blue-500"/></div>
                          ) : pastSessions.length === 0 ? (
                              <div className="text-center py-10 text-gray-400">Chưa có lịch sử luyện tập.</div>
                          ) : (
                              <div className="space-y-3">
                                  {pastSessions.map((item) => (
                                      <div key={item.id} className="p-4 border border-gray-100 rounded-xl hover:border-blue-200 transition-colors flex flex-col gap-2 group bg-white shadow-sm">
                                          <div className="flex justify-between items-start">
                                              <div className="font-semibold text-gray-800 text-sm">
                                                  {item.skill_title || `Skill #${item.skill}`}
                                              </div>
                                              <div className={clsx("text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border",
                                                    item.status === 'completed' ? "border-emerald-200 text-emerald-600 bg-emerald-50" :
                                                    item.status === 'failed' ? "border-rose-200 text-rose-600 bg-rose-50" : "border-gray-200 text-gray-500 bg-gray-50"
                                               )}>
                                                   {item.status}
                                               </div>
                                          </div>

                                          <div className="text-xs text-gray-400 flex items-center gap-2">
                                              <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3"/> {new Date(item.started_at).toLocaleString()}</span>
                                              {item.lesson_title && (
                                                  <span className="text-[10px] text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">
                                                      {item.lesson_title}
                                                  </span>
                                              )}
                                          </div>

                                          <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-1">
                                              <div className="flex gap-3 text-xs">
                                                  <div className="flex flex-col items-center">
                                                      <span className="text-[10px] text-gray-400 uppercase">Avg</span>
                                                      <span className="font-bold text-gray-700">{Math.round(item.avg_score || 0)}</span>
                                                  </div>
                                                  <div className="flex flex-col items-center border-l border-gray-100 pl-3">
                                                      <span className="text-[10px] text-gray-400 uppercase">Attempts</span>
                                                      <span className="font-bold text-gray-700">{item.attempts_count || 0}</span>
                                                  </div>
                                                  <div className="flex flex-col items-center border-l border-gray-100 pl-3">
                                                      <span className="text-[10px] text-gray-400 uppercase">XP</span>
                                                      <span className="font-bold text-amber-600">+{item.xp_earned}</span>
                                                  </div>
                                              </div>

                                              <div className="text-right">
                                                  <div className="text-[10px] text-gray-400 uppercase">Best</div>
                                                  <div className={clsx("text-lg font-bold leading-none", 
                                                       (item.best_score || 0) >= 80 ? "text-emerald-600" : 
                                                       (item.best_score || 0) >= 50 ? "text-amber-600" : "text-rose-500"
                                                  )}>
                                                       {Math.round(item.best_score || 0)}
                                                  </div>
                                              </div>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          )}
                      </div>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>

      {!ctxEnrollId && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800 flex items-start gap-3">
          <Info className="w-5 h-5 mt-0.5" />
          <div>
            <div className="font-semibold mb-1">Thiếu ngữ cảnh học</div>
            <div>Không tìm thấy <code>enrollment_id</code>. Đã đọc <code>localStorage.learn</code> (L2).</div>
          </div>
        </motion.div>
      )}
    </div>
  );
}