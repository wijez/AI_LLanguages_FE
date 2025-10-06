import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';

export default function ChatWidget({
  // Giữ endpoint của bạn (nếu đã chỉnh router, đổi sang /api/chat/...)
  apiStart   = 'http://127.0.0.1:8000/api/chat/chat/start/',
  apiMessage = 'http://127.0.0.1:8000/api/chat/chat/message/',
  apiStream  = 'http://127.0.0.1:8000/api/chat/chat/stream/',
  apiPron    = 'http://127.0.0.1:8000/api/speech/pron/score/', // ✅ Vừa STT vừa chấm phát âm
  apiTTS     = 'http://127.0.0.1:8000/api/speech/tts/',        // TTS
  startConfig = {
    topic_slug: 'a1-greetings',
    mode: 'roleplay',
    temperature: 0.4,
    max_tokens: 300,
    suggestions_count: 2,
    use_rag: true,
    knowledge_limit: 3,
    rag_skill: 'Hello & Goodbye',
    rag_k: 5,
    skill_title: 'Hello & Goodbye',
    system_extra: 'Ưu tiên luyện câu chào lịch sự.',
    language_override: 'vi',
    conv_name: 'Buổi luyện chào hỏi #1',
  },
  useStreaming = true,
  languageCode = 'en', // dùng cho Pron (STT) & TTS
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [convId, setConvId] = useState(null);
  const [topicTitle, setTopicTitle] = useState('');
  const [topicDesc, setTopicDesc] = useState('');
  const [messages, setMessages] = useState([
    { type: 'bot', text: 'Xin chào! Nhấn 🎙️ để nói, mình sẽ hiểu & trả lời ngay.' },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const listRef = useRef(null);
  const streamAbortRef = useRef(null);

  // ==== Mic / Audio capture ====
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // ==== Pron meta (expected_text gợi ý) ====
  const lastPronMetaRef = useRef({ expect_text: '', force_pron: false });

  // ==== TTS player & queue (luôn đọc bot reply, không chồng tiếng) ====
  const audioRef = useRef(new Audio());
  const speakQueueRef = useRef([]);   // [{ text, lang }]
  const isSpeakingRef = useRef(false);
  const lastSpokenRef = useRef('');

  const headers = useMemo(() => ({ 'Content-Type': 'application/json' }), []);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    });
  };
  useEffect(() => { scrollToBottom(); }, [messages]);
  useEffect(() => () => { if (streamAbortRef.current) streamAbortRef.current.abort(); }, []);

  // ---------- Helpers ----------
  const blobToBase64 = (blob) =>
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result.split(',')[1]); // bỏ prefix data:
      r.onerror = reject;
      r.readAsDataURL(blob);
    });

  // --- TTS core (queue sẽ gọi) ---
  const speakText = async (text, lang = 'en') => {
    if (!text?.trim()) return;
    try {
      const res = await fetch(apiTTS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, lang }),
      });
      if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
      const data = await res.json();
      const url = data.audio_url ||
        `data:${data.mime_type || 'audio/mpeg'};base64,${data.audio_base64}`;

      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = url;
      await audioRef.current.play().catch(() => {});
    } catch (e) {
      setMessages(prev => [...prev, { type: 'bot', text: `TTS lỗi: ${e.message || e}` }]);
    }
  };

  const enqueueSpeak = (text, lang = 'en') => {
    const clean = (text || '').trim();
    if (!clean) return;
    if (clean === lastSpokenRef.current) return;
    speakQueueRef.current.push({ text: clean, lang });
    drainSpeakQueue();
  };

  const drainSpeakQueue = async () => {
    if (isSpeakingRef.current) return;
    const item = speakQueueRef.current.shift();
    if (!item) return;

    isSpeakingRef.current = true;
    lastSpokenRef.current = item.text;
    try {
      await speakText(item.text, item.lang);
    } finally {
      isSpeakingRef.current = false;
      drainSpeakQueue();
    }
  };

  useEffect(() => {
    const onEnded = () => drainSpeakQueue();
    audioRef.current.addEventListener('ended', onEnded);
    audioRef.current.addEventListener('error', onEnded);
    return () => {
      audioRef.current.removeEventListener('ended', onEnded);
      audioRef.current.removeEventListener('error', onEnded);
    };
  }, []);

  // ====== START / MESSAGE ======
  const startConversation = async () => {
    const res = await fetch(apiStart, { method: 'POST', headers, body: JSON.stringify(startConfig || {}) });
    if (!res.ok) throw new Error(`Start failed: ${res.status} ${res.statusText} — ${await res.text().catch(()=> '')}`);
    const data = await res.json();
    const id = data?.id;
    if (!id) throw new Error('Start ok nhưng thiếu id trong response');
    setConvId(id);
    setTopicTitle(data?.topic?.title || '');
    setTopicDesc(data?.topic?.description || '');
    return id;
  };

  const sendMessageAPI = async (conversationId, userText) => {
    const res = await fetch(apiMessage, { method: 'POST', headers, body: JSON.stringify({ conv_id: conversationId, user_text: userText }) });
    if (!res.ok) throw new Error(`Message failed: ${res.status} ${res.statusText} — ${await res.text().catch(()=> '')}`);
    return res.json();
  };

  // STREAM NDJSON
  const sendMessageStream = async (conversationId, userText) => {
    if (streamAbortRef.current) streamAbortRef.current.abort();
    const controller = new AbortController();
    streamAbortRef.current = controller;

    const res = await fetch(apiStream, {
      method: 'POST',
      headers,
      body: JSON.stringify({ conv_id: conversationId, user_text: userText }),
      signal: controller.signal,
    });
    if (!res.ok || !res.body) throw new Error(`Stream failed: ${res.status} ${res.statusText} — ${await res.text().catch(()=> '')}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let replyAccum = '';

    let botIndex = null;
    setMessages(prev => {
      const next = prev.filter(m => !m.typing);
      botIndex = next.length;
      next.push({ type: 'bot', text: '', typing: true });
      return next;
    });

    const flushAppend = (delta) => {
      if (!delta) return;
      replyAccum += delta;
      setMessages(prev => {
        const next = [...prev];
        if (botIndex == null || !next[botIndex]) return prev;
        next[botIndex] = { ...next[botIndex], text: (next[botIndex].text || '') + delta };
        return next;
      });
    };

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let eol;
        while ((eol = buffer.search(/\r?\n/)) >= 0) {
          const line = buffer.slice(0, eol).trim();
          buffer = buffer.slice(eol + (buffer[eol] === '\r' && buffer[eol + 1] === '\n' ? 2 : 1));
          if (!line) continue;
          try {
            const j = JSON.parse(line);
            if (typeof j.delta === 'string') {
              flushAppend(j.delta);
            } else if (j.meta) {
              const p = j.meta?.pron;
              if (p) lastPronMetaRef.current = { expect_text: p.expect_text || '', force_pron: !!p.force_pron };
              const sug = j.meta?.suggestions || [];
              if (sug.length) {
                setMessages(prev => [...prev, ...sug.map(s => ({ type: 'bot', text: `Gợi ý: ${s}` }))]);
              }
            } else if (j.type === 'done') {
              setMessages(prev => {
                const next = [...prev];
                if (botIndex != null && next[botIndex]) next[botIndex].typing = false;
                return next;
              });
              if (replyAccum.trim()) enqueueSpeak(replyAccum, languageCode || 'en');
            }
          } catch {
            // skip
          }
        }
      }
    } finally {
      setMessages(prev => {
        const next = [...prev];
        if (botIndex != null && next[botIndex]) next[botIndex].typing = false;
        return next;
      });
      if (streamAbortRef.current === controller) streamAbortRef.current = null;
    }
  };

  // ====== MIC RECORDING: Ghi âm → /pron/score (STT+Score) → gửi text tới /message ======
  const pickBestMimeType = () => {
    const candidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg',
      'audio/mp4',
      'audio/mpeg',
    ];
    for (const t of candidates) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) {
        return t;
      }
    }
    return '';
  };

  const startRecording = async () => {
    if (isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickBestMimeType();
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mr;
      audioChunksRef.current = [];

      mr.ondataavailable = (e) => { if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: mr.mimeType || 'audio/webm' });
        await handleAudioSubmit(blob);
        // cleanup tracks
        stream.getTracks().forEach(t => t.stop());
      };

      mr.start(100);
      setIsRecording(true);
    } catch (e) {
      setMessages(prev => [...prev, { type: 'bot', text: `Không thể truy cập micro: ${e.message || e}` }]);
    }
  };

  const stopRecording = () => {
    if (!isRecording || !mediaRecorderRef.current) return;
    try { mediaRecorderRef.current.stop(); } catch {}
    setIsRecording(false);
  };

  const handleAudioSubmit = async (blob) => {
    const audio_base64 = await blobToBase64(blob);

    // expected_text ưu tiên từ meta BE; nếu chưa có thì dùng câu bot gần nhất; cuối cùng fallback 'Hello'
    let expected = (lastPronMetaRef.current?.expect_text || '').trim();
    if (!expected) {
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i]?.type === 'bot' && !/^\s*Gợi ý:/.test(messages[i].text || '')) {
          expected = (messages[i].text || '').trim();
          break;
        }
      }
    }
    if (!expected) expected = 'Hello';

    // Hiển thị status
    const idxStatus = messages.length;
    setMessages(prev => [...prev, { type: 'bot', text: `Đang nhận dạng & chấm phát âm…\n“Mục tiêu: ${expected}”`, typing: true }]);

    // 1) Gọi /speech/pron/score/ để lấy recognized (STT) + score
    let recognizedText = '';
    try {
      const res = await fetch(apiPron, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expected_text: expected, audio_base64, lang: languageCode || 'en' }),
      });
      if (!res.ok) throw new Error(await res.text().catch(()=>res.statusText));
      const data = await res.json();

      recognizedText = (data?.recognized || '').trim();

      const scorePct = Math.round((data?.score || 0) * 100);
      const pretty =
        `Bạn nói: ${recognizedText || '(không nhận dạng được)'}\n`
        + `Điểm phát âm: ${scorePct}/100`
        + (data?.details?.expected_norm ? `\nMục tiêu: ${data.details.expected_norm}` : '');

      setMessages(prev => {
        const next = [...prev];
        if (next[idxStatus]) next[idxStatus] = { type: 'bot', text: pretty, typing: false };
        else next.push({ type: 'bot', text: pretty });
        return next;
      });

      // Thêm luôn "tin nhắn người dùng" là recognizedText để dòng chảy hội thoại rõ ràng
      if (recognizedText) {
        setMessages(prev => [...prev, { type: 'user', text: recognizedText }]);
      }
    } catch (e) {
      setMessages(prev => {
        const next = [...prev];
        if (next[idxStatus]) next[idxStatus] = { type: 'bot', text: `STT/Pron lỗi: ${e.message || e}`, typing: false };
        else next.push({ type: 'bot', text: `STT/Pron lỗi: ${e.message || e}` });
        return next;
      });
      return; // không có text để gửi tiếp
    }

    // 2) Gửi recognizedText sang /api/chat/.../message (stream hoặc non-stream)
    if (!recognizedText) return;

    let id = convId;
    try { if (!id) id = await startConversation(); }
    catch (e) {
      setMessages(prev => [...prev, { type: 'bot', text: `Không tạo được phiên: ${e.message || e}` }]);
      return;
    }

    try {
      if (useStreaming) {
        await sendMessageStream(id, recognizedText);
      } else {
        setMessages(prev => [...prev, { type: 'bot', text: 'Đang trả lời…', typing: true }]);
        const data = await sendMessageAPI(id, recognizedText);
        if (data?.meta?.pron) {
          lastPronMetaRef.current = {
            expect_text: data.meta.pron.expect_text || '',
            force_pron: !!data.meta.pron.force_pron
          };
        }
        const reply = data?.reply ?? '(không có reply từ server)';
        const suggestions = data?.meta?.suggestions || [];
        setMessages(prev => {
          const noTyping = prev.filter(m => !m.typing);
          const next = [...noTyping, { type: 'bot', text: reply }];
          suggestions.forEach(s => next.push({ type: 'bot', text: `Gợi ý: ${s}` }));
          return next;
        });
        if (reply && reply.trim()) enqueueSpeak(reply, languageCode || 'en');
      }
    } catch (e) {
      setMessages(prev => [...prev, { type: 'bot', text: `Lỗi gửi tin nhắn: ${e.message || e}` }]);
    }
  };

  // ====== SEND HANDLER (text input) ======
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const trimmed = inputMessage.trim();
    if (!trimmed || isSending) return;

    setMessages(prev => [...prev, { type: 'user', text: trimmed }]);
    setInputMessage('');
    setIsSending(true);

    try {
      let id = convId;
      if (!id) id = await startConversation();

      if (useStreaming) {
        await sendMessageStream(id, trimmed);
      } else {
        setMessages(prev => [...prev, { type: 'bot', text: 'Đang trả lời…', typing: true }]);
        const data = await sendMessageAPI(id, trimmed);
        if (data?.meta?.pron) {
          lastPronMetaRef.current = {
            expect_text: data.meta.pron.expect_text || '',
            force_pron: !!data.meta.pron.force_pron
          };
        }
        const reply = data?.reply ?? '(không có reply từ server)';
        const suggestions = data?.meta?.suggestions || [];
        setMessages(prev => {
          const noTyping = prev.filter(m => !m.typing);
          const next = [...noTyping, { type: 'bot', text: reply }];
          suggestions.forEach(s => next.push({ type: 'bot', text: `Gợi ý: ${s}` }));
          return next;
        });
        if (reply && reply.trim()) enqueueSpeak(reply, languageCode || 'en');
      }
    } catch (err) {
      setMessages(prev => [...prev, { type: 'bot', text: `Xin lỗi, lỗi API. ${err instanceof Error ? err.message : ''}` }]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={async () => {
            setIsOpen(true);
            try { if (!convId) await startConversation(); }
            catch (e) { setMessages(prev => [...prev, { type: 'bot', text: `Không tạo được phiên: ${e.message}` }]); }
          }}
          className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-50"
        >
          <MessageCircle className="w-8 h-8 text-white" />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[640px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-blue-500" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-white font-bold truncate">Trợ lý Duolingo</h3>
                  <p className="text-blue-100 text-xs truncate">
                    {topicTitle ? `Chủ đề: ${topicTitle}` : 'Luôn sẵn sàng hỗ trợ'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { if (streamAbortRef.current) streamAbortRef.current.abort(); setIsOpen(false); }}
                className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                aria-label="Đóng chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {topicDesc && <p className="text-white/90 text-xs mt-2 line-clamp-2">{topicDesc}</p>}
          </div>

          {/* Messages */}
          <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] whitespace-pre-wrap p-3 rounded-2xl ${
                    m.type === 'user'
                      ? 'bg-blue-500 text-white rounded-br-none'
                      : 'bg-white text-gray-800 rounded-bl-none shadow-sm'
                  } ${m.typing ? 'opacity-70 italic' : ''}`}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input + MIC */}
          <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200 rounded-b-2xl">
            <label htmlFor="chat-input" className="sr-only">Nhập tin nhắn</label>
            <div className="flex gap-2 items-center">
              {/* Mic button: ghi âm → /pron/score (STT+Score) → gửi text */}
              <button
                type="button"
                onClick={() => (isRecording ? stopRecording() : startRecording())}
                className={`w-36 h-11 rounded-full flex items-center justify-center border text-sm font-medium transition-all
                  ${isRecording ? 'bg-red-500 text-white border-red-600 animate-pulse' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                title={isRecording ? 'Dừng & xử lý STT + gửi' : 'Ghi âm: STT + chấm + gửi'}
              >
                {isRecording ? 'ĐANG GHI…' : '🎙️ NÓI & GỬI'}
              </button>

              <input
                id="chat-input"
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (!isSending) handleSendMessage(e);
                  }
                }}
                placeholder={isSending ? 'Đang gửi…' : (lastPronMetaRef.current?.expect_text ? `Hãy đọc: "${lastPronMetaRef.current.expect_text}" hoặc nhập câu hỏi…` : 'Nhập tin nhắn...')}
                disabled={isSending}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={isSending}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white p-3 rounded-xl transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            {/* hint đọc nếu có */}
            {lastPronMetaRef.current?.expect_text && (
              <div className="mt-2 text-xs text-gray-500">
                Gợi ý đọc: <span className="font-medium">“{lastPronMetaRef.current.expect_text}”</span>. Mic sẽ STT + chấm + gửi.
              </div>
            )}
          </form>
        </div>
      )}
    </>
  );
}
