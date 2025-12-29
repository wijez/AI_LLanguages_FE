import React from "react";

export const LANG_BCP = (code) => {
  const m = { en: "en-US", vi: "vi-VN", ja: "ja-JP", ko: "ko-KR", zh: "zh-CN" };
  return m[(code || "en").toLowerCase()] || "en-US";
};

export function speakText(text, langHint = "en-US") {
  try {
    const u = new SpeechSynthesisUtterance(String(text || ""));
    u.lang = langHint;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch (e) {
    console.error(e);
  }
}

export const Input = ({ value, onChange, placeholder = "", label = "Câu trả lời của bạn" }) => (
  <div className="mx-auto mt-6 max-w-xl">
    <label className="block text-sm text-slate-500 mb-2">{label}</label>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-400/40"
    />
  </div>
);

export const Textarea = ({ value, onChange, placeholder = "", label = "Viết câu trả lời của bạn" }) => (
  <div className="mx-auto mt-6 max-w-xl">
    <label className="block text-sm text-slate-500 mb-2">{label}</label>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={5}
      placeholder={placeholder}
      className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-400/40"
    />
  </div>
);

export function renderQuiz(question, choices, pickedId, setPickedId) {
  return (
    <div className="space-y-4">
      {question && <div className="text-2xl font-bold text-slate-800 text-center">{question}</div>}
      <div className="mx-auto mt-4 grid max-w-xl gap-3">
        {(choices || []).map((c, i) => {
          const active = pickedId === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setPickedId(c.id)}
              className={[
                "flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition",
                active
                  ? "border-emerald-500 ring-2 ring-emerald-400/40 bg-emerald-50"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
              ].join(" ")}
            >
              <span className="grid h-7 w-7 place-items-center rounded-md border border-slate-300 text-[11px] text-slate-500">
                {i + 1}
              </span>
              <span className="font-medium">{c.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function renderMatching(leftText, rightChoices, pickedRight, setPickedRight) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="text-sm text-slate-500 mb-1">Cụm cần ghép (L1)</div>
        <div className="text-xl font-semibold">{leftText}</div>
      </div>

      <div className="grid gap-2">
        {(rightChoices || []).map((t, i) => {
          const active = pickedRight === t;
          return (
            <button
              key={`${t}_${i}`}
              onClick={() => setPickedRight(t)}
              className={[
                "rounded-xl border px-4 py-3 text-left transition",
                active
                  ? "border-emerald-500 ring-2 ring-emerald-400/40 bg-emerald-50"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
              ].join(" ")}
            >
              {t}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function renderListening(q, typed, setTyped, langHint) {
  return (
    <div className="space-y-4">
      <div className="text-2xl font-bold text-slate-800 text-center">{q.question}</div>
      {q.audio && (
        <div className="mx-auto flex justify-center">
          <audio controls src={q.audio} className="mt-3" />
        </div>
      )}
      <div className="mt-2 flex items-center justify-center gap-2">
        <button
          onClick={() => speakText(q.answer, langHint)}
          className="rounded-lg border px-3 py-2 hover:bg-slate-50"
        >
          ▶ Nghe đáp án
        </button>
      </div>
      <Input value={typed} onChange={setTyped} label="Bạn nghe thấy gì?" />
    </div>
  );
}

function makeReadingHint(answer = "", level = 1) {
  const a = String(answer).trim();
  if (!a) return "";
  const words = a.split(/\s+/);
  if (level === 1) return `Gợi ý 1: ${words.length} từ, chữ đầu: “${a[0]}”`;
  if (level === 2) {
    const initials = words.map((w) => w[0] || "_").join(" · ");
    return `Gợi ý 2: Chữ đầu mỗi từ: ${initials}`;
  }
  const half = Math.ceil(a.length / 2);
  const masked = a.slice(0, half) + "…".repeat(Math.max(1, a.length - half));
  return `Gợi ý 3: ${masked}`;
}

export function renderReadingAssemble(q, readingPassage, ordered, setOrdered, hintLevel, setHintLevel, langHint) {
  const handleAddToTray = (token) => {
    setOrdered([...ordered, token]);
  };

  const handleRemoveFromTray = (token, indexToRemove) => {
    setOrdered(ordered.filter((_, i) => i !== indexToRemove));
  };

  return (
    <div className="space-y-6">
      {!!readingPassage && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="text-sm text-slate-500 mb-1">Đoạn văn</div>
              <div className="whitespace-pre-wrap">{readingPassage}</div>
            </div>
            <button
              onClick={() => speakText(readingPassage, langHint)}
              className="shrink-0 h-9 px-3 rounded-lg border border-slate-300 text-slate-700 hover:bg-white"
              title="Đọc đoạn văn"
            >
              🔊 Đọc
            </button>
          </div>
        </div>
      )}

      <div className="text-2xl font-bold text-slate-800 text-center">{q.question}</div>

      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => setHintLevel((l) => Math.min(3, l + 1))}
          className="rounded-lg border px-3 py-2 hover:bg-slate-50"
          title="Hiện gợi ý"
        >
          💡 Gợi ý {hintLevel > 0 ? `(${hintLevel}/3)` : ""}
        </button>
        {hintLevel > 0 && (
          <div className="text-sm text-slate-600">{makeReadingHint(q.answer, hintLevel)}</div>
        )}
      </div>

      <div className="w-full flex flex-col h-full">
        <div className="min-h-[80px] flex flex-wrap gap-2 content-start py-4 border-b-2 border-slate-100 mb-8 px-2">
          {ordered.map((t, i) => (
            <button
              key={`tray-${i}`}
              onClick={() => handleRemoveFromTray(t, i)}
              className="bg-white border-2 border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-lg font-medium shadow-sm hover:bg-slate-50 active:translate-y-1 transition-all"
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          {(q.tokens || []).map((t, i) => {
            const usedCount = ordered.filter(tk => tk === t).length;
            const totalCount = q.tokens.filter(tk => tk === t).length;
            const isUsed = usedCount >= totalCount; 
            
            return (
              <div key={`bank-${i}`} className="relative">
                {!isUsed && (
                  <button
                    onClick={() => handleAddToTray(t)}
                    className="relative z-10 bg-white border-2 border-slate-200 border-b-4 text-slate-700 px-4 py-2 rounded-xl text-lg font-medium active:border-b-2 active:translate-y-[2px] transition-all hover:bg-slate-50"
                  >
                    {t}
                  </button>
                )}
                <div
                  className={`bg-slate-200 rounded-xl px-4 py-2 text-lg font-medium text-transparent border-2 border-slate-200 select-none ${!isUsed ? 'absolute inset-0 -z-0' : ''}`}
                >
                  {t}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function renderOrdering(q, ordered, setOrdered) {
  const handleAddToTray = (token) => {
    setOrdered([...ordered, token]);
  };

  const handleRemoveFromTray = (token, indexToRemove) => {
    setOrdered(ordered.filter((_, i) => i !== indexToRemove));
  };

  return (
    <div className="w-full flex flex-col h-full">
      <div className="min-h-[120px] flex flex-wrap gap-2 content-start py-4 border-b-2 border-slate-100 mb-8 px-2">
        {ordered.map((t, i) => (
          <button
            key={`tray-${i}`}
            onClick={() => handleRemoveFromTray(t, i)}
            className="bg-white border-2 border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-lg font-medium shadow-sm hover:bg-slate-50 active:translate-y-1 transition-all"
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 justify-center">
        {(q.tokens || []).map((t, i) => {
          const usedCount = ordered.filter(tk => tk === t).length;
          const totalCount = q.tokens.filter(tk => tk === t).length;
          
          let instanceIndex = 0;
          for(let k=0; k<i; k++) {
              if (q.tokens[k] === t) instanceIndex++;
          }
          const isUsed = instanceIndex < usedCount;

          return (
            <div key={`bank-${i}`} className="relative">
              {!isUsed && (
                <button
                  onClick={() => handleAddToTray(t)}
                  className="relative z-10 bg-white border-2 border-slate-200 border-b-4 text-slate-700 px-4 py-2 rounded-xl text-lg font-medium active:border-b-2 active:translate-y-[2px] transition-all hover:bg-slate-50"
                >
                  {t}
                </button>
              )}
              <div
                className={`bg-slate-200 rounded-xl px-4 py-2 text-lg font-medium text-transparent border-2 border-slate-200 select-none ${!isUsed ? 'absolute inset-0 -z-0' : ''}`}
              >
                {t}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function renderPron(q, typed, setTyped, isRecording, isProcessing, startRecord, stopRecord, langHint) {
  return (
    <div className="space-y-4 text-center">
      <div className="text-2xl font-bold text-slate-800">{q.question}</div>
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => speakText(q.ttsSample || q.answer, langHint)}
          className="rounded-lg border px-3 py-2 hover:bg-slate-50"
        >
          ▶ Nghe mẫu
        </button>

        {!isRecording ? (
          <button
            onClick={startRecord}
            className="rounded-lg bg-emerald-600 text-white px-3 py-2 hover:bg-emerald-700"
          >
            🎙️ Ghi
          </button>
        ) : (
          <button
            onClick={stopRecord}
            className="rounded-lg bg-rose-600 text-white px-3 py-2 hover:bg-rose-700"
          >
            ⏹ Dừng
          </button>
        )}
      </div>

      <div className="mx-auto mt-3 max-w-xl">
        <label className="block text-xs text-slate-500 mb-1">Transcript (có thể sửa):</label>
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder="Transcript…"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-400/40"
        />
        {isProcessing && <div className="mt-1 text-xs text-slate-500">Đang xử lý âm thanh…</div>}
      </div>
    </div>
  );
}

export function renderSpeaking(q, typed, setTyped, isRecording, isProcessing, startRecord, stopRecord, langHint) {
  return (
    <div className="space-y-4 text-center">
      <div className="text-2xl font-bold text-slate-800">{q.question}</div>
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => speakText(q.ttsSample || q.answer, langHint)}
          className="rounded-lg border px-3 py-2 hover:bg-slate-50"
        >
          ▶ Nghe mẫu
        </button>

        {!isRecording ? (
          <button
            onClick={startRecord}
            className="rounded-lg bg-emerald-600 text-white px-3 py-2 hover:bg-emerald-700"
          >
            🎙️ Ghi
          </button>
        ) : (
          <button
            onClick={stopRecord}
            className="rounded-lg bg-rose-600 text-white px-3 py-2 hover:bg-rose-700"
          >
            ⏹ Dừng
          </button>
        )}
      </div>

      <div className="mx-auto mt-3 max-w-xl">
        <label className="block text-xs text-slate-500 mb-1">Transcript (có thể sửa):</label>
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder="Bạn vừa nói…"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-400/40"
        />
        {isProcessing && <div className="mt-1 text-xs text-slate-500">Đang xử lý âm thanh…</div>}
      </div>
    </div>
  );
}