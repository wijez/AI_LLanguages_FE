import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useSelector } from "react-redux"; 
import { useLocation } from "react-router-dom";
import { api } from "../../api/api";
import { clsx } from "../../components/chat/utils";
import { MessageBubble } from "../../components/chat/MessageBubble";
import { ContextCard } from "../../components/chat/ContextCard";
import { PronCard } from "../../components/chat/PronCard";
import { ModeSwitch } from "../../components/chat/ModeSwitch";
import { useVoiceRecorder } from "../../components/chat/useVoiceRecorder";
import { useTimeline } from "../../components/chat/useTimeline";
import { FeedbackBubble } from "../../components/chat/FeedbackBubble";
import { selectUser } from "../../store/selectors"; 

const STORAGE_KEY = "roleplay_practice_session"; 

const ROLE_OPTIONS = [
  { id: "student_a", label: "Student A" },
  { id: "student_b", label: "Student B" },
  { id: "teacher", label: "Teacher" },
  { id: "narrator", label: "Narrator" },
  { id: "assistant", label: "Assistant" },
];

export default function RoleplayChatDemo({
  embedded = false,
  defaultRole = "student_b",
  autoStart = true,
}) {
  const user = useSelector(selectUser);
  const location = useLocation();
  
  const initialScenario = location.state?.scenario || "";
  const initialMode = location.state?.mode || "roleplay";

  const [mode, setMode] = useState(initialMode); 
  const [scenario, setScenario] = useState(initialScenario);
  const [scenarioOpts, setScenarioOpts] = useState([]);
  const [scLoading, setScLoading] = useState(false);
  const [userRole, setUserRole] = useState(defaultRole);
  const [sessionId, setSessionId] = useState("");
  const [historyMessages, setHistoryMessages] = useState([]); 
  const [awaitUser, setAwaitUser] = useState(null); 
  const [finished, setFinished] = useState(false);
  const [input, setInput] = useState("");
  const [loadingStart, setLoadingStart] = useState(false);
  const [loadingSend, setLoadingSend] = useState(false);
  const [error, setError] = useState("");
  const [isRestored, setIsRestored] = useState(false); 

  const [showHistory, setShowHistory] = useState(false);
  const [historyList, setHistoryList] = useState([]);

  const scrollRef = useRef(null);
  const messagesEndRef = useRef(null);

  const { recOn, recBusy, startRecording, stopRecording } = useVoiceRecorder();

  const handleStepFinish = useCallback((item) => {
    setHistoryMessages((prev) => {
      if (prev.some((m) => m.id === item.id)) return prev;
      return [...prev, item];
    });
  }, []);

  const {
    queue,
    activeItem,
    progress,
    isWaiting,
    addBlocks,
    skipCurrent,
    clearTimeline,
  } = useTimeline({ onStepFinish: handleStepFinish });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [historyMessages.length, activeItem?.id]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.sessionId && data.mode === "practice" && !initialScenario) {
          setMode(data.mode);
          setScenario(data.scenario);
          setUserRole(data.userRole);
          setSessionId(data.sessionId);
          setHistoryMessages(data.historyMessages || []);
          setIsRestored(true);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [initialScenario]);

  useEffect(() => {
    if (mode === "practice" && sessionId && historyMessages.length > 0) {
      const stateToSave = {
        mode,
        scenario,
        userRole,
        sessionId,
        historyMessages,
        timestamp: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    }
  }, [mode, scenario, userRole, sessionId, historyMessages]);

  const clearSessionStorage = () => {
    localStorage.removeItem(STORAGE_KEY);
    setIsRestored(false);
  };

  const resetUI = (fullClear = false) => {
    setSessionId("");
    setHistoryMessages([]);
    clearTimeline();
    setAwaitUser(null);
    setFinished(false);
    setInput("");
    setError("");
    if (fullClear) {
      clearSessionStorage();
    }
  };

  useEffect(() => {
    const loadScenarios = async () => {
      setScLoading(true);
      try {
        const data = await api.RoleplayScenarios.list();
        const items = Array.isArray(data) ? data : data?.results || [];
        const all = items
          .filter((it) => it?.slug)
          .map((it) => ({ slug: it.slug, title: it.title || it.slug }));
        setScenarioOpts(all);
        if (!scenario) setScenario(all[0]?.slug || "");
      } catch (e) {
        setError(`Load scenarios failed: ${e.message || e}`);
      } finally {
        setScLoading(false);
      }
    };
    loadScenarios();
  }, [scenario]);

  const fetchHistory = async () => {
    if (!user) {
        setError("Please login to view history.");
        return;
    }
    try {
      if (showHistory) {
        setShowHistory(false);
        return;
      }
      const res = await api.RoleplaySession.history();
      const list = Array.isArray(res) ? res : (res.results || []);
      setHistoryList(list);
      setShowHistory(true);
    } catch (e) {
      setError("Failed to load history: " + e.message);
    }
  };

  const handleResume = async (histItem) => {
    try {
      setShowHistory(false);
      resetUI(true); 
      setLoadingStart(true);
      const data = await api.RoleplaySession.resume(histItem.id);
      setMode("practice");
      setSessionId(data.id);
      setScenario(data.scenario_slug || scenario); 
      setUserRole(data.role || defaultRole);
      
      const restoredMsgs = (data.history_log || []).flatMap((turn, idx) => {
        const textContent = Array.isArray(turn.parts) ? turn.parts.join(" ") : turn.parts;
        const uiItems = [];

        if (turn.role === "user") {
           uiItems.push({
             id: `hist-${idx}-user`,
             role: data.role || defaultRole,
             text: textContent,
             side: "right",
           });
        } else if (turn.role === "model") {
           uiItems.push({
             id: `hist-${idx}-ai`,
             role: "assistant",
             text: textContent,
             side: "left",
           });
        }
        return uiItems;
      });

      setHistoryMessages(restoredMsgs);
      setIsRestored(true);
    } catch (e) {
      setError("Cannot resume session: " + e.message);
    } finally {
      setLoadingStart(false);
    }
  };

  const startRoleplay = async () => {
    resetUI(true); 
    if (!scenario) return setError("Please select a scenario");
    setLoadingStart(true);
    try {
      const data = await api.RoleplaySession.start({
        scenario,
        role: userRole,
      });
      setSessionId(data.session_id);
      setFinished(false);
      const blocks = [
        ...(data.prologue || []),
        ...(data.ai_utterances || [])
      ].map((b, i) => ({
        id: `tl-${Date.now()}-${i}`,
        role: b.role,
        text: b.text,
        audio_key: b.audio_key,
        side: "left",
        meta: { section: b.section, order: b.order },
        waitAfter: 1500,
      }));
      addBlocks(blocks);
      setAwaitUser(data.await_user || null);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoadingStart(false);
    }
  };

  const startPracticeSession = async () => {
    if (isRestored && sessionId) {
      setIsRestored(false); 
      return;
    }
    resetUI(true); 
    if (!scenario) return; 
    setLoadingStart(true);
    try {
      const lang = localStorage.getItem("lang") || "vi"
      const data = await api.RoleplaySession.startPractice({
        scenario,
        role: userRole,
        language: lang,
      });
      
      setSessionId(data.session_id);
      const timelineItems = [];

      if (Array.isArray(data.prologue)) {
        data.prologue.forEach((b, i) => {
          timelineItems.push({
            id: `intro-${Date.now()}-${i}`,
            role: "system", 
            text: b.text, 
            side: "left",
            audio_key: b.audio_key, 
            meta: { section: b.section, order: b.order },
            waitAfter: 2000,
          });
        });
      }

      if (data.ai_greeting) {
        timelineItems.push({
          id: `warmup-${Date.now()}`,
          role: "assistant",
          text: data.ai_greeting.text,
          side: "left",
          audio_key: data.ai_greeting.audio_key, 
          waitAfter: 0,
        });
      }

      addBlocks(timelineItems);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoadingStart(false);
    }
  };

  useEffect(() => {
    if (!autoStart || !scenario) return;
    if (sessionId && isRestored) return;
    clearTimeline(); 
    if (!sessionId) {
        if (mode === "roleplay") startRoleplay();
        else if (mode === "practice") startPracticeSession();
    }
  }, [mode, userRole, scenario]);

  const submitPracticeInput = async (transcript) => {
    if (!sessionId) {
        setError("Practice session expired. Please restart.");
        return;
    }
    
    // 1. Hiển thị tin nhắn của User ngay lập tức
    const userMsg = { id: `u-${Date.now()}`, role: userRole, text: transcript, side: "right" };
    setHistoryMessages((prev) => [...prev, userMsg]);
    
    try {
        // 2. Gọi API gửi câu trả lời
        const res = await api.RoleplaySession.submitPractice({ session_id: sessionId, transcript: transcript });
        
        // 3. Hiển thị Feedback nếu có lỗi
        // Cấu trúc response: { feedback: { has_error: bool, original, corrected, explanation }, ai_text, ai_audio, ... }
        if (res.feedback && res.feedback.has_error) {
            setHistoryMessages((prev) => [
              ...prev, 
              { 
                id: `fb-${Date.now()}`, 
                type: "feedback", 
                data: {
                    original: res.feedback.original || transcript,
                    corrected: res.feedback.corrected,
                    explanation: res.feedback.explanation
                } 
              }
            ]);
        }

        // 4. Hiển thị câu trả lời của AI
        if (res.ai_text) {
             addBlocks([{ 
                id: `ai-${Date.now()}`, 
                role: "assistant", 
                text: res.ai_text,
                audio_key: res.ai_audio, 
                side: "left", 
                waitAfter: 1500 
            }]);
        }

    } catch (e) {
        const errorMsg = e.response?.data?.detail || e.message || String(e);
        if (errorMsg === "Invalid session" || e.response?.status === 400 || e.response?.status === 404) {
             setError("Session expired. Starting new...");
             setTimeout(() => resetUI(true), 1500);
        } else {
             setError(errorMsg);
             setHistoryMessages((prev) => [...prev, { id: `err-${Date.now()}`, role: "system", text: "AI Error: " + errorMsg, side: "left" }]);
        }
    }
  };

  const submitRoleplayInput = async (line, pron = null) => {
    setHistoryMessages((m) => [...m, { id: `u-${Date.now()}`, role: userRole, text: line, side: "right" }]);
    const body = pron ? { session_id: sessionId, transcript: line, pron } : { session_id: sessionId, transcript: line };
    const res = await api.RoleplaySession.submit(body);
    if (res.status === "finished") {
        setFinished(true);
        setAwaitUser(null);
        setHistoryMessages((m) => [...m, { id: `done-${Date.now()}`, role: "teacher", side: "left", text: "Scenario finished!" }]);
        return;
    }
    if (res.passed === false) {
        setHistoryMessages((m) => [...m, { id: `fb-${Date.now()}`, role: "teacher", side: "left", text: res.feedback || "Try again." }]);
        return;
    }
    const scoreTag = res.score?.cosine ? ` (cos ${res.score.cosine})` : "";
    setHistoryMessages((m) => [...m, { id: `ok-${Date.now()}`, role: "teacher", side: "left", text: `✓ Good!${scoreTag}` }]);
    const nextAi = (res.next_ai || []).map((a, i) => ({ id: `nai-${Date.now()}-${i}`, role: a.role, text: a.text, audio_key: a.audio_key, side: "left", waitAfter: 1500 }));
    addBlocks(nextAi);
    setAwaitUser(res.await_user || null);
    if (res.finished) setFinished(true);
  };

  const handleSend = async () => {
    const line = input.trim();
    if (!line) return;
    setInput("");
    setLoadingSend(true);
    setError("");
    try {
      if (mode === "practice") await submitPracticeInput(line);
      else {
        if (!awaitUser || !sessionId) throw new Error("Not ready yet");
        await submitRoleplayInput(line);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingSend(false);
    }
  };

  const handleRecordingStop = async (base64) => {
    try {
      const payload = { audio_base64: `data:audio/webm;base64,${base64}`, language_code: "en", lang: "en" };
      let recognized = "";
      if (mode === "practice") {
        const res = await api.SpeechPron.stt(payload);
        recognized = res.text || res.recognized || "";
        if (!recognized) throw new Error("Could not hear anything.");
        await submitPracticeInput(recognized);
      } else {
        const target = awaitUser?.expected_text || "";
        if (target) payload.expected_text = target;
        const stt = await api.SpeechPron.up(payload);
        recognized = stt.recognized || stt.text || "";
        if (!recognized) throw new Error("No text recognized");
        const pron = { recognized, score_overall: stt.score_overall, words: stt.words || [], details: stt.details };
        setHistoryMessages((m) => [...m, { id: `pron-${Date.now()}`, type: "pron", pron }]);
        await submitRoleplayInput(recognized, pron);
      }
    } catch (e) {
      setError(e.message);
    } finally {
        setLoadingSend(false);
    }
  };

  const toggleRec = async () => {
    if (recBusy) return;
    if (!recOn) await startRecording(handleRecordingStop);
    else stopRecording();
  };

  const isUserTurn = mode === "practice" 
      ? (!activeItem && queue.length === 0) 
      : (!activeItem && queue.length === 0 && awaitUser && !finished);

  const nextExpectedHint = useMemo(() => {
    if (mode !== "roleplay") return "";
    return awaitUser?.expected_hint || "";
  }, [awaitUser, mode]);

  const renderItem = (m) => {
    if (!m) return null;
    const isActive = activeItem && m.id === activeItem.id;
    if (m.type === "pron") return <PronCard key={m.id} pron={m.pron} />;
    if (m.type === "context") return <ContextCard key={m.id} items={m.context} />;
    if (m.type === "feedback") return <FeedbackBubble key={m.id} {...m.data} />;
    return <MessageBubble key={m.id} side={m.side} role={m.role} text={m.text} meta={m.meta} audioKey={m.audio_key} timelineActive={isActive} timelineProgress={isActive ? progress : 0} isWaiting={isActive ? isWaiting : false} onSkip={isActive ? skipCurrent : undefined} />;
  };

  const displayMessages = [...historyMessages];
  if (activeItem) displayMessages.push(activeItem);

  if (embedded) {
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="flex items-center gap-2 border-b border-slate-200 px-2 py-2 bg-slate-50 relative flex-wrap">
          <ModeSwitch mode={mode} setMode={(m) => { setMode(m); resetUI(true); }} resetUI={() => resetUI(true)} />
          <select className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs shadow-sm" value={userRole} onChange={(e) => { setUserRole(e.target.value); resetUI(true); }}>
            {ROLE_OPTIONS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
          {!showHistory && (
            <select className="flex-1 min-w-0 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs shadow-sm" value={scenario} onChange={(e) => { setScenario(e.target.value); resetUI(true); }} disabled={scLoading || !scenarioOpts.length}>
                {scLoading && <option>Loading…</option>}
                {!scLoading && !scenarioOpts.length && <option>No scenarios</option>}
                {scenarioOpts.map((s) => <option key={s.slug} value={s.slug}>{s.title}</option>)}
            </select>
          )}
          <div className="flex gap-1">
            {mode === "roleplay" && <button onClick={startRoleplay} disabled={loadingStart || !scenario} className="rounded-md border bg-white px-2 py-1 text-xs shadow-sm hover:bg-slate-50">Start</button>}
            {mode === "practice" && (
                <>
                    {user && <button onClick={fetchHistory} className={clsx("rounded-md border px-2 py-1 text-xs shadow-sm flex items-center gap-1", showHistory ? "bg-blue-100 text-blue-700 border-blue-300" : "bg-white hover:bg-slate-50")} title="History"><span>📜</span></button>}
                    <button onClick={() => resetUI(true)} className="rounded-md border bg-slate-100 px-2 py-1 text-xs shadow-sm hover:bg-slate-200" title="Start new session">New</button>
                </>
            )}
          </div>
          {showHistory && (
            <div className="absolute top-full left-0 w-full bg-white border border-slate-200 shadow-xl z-20 max-h-60 overflow-y-auto rounded-b-lg">
                <div className="sticky top-0 bg-slate-50 p-2 border-b border-slate-200 flex justify-between items-center text-xs font-semibold text-slate-600">
                    <span>Recent Sessions</span>
                    <button onClick={() => setShowHistory(false)} className="hover:text-red-500">✕</button>
                </div>
                {historyList.length === 0 ? <div className="p-4 text-center text-xs text-slate-400">No history found.</div> : historyList.map(item => (
                    <div key={item.id} onClick={() => handleResume(item)} className="p-2 border-b border-slate-100 hover:bg-blue-50 cursor-pointer text-xs flex justify-between items-center">
                        <div>
                            <div className="font-medium text-slate-800">{item.scenario_title || item.scenario_slug}</div>
                            <div className="text-[10px] text-slate-500">{new Date(item.created_at).toLocaleString()}</div>
                        </div>
                        <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] uppercase">{item.role}</span>
                    </div>
                ))}
            </div>
          )}
        </div>
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/60">
          {displayMessages.map(renderItem)}
          {mode === "roleplay" && isUserTurn && <MessageBubble key="await" side="left" role={awaitUser.role} text={nextExpectedHint || "It's your turn."} highlight meta={{ order: awaitUser.order }} />}
          <div ref={messagesEndRef} />
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-slate-200 p-2">
           <div className="text-[11px] text-slate-500">{recOn ? "Listening…" : recBusy ? "Processing…" : isUserTurn ? "Speak now" : "Waiting..."}</div>
           <button onClick={toggleRec} disabled={!isUserTurn || loadingSend || recBusy} className={clsx("inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-sm transition", recOn ? "bg-red-600 text-white animate-pulse" : "bg-blue-600 text-white", (!isUserTurn || loadingSend || recBusy) && "bg-slate-300 cursor-not-allowed")}>{recOn ? "Stop" : "Speak"}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100vh] w-full bg-gradient-to-b from-slate-50 to-slate-100 py-8">
      <div className="mx-auto w-full max-w-3xl px-4">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div><h1 className="text-xl font-semibold text-slate-800">Roleplay / Practice</h1></div>
          <div className="flex flex-wrap items-center gap-2 relative">
            <ModeSwitch mode={mode} setMode={(m) => { setMode(m); resetUI(true); }} resetUI={() => resetUI(true)} />
            <select className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm shadow-sm font-medium text-slate-700" value={userRole} onChange={(e) => { setUserRole(e.target.value); resetUI(true); }}>
              {ROLE_OPTIONS.map(r => <option key={r.id} value={r.id}>Role: {r.label}</option>)}
            </select>
            <select className="w-48 lg:w-64 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm shadow-sm font-medium text-slate-700" value={scenario} onChange={(e) => { setScenario(e.target.value); resetUI(true); }}>
                {scenarioOpts.map((s) => <option key={s.slug} value={s.slug}>{s.title}</option>)}
            </select>
            {mode === "roleplay" ? <button onClick={startRoleplay} className="rounded-lg border bg-white px-4 py-1.5 text-sm font-semibold shadow-sm hover:bg-slate-50 text-slate-700">{loadingStart ? "Starting..." : "Start"}</button> : <div className="flex gap-2">{user && <button onClick={fetchHistory} className={clsx("rounded-lg border px-3 py-1.5 text-sm shadow-sm flex items-center gap-1", showHistory ? "bg-blue-100 border-blue-400" : "bg-white hover:bg-slate-50")}><span>📜 History</span></button>}<button onClick={() => resetUI(true)} className="rounded-lg border bg-white px-3 py-1.5 text-sm shadow-sm hover:bg-slate-50">New Session</button></div>}
            {showHistory && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden">
                    <div className="bg-slate-50 p-3 border-b border-slate-100 flex justify-between items-center">
                        <span className="font-semibold text-sm text-slate-700">Practice History</span>
                        <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                        {historyList.length === 0 ? <div className="p-4 text-center text-sm text-slate-400">No history found.</div> : historyList.map(item => (
                                <div key={item.id} onClick={() => handleResume(item)} className="p-3 border-b border-slate-50 hover:bg-blue-50 cursor-pointer transition-colors" >
                                    <div className="font-medium text-sm text-slate-900">{item.scenario_title || item.scenario_slug}</div>
                                    <div className="text-xs text-slate-500 mt-1 flex justify-between">
                                        <span>{new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString()}</span>
                                        <span className="uppercase bg-slate-100 px-1 rounded">{item.role}</span>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white shadow-md flex flex-col h-[70vh]">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/60">
            {displayMessages.map(renderItem)}
            {mode === "roleplay" && isUserTurn && <MessageBubble key="await" side="left" role={awaitUser.role} text={nextExpectedHint || "It's your turn."} highlight meta={{ order: awaitUser.order }} />}
            <div ref={messagesEndRef} />
          </div>
          <div className="flex items-center gap-2 border-t border-slate-200 p-3">
            <input className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder={mode === "practice" ? "Ask anything..." : (isUserTurn ? "Type here..." : "Waiting...")} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()} disabled={loadingSend || !isUserTurn} />
            <button onClick={handleSend} disabled={!input.trim() || loadingSend || !isUserTurn} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-500">Send</button>
            <button onClick={toggleRec} disabled={recBusy || loadingSend || !isUserTurn} className={clsx("rounded-xl px-3 py-2 text-sm font-medium shadow-sm transition", recOn ? "bg-red-600 text-white animate-pulse" : "bg-slate-100 text-slate-700 hover:bg-slate-200", (!isUserTurn) && "opacity-50 cursor-not-allowed")}>{recOn ? "Stop" : "🎙️"}</button>
          </div>
        </div>
        <div className="mt-3 flex justify-between text-xs text-slate-500">
           <span>Session: {sessionId || "—"}</span>
           {error && <span className="text-red-600">{error}</span>}
        </div>
      </div>
    </div>
  );
}