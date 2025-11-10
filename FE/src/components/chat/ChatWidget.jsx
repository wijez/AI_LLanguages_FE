import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

/** Kéo-thả + lưu vị trí */
function useDraggableDock(storageKey = "chat_dock_pos_widget") {
  const [pos, setPos] = useState({ x: 20, y: 20 });
  const posRef = useRef(pos);
  const draggingRef = useRef(false);
  const offsetRef = useRef({ dx: 0, dy: 0 });

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const p = JSON.parse(saved);
        setPos(p);
        posRef.current = p;
        return;
      } catch  { }
    }
    const w = window.innerWidth,
      h = window.innerHeight;
    const p = { x: Math.max(12, w - 84), y: Math.max(12, h - 84) };
    setPos(p);
    posRef.current = p;
  }, [storageKey]);

  const clamp = (x, y) => {
    const w = window.innerWidth,
      h = window.innerHeight;
    const S = 72; // size ước lượng của nút tròn
    return {
      x: Math.min(Math.max(8, x), w - S - 8),
      y: Math.min(Math.max(8, y), h - S - 8),
    };
  };

  const onMove = (e) => {
    if (!draggingRef.current) return;
    const nx = e.clientX - offsetRef.current.dx;
    const ny = e.clientY - offsetRef.current.dy;
    const c = clamp(nx, ny);
    posRef.current = c;
    setPos(c);
  };

  const onUp = () => {
    draggingRef.current = false;
    document.removeEventListener("pointermove", onMove);
    localStorage.setItem(storageKey, JSON.stringify(posRef.current));
  };

  const startDrag = (clientX, clientY) => {
    draggingRef.current = true;
    offsetRef.current = {
      dx: clientX - posRef.current.x,
      dy: clientY - posRef.current.y,
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp, { once: true });
  };

  useEffect(() => {
    const onResize = () => {
      const c = clamp(posRef.current.x, posRef.current.y);
      posRef.current = c;
      setPos(c);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return { pos, startDrag };
}

export function ChatWidget({ title = "Chat", badge = "AI", children }) {
  const [open, setOpen] = useState(false);
  const [suppressClick, setSuppressClick] = useState(false); // phân biệt kéo vs click
  const panelRef = useRef(null);
  const btnRef = useRef(null);
  const { pos, startDrag } = useDraggableDock();

  // đóng khi click ngoài + phím Esc
  useEffect(() => {
    const onDocClick = (e) => {
      if (!open) return;
      const p = panelRef.current,
        b = btnRef.current;
      if (p && !p.contains(e.target) && b && !b.contains(e.target))
        setOpen(false);
    };
    const onEsc = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  // kéo bằng NÚT khi đang đóng (giữ >6px coi như kéo)
  const onButtonPointerDown = (e) => {
    const sx = e.clientX,
      sy = e.clientY;
    let moved = false;
    const moveOnce = (ev) => {
      if (!moved) {
        const dx = Math.abs(ev.clientX - sx);
        const dy = Math.abs(ev.clientY - sy);
        if (dx > 6 || dy > 6) {
          moved = true;
          setSuppressClick(true);
          startDrag(sx, sy);
        }
      }
    };
    const upOnce = () => {
      document.removeEventListener("pointermove", moveOnce);
      if (!moved) setOpen((v) => !v);
      else setTimeout(() => setSuppressClick(false), 0);
      document.removeEventListener("pointerup", upOnce);
    };
    document.addEventListener("pointermove", moveOnce);
    document.addEventListener("pointerup", upOnce, { once: true });
  };

  // kéo bằng HEADER khi đang mở
  const onHeaderPointerDown = (e) => startDrag(e.clientX, e.clientY);

  return createPortal(
    <div
      style={{ position: "fixed", left: pos.x, top: pos.y, zIndex: 2147483647 }}
    >
      {/* nút tròn nổi */}
      <button
        ref={btnRef}
        onPointerDown={onButtonPointerDown}
        onClick={(e) => {
          if (suppressClick) e.preventDefault();
        }}
        className="grid place-items-center h-14 w-14 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 active:scale-95 transition cursor-grab"
        aria-label="Open chat"
      >
        <span className="text-sm font-semibold">{badge}</span>
      </button>

      {/* panel nổi theo dock (phía trên) */}
      <div
        className={[
          "absolute -top-[520px] right-0",
          "transition ease-out duration-150",
          open
            ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
            : "opacity-0 translate-y-2 scale-95 pointer-events-none",
        ].join(" ")}
      >
        <div
          ref={panelRef}
          className="relative w-[92vw] max-w-[360px] h-[70vh] sm:w-[360px] sm:h-[520px] rounded-2xl border border-slate-300 bg-white shadow-2xl overflow-hidden"
          role="dialog"
          aria-label={title}
        >
          {/* đuôi bong bóng */}
          <div className="absolute -bottom-2 right-8 h-4 w-4 rotate-45 bg-white border-b border-r border-slate-300"></div>

          {/* header (kéo khi mở) */}
          <div
            className="flex items-center justify-between border-b border-slate-200 px-3 py-2 bg-slate-50 cursor-grab active:cursor-grabbing select-none"
            onPointerDown={onHeaderPointerDown}
            title="Kéo để di chuyển"
          >
            <div className="flex items-center gap-2">
              <span className="inline-grid h-6 w-6 place-items-center rounded-full bg-blue-600 text-white text-[10px]">
                {badge}
              </span>
              <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
            </div>
            <button
              className="rounded-md px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </div>

          {/* nội dung: dùng children nếu truyền vào, else placeholder */}
          <div className="h-full">
            {open
              ? children ?? (
                  <div className="h-full grid place-items-center text-slate-500 text-sm">
                    Drop your chat body here
                  </div>
                )
              : null}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
