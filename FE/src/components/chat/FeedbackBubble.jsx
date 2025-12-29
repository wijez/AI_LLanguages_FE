import React from "react";
import { Mic } from "lucide-react"; // Đảm bảo import icon

export function FeedbackBubble({ original, corrected, explanation, onPractice }) {
  if (!corrected) return null;

  return (
    <div className="mx-10 mb-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-slate-700 shadow-sm">
      <div className="flex items-center gap-2 font-semibold text-amber-700 mb-2">
        <span className="text-sm">👩‍🏫</span> 
        <span>Teacher Feedback</span>
      </div>

      <div className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-1.5 items-baseline">
        
        {/* Original */}
        <span className="text-rose-500 font-medium whitespace-nowrap">You said:</span>
        <span className="text-slate-500 line-through decoration-rose-300 decoration-2">
          {original}
        </span>

        {/* Corrected */}
        <span className="text-emerald-600 font-medium whitespace-nowrap self-center">Better:</span>
        <div className="flex items-center gap-2 flex-wrap">
            <span className="text-emerald-700 font-semibold bg-emerald-100/50 px-1 rounded">
              {corrected}
            </span>
            {/* Nút Practice */}
            {onPractice && (
                <button 
                    onClick={() => onPractice(corrected)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] hover:bg-emerald-700 transition-colors shadow-sm"
                    title="Practice speaking this sentence"
                >
                    <Mic size={10} /> Practice
                </button>
            )}
        </div>

        {/* Explanation */}
        {explanation && (
            <>
                <span className="text-amber-600 font-medium whitespace-nowrap">Note:</span>
                <span className="text-slate-600 italic">{explanation}</span>
            </>
        )}
      </div>
    </div>
  );
}