import React from "react";
import { clsx } from "../../components/chat/utils";

export function ModeSwitch({ mode, setMode, resetUI }) {    
  return (
    <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5 text-xs shadow-sm">
      <button
        onClick={() => {
          setMode("roleplay");
          resetUI();
        }}
        className={clsx(
          "px-2 py-1 rounded-md",
          mode === "roleplay" ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-slate-50"
        )}
      >
        Roleplay
      </button>
      <button
        onClick={() => {
          setMode("practice");
          resetUI();
        }}
        className={clsx(
          "px-2 py-1 rounded-md",
          mode === "practice" ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-slate-50"
        )}
      >
        Practice
      </button>
    </div>
  );
}