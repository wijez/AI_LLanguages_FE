import React from "react";

export default function Spinner() {
  return (
    <div
      className="
        fixed inset-0 z-50
        flex items-center justify-center
        bg-white/60 backdrop-blur-sm
      "
    >
      <div
        className="
          w-12 h-12 rounded-full
          animate-spin
          border-4 border-sky-500 border-t-transparent
        "
      />
    </div>
  );
}
