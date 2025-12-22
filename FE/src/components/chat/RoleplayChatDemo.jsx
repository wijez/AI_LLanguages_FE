import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { api } from "../../api/api";
import { clsx } from "../../components/chat/utils";
import { MessageBubble } from "../../components/chat/MessageBubble";
import { ContextCard } from "../../components/chat/ContextCard";
import { PronCard } from "../../components/chat/PronCard";
import { ModeSwitch } from "../../components/chat/ModeSwitch";
import { useVoiceRecorder } from "../../components/chat/useVoiceRecorder";
import { useTimeline } from "../../components/chat/useTimeline";

export default function RoleplayChatDemo({
  embedded = false,
  defaultRole = "student_b",
  autoStart = true,
}) {
  // Mode state
  const [mode, setMode] = useState("roleplay"); // 'roleplay' | 'practice'

  // Scenario state
  const [scenario, setScenario] = useState("");
  const [scenarioOpts, setScenarioOpts] = useState([]);
  const [scLoading, setScLoading] = useState(false);

  // Session state
  const [userRole, setUserRole] = useState(defaultRole);
  const [sessionId, setSessionId] = useState("");
  
  // History: Chứa các tin nhắn đã hoàn thành
  const [historyMessages, setHistoryMessages] = useState([]);
  const [awaitUser, setAwaitUser] = useState(null);
  const [finished, setFinished] = useState(false);

  // Input state
  const [input, setInput] = useState("");
  const [loadingStart, setLoadingStart] = useState(false);
  const [loadingSend, setLoadingSend] = useState(false);
  const [error, setError] = useState("");
  
  // Refs
  const scrollRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Voice recording
  const { recOn, recBusy, startRecording, stopRecording } = useVoiceRecorder();

  // Hàm này đảm bảo card được lưu vào lịch sử ngay khi timeline chạy xong card đó
  const handleStepFinish = useCallback((item) => {
    setHistoryMessages((prev) => {
        // Kiểm tra trùng lặp
        if (prev.some(m => m.id === item.id)) return prev;
        return [...prev, item];
    });
  }, []);

  // Truyền handleStepFinish vào hook để nhận tín hiệu
  const { 
    queue, 
    activeItem, 
    progress, 
    isWaiting, 
    addBlocks, 
    skipCurrent, 
    clearTimeline 
  } = useTimeline({ onStepFinish: handleStepFinish });

  // Cuộn xuống khi có tin nhắn mới hoặc activeItem thay đổi
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [historyMessages.length, activeItem?.id]);


  // --- Helper Functions ---
  const resetUI = () => {
    setSessionId("");
    setHistoryMessages([]);
    clearTimeline();
    setAwaitUser(null);
    setFinished(false);
    setInput("");
    setError("");
  };

  // Load scenarios
  const loadScenarios = async () => {
    setScLoading(true);
    try {
      const data = await api.RoleplayScenarios.list();
      const items = Array.isArray(data) ? data : data?.results || [];
      const all = items
        .filter((it) => it?.slug)
        .map((it) => ({ slug: it.slug, title: it.title || it.slug }));
      setScenarioOpts(all);
      setScenario((prev) => prev || (all[0]?.slug || ""));
    } catch (e) {
      setError(`Load scenarios failed: ${e.message || e}`);
    } finally {
      setScLoading(false);
    }
  };

  const loadPracticeBlocks = async () => {
    resetUI();
    if (!scenario) return;
  
    setLoadingStart(true);
  
    try {
      const data = await api.RoleplaySession.practice({ scenario });
  
      const blocks = (data.blocks || []).map((b, i) => ({
        id: `prac-${Date.now()}-${i}`,
        role: b.role || "assistant",
        text: b.text,
        audio_key: b.audio_key,
        side: "left",
        meta: { section: b.section, order: b.order },
        waitAfter: 1500,
      }));
  
      // Đưa vào timeline để auto-play
      addBlocks(blocks);
  
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoadingStart(false);
    }
  };
  
  useEffect(() => {
    loadScenarios();
  }, []);

  const startRoleplay = async () => {
    resetUI();
    if (!scenario) return setError("Please select a scenario");

    setLoadingStart(true);

    try {
      const data = await api.RoleplaySession.start({
        scenario,
        role: userRole,
      });

      setSessionId(data.session_id);
      setFinished(false);

      // 1. Chuẩn bị blocks từ API
      const blocks = [...(data.prologue || []), ...(data.ai_utterances || [])].map((b, i) => ({
        id: `tl-${Date.now()}-${i}`,
        role: b.role,
        text: b.text,
        audio_key: b.audio_key,
        side: "left",
        meta: { section: b.section, order: b.order },
        waitAfter: 2000, // Thời gian chờ giữa các câu
      }));

      // 2. Add vào Timeline
      addBlocks(blocks);

      // 3. Set awaitUser
      setAwaitUser(data.await_user || null);

    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoadingStart(false);
    }
  };

  // Check UI State: User được nhập khi không còn gì chạy và đang đợi
  const isUserTurn = !activeItem && queue.length === 0 && awaitUser && !finished;

  // INIT per mode/role/scenario
  useEffect(() => {
    if (!autoStart) return;
    if (mode === "roleplay" && scenario) startRoleplay();
    if (mode === "practice" && scenario) {
      loadPracticeBlocks();
    }
  }, [mode, userRole, scenario]);

  // PRACTICE: ask gemini
  // const askGemini = async (query) => {
  //   try {
  //     const body = { query, top_k: 8 };
  //     if (scenario) body.scenario = scenario;
  //     const data = await api.RoleplayBlocks.askGemini(body);
  //     const answer = (data && data.answer) || "(no answer)";
  //     const ctx = Array.isArray(data?.context) ? data.context : [];

  //     setHistoryMessages((m) => [
  //       ...m,
  //       { id: `ans-${Date.now()}`, role: "assistant", text: answer, side: "left" },
  //       { id: `ctx-${Date.now()}`, type: "context", context: ctx },
  //     ]);
  //   } catch (e) {
  //     setHistoryMessages((m) => [
  //       ...m,
  //       { id: `err-${Date.now()}`, role: "assistant", side: "left", text: `Ask error: ${e.message}` },
  //     ]);
  //   }
  // };
  const askGemini = async (query) => {
    try {
      const data = await api.RoleplaySession.practice_gemini({
        scenario,
        query,
      });
  
      setHistoryMessages((m) => [
        ...m,
        {
          id: `ans-${Date.now()}`,
          role: "assistant",
          text: data.answer,
          side: "left",
        },
        {
          id: `ctx-${Date.now()}`,
          type: "context",
          context: data.context || [],
        },
      ]);
    } catch (e) {
      setHistoryMessages((m) => [
        ...m,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          side: "left",
          text: `${e.message}`,
        },
      ]);
    }
  };
  

  // SUBMIT (roleplay)
  const sendToSubmit = async (line, pron = null) => {
    // Đẩy tin nhắn User vào History ngay lập tức
    setHistoryMessages((m) => [
       ...m, 
       { id: `u-${Date.now()}`, role: userRole, text: line, side: "right" }
    ]);
    
    // Gọi API
    const body = pron
      ? { session_id: sessionId, transcript: line, pron }
      : { session_id: sessionId, transcript: line };
      
    const res = await api.RoleplaySession.submit(body);

    if (res.status === "finished") {
      setFinished(true);
      setAwaitUser(null);
      setHistoryMessages((m) => [
        ...m,
        { id: `done-${Date.now()}`, role: "teacher", side: "left", text: "Scenario finished. Great job!" },
      ]);
      return;
    }

    if (res.passed === false) {
      setHistoryMessages((m) => [
        ...m,
        { id: `fb-${Date.now()}`, role: "teacher", side: "left", text: res.feedback || "Try again." },
      ]);
      return;
    }

    // PASSED
    const scoreTag = res.score?.cosine ? ` (cos ${res.score.cosine})` : "";
    setHistoryMessages((m) => [
      ...m,
      { id: `ok-${Date.now()}`, role: "teacher", side: "left", text: `✓ Good!${scoreTag}` },
    ]);

    // Next AI
    const nextAi = (res.next_ai || []).map((a, i) => ({
      id: `nai-${Date.now()}-${i}`,
      role: a.role,
      text: a.text,
      audio_key: a.audio_key,
      side: "left",
      waitAfter: 2000,
    }));
    
    addBlocks(nextAi);

    setAwaitUser(res.await_user || null);
    if (res.finished) {
        setFinished(true);
    }
  };

  const handleSend = async () => {
    const line = input.trim();
    if (!line) return;
    
    setLoadingSend(true);
    setError("");
    setInput("");

    try {
      if (mode === "practice") {
        setHistoryMessages(m => [...m, { id: `u-${Date.now()}`, role: userRole, text: line, side: "right" }]);
        await askGemini(line);
      } else {
        if (!awaitUser || !sessionId) throw new Error("Not ready yet");
        await sendToSubmit(line);
      }
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoadingSend(false);
    }
  };

  const handleRecordingStop = async (base64) => {
    try {
      const payload = {
        audio_base64: `data:audio/webm;base64,${base64}`,
        language_code: "en",
        lang: "en",
      };

      const target = awaitUser?.expected_text || awaitUser?.expected_hint || "";
      if (mode === "roleplay" && target) {
        payload.expected_text = target;
        payload.target_text = target;
      }

      const stt = await api.SpeechPron.up(payload);
      const recognized = stt.recognized || stt.text || "";

      if (!recognized) throw new Error("Không nhận được văn bản từ STT");

      if (mode === "practice") {
         setHistoryMessages((m) => [
            ...m,
            { id: `u-${Date.now()}`, role: userRole, text: recognized, side: "right" },
         ]);
         await askGemini(recognized);
      } else {
        const pron = {
          recognized,
          score_overall: stt.score_overall,
          words: Array.isArray(stt.words) ? stt.words : [],
          details: stt.details || {},
        };
        // Hiện thẻ Pron trước
        setHistoryMessages((m) => [...m, { id: `pron-${Date.now()}`, type: "pron", pron }]);
        
        setLoadingSend(true);
        await sendToSubmit(recognized, pron);
      }
    } catch (e) {
      setError(e.message || String(e));
      setHistoryMessages((m) => [
        ...m,
        { id: `err-${Date.now()}`, role: "teacher", side: "left", text: ` ${e.message}` },
      ]);
    } finally {
      setLoadingSend(false);
    }
  };

  const toggleRec = async () => {
    if (recBusy) return;
    if (!recOn) await startRecording(handleRecordingStop);
    else stopRecording();
  };

  const nextExpectedHint = useMemo(() => {
    if (mode !== "roleplay") return "";
    return awaitUser?.expected_hint || "";
  }, [awaitUser, mode]);

  // Combine Messages for Render: History + Active Item (nếu có)
  const displayMessages = [...historyMessages];
  if (activeItem) {
      displayMessages.push(activeItem);
  }

  // --- RENDER ---
  
  // Render Helper cho từng item để tránh lặp code
  const renderItem = (m) => {
    if (!m) return null;
    const isActive = activeItem && m.id === activeItem.id;

    if (m.type === "pron") return <PronCard key={m.id} pron={m.pron} />;
    if (m.type === "context") return <ContextCard key={m.id} items={m.context} />;

    return (
      <MessageBubble
        key={m.id}
        side={m.side}
        role={m.role}
        text={m.text}
        meta={m.meta}
        audioKey={m.audio_key}
        // Timeline Props
        timelineActive={isActive}
        timelineProgress={isActive ? progress : 0}
        isWaiting={isActive ? isWaiting : false}
        onSkip={isActive ? skipCurrent : undefined}
      />
    );
  };
  
  if (embedded) {
    return (
      <div className="h-full flex flex-col bg-white">
        {/* Toolbar */}
        <div className="flex items-center gap-2 border-b border-slate-200 px-2 py-2 bg-slate-50">
          <ModeSwitch mode={mode} setMode={setMode} resetUI={resetUI} />
          <select
            className="flex-1 min-w-0 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs shadow-sm"
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            disabled={scLoading || !scenarioOpts.length}
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
              >
                <option value="student_a">A</option>
                <option value="student_b">B</option>
                <option value="teacher">Tch</option>
              </select>
              <button
                onClick={startRoleplay}
                disabled={loadingStart || !scenario}
                className="rounded-md border bg-white px-3 py-1 text-xs shadow-sm hover:bg-slate-50"
              >
                {loadingStart ? "…" : "Start"}
              </button>
            </>
          )}
        </div>

        {/* Messages Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/60">
          {displayMessages.map(renderItem)}
          
          {mode === "roleplay" && isUserTurn && (
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
            <div className="mt-6 text-center text-xs text-emerald-700">
              🎉 Scenario finished.
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Composer */}
        <div className="flex items-center justify-between gap-2 border-t border-slate-200 p-2">
           <div className="text-[11px] text-slate-500">
             {recOn ? "Listening…" : recBusy ? "Processing…" : isUserTurn ? "Speak now" : "Waiting..."}
           </div>
           <button
             onClick={toggleRec}
             disabled={(mode === "roleplay" && !isUserTurn) || loadingSend || recBusy}
             className={clsx(
               "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-sm",
               recOn ? "bg-red-600 text-white" : "bg-blue-600 text-white"
             )}
           >
              {recOn ? "Stop" : "Speak"}
           </button>
        </div>
      </div>
    );
  }

  // Full Page Layout
  return (
    <div className="min-h-[100vh] w-full bg-gradient-to-b from-slate-50 to-slate-100 py-8">
      <div className="mx-auto w-full max-w-3xl px-4">
        {/* Header */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-800">Roleplay / Practice</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ModeSwitch mode={mode} setMode={setMode} resetUI={resetUI} />
            <select
                className="w-64 rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm shadow-sm"
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
            >
                {scenarioOpts.map((s) => (
                  <option key={s.slug} value={s.slug}>{s.title}</option>
                ))}
            </select>
            {mode === "roleplay" && (
                <button
                  onClick={startRoleplay}
                  className="rounded-lg border bg-white px-3 py-1.5 text-sm shadow-sm hover:bg-slate-50"
                >
                  {loadingStart ? "Starting..." : "Start"}
                </button>
            )}
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-md flex flex-col h-[70vh]">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/60">
            {displayMessages.map(renderItem)}

            {mode === "roleplay" && isUserTurn && (
              <MessageBubble
                key="await"
                side="left"
                role={awaitUser.role}
                text={nextExpectedHint || "It's your turn."}
                highlight
                meta={{ order: awaitUser.order }}
              />
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Composer */}
          <div className="flex items-center gap-2 border-t border-slate-200 p-3">
            <input
              className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={mode === "roleplay" && !isUserTurn ? "Waiting for conversation..." : "Type here..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              disabled={loadingSend || (mode === "roleplay" && !isUserTurn)}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loadingSend || (mode === "roleplay" && !isUserTurn)}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-500"
            >
              Send
            </button>
            <button
              onClick={toggleRec}
              disabled={recBusy || loadingSend || (mode === "roleplay" && !isUserTurn)}
              className={clsx(
                "rounded-xl px-3 py-2 text-sm font-medium shadow-sm",
                recOn ? "bg-red-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              )}
            >
              {recOn ? "Stop" : "🎙️"}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-3 flex justify-between text-xs text-slate-500">
           <span>Session: {sessionId || "—"}</span>
           {error && <span className="text-red-600">⚠️ {error}</span>}
        </div>
      </div>
    </div>
  );
}