import { useState, useRef, useEffect } from "react";
export function ChatWidget({ title = "Roleplay Assistant", badge = "AI" }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const btnRef = useRef(null);

  // click ngoài để đóng
  useEffect(() => {
    function onDocClick(e) {
      if (!open) return;
      const p = panelRef.current;
      const b = btnRef.current;
      if (p && !p.contains(e.target) && b && !b.contains(e.target)) {
        setOpen(false);
      }
    }
    function onEsc(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return createPortal(
    <>
      {/* Nút tròn nổi (bubble) */}
      <button
        ref={btnRef}
        onClick={() => setOpen(v => !v)}
        className="fixed bottom-5 right-5 z-[2147483647] grid place-items-center h-14 w-14 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 active:scale-95 transition"
        aria-label="Open chat"
      >
        <span className="text-sm font-semibold">{badge}</span>
      </button>

      {/* Bong bóng popover gọn, xuất hiện khi bấm */}
      <div
        className={[
          "fixed bottom-24 right-5 z-[2147483647]",
          "transition ease-out duration-150",
          open ? "opacity-100 translate-y-0 scale-100" : "pointer-events-none opacity-0 translate-y-2 scale-95",
        ].join(" ")}
      >
        {/* Khung + viền + đổ bóng */}
        <div
          ref={panelRef}
          className="relative w-[92vw] max-w-[360px] h-[70vh] sm:w-[360px] sm:h-[520px] rounded-2xl border border-slate-300 bg-white shadow-2xl overflow-hidden"
          role="dialog"
          aria-label={title}
        >
          {/* Đuôi bong bóng */}
          <div className="absolute -bottom-2 right-8 h-4 w-4 rotate-45 bg-white border-b border-r border-slate-300"></div>

          {/* Header nhỏ gọn */}
          <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2 bg-slate-50">
            <div className="flex items-center gap-2">
              <span className="inline-grid h-6 w-6 place-items-center rounded-full bg-blue-600 text-white text-[10px]">{badge}</span>
              <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
            </div>
            <button
              className="rounded-md px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </div>

          {/* Nội dung chat gọi API thật */}
          <div className="h-full">
            {open && <RoleplayChatDemo />} {/* lazy render khi mở */}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
