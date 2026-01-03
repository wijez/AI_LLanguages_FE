import React, { useEffect, useRef, useState } from "react";
import { audioKeyToUrl, clsx, roleLabel } from "../../components/chat/utils";
import { Tag } from "../../components/chat/Tag";

export const MessageBubble = ({
  side,
  role,
  text,
  translation,
  highlight = false,
  meta,
  audioKey,
  // Props mới cho Timeline
  timelineActive = false,
  timelineProgress = 0,
  isWaiting = false,
  onSkip,
}) => {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);

  // Xử lý play thủ công (nút loa)
  const handleManualPlay = async (e) => {
    e?.stopPropagation?.();
    if (!audioKey) return;
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      const url = audioKeyToUrl(audioKey);
      const audio = new Audio(url);
      audioRef.current = audio;
      setPlaying(true);
      audio.onended = () => setPlaying(false);
      audio.onerror = () => setPlaying(false);
      await audio.play();
    } catch (err) {
      console.error(err);
      setPlaying(false);
    }
  };

  useEffect(() => () => audioRef.current?.pause(), []);

  // Style khi đang active
  const activeStyle = timelineActive
    ? "ring-2 ring-blue-400 border-blue-200 bg-blue-50"
    : "";

  return (
    <div
      className={clsx(
        "flex w-full gap-3 transition-all duration-300",
        side === "right" ? "justify-end" : "justify-start"
      )}
    >
      {side === "left" && (
        <div className="mt-0.5 h-7 w-7 shrink-0 rounded-full bg-slate-200 grid place-items-center text-xs text-slate-600">
          {(roleLabel[role] || role || "?").slice(0, 1)}
        </div>
      )}

      <div className="relative flex max-w-[85%] flex-col">
        <div
          className={clsx(
            "relative overflow-hidden rounded-2xl px-4 py-3 text-sm shadow-sm",
            side === "right"
              ? "bg-blue-600 text-white"
              : "border border-slate-200 bg-white text-slate-800",
            highlight && "ring-2 ring-amber-400",
            activeStyle
          )}
        >
          {/* Header */}
          <div className="mb-2 flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wide opacity-70">
              {roleLabel[role] || role}
            </span>
            {meta?.section && <Tag>{meta.section}</Tag>}
            {typeof meta?.order === "number" && <Tag>#{meta.order}</Tag>}

            {/* Nút Skip (chỉ hiện khi Timeline active) */}
            {timelineActive && (
              <button
                onClick={onSkip}
                className="ml-auto rounded-full bg-slate-200 px-2 py-0.5 text-[10px] text-slate-700 transition hover:bg-slate-300"
              >
                {isWaiting ? "Next ›" : "Skip ›"}
              </button>
            )}

            {/* Nút Play thủ công (chỉ hiện khi Timeline inactive) */}
            {!timelineActive && audioKey && (
              <button
                onClick={handleManualPlay}
                className="ml-auto rounded-full p-1 opacity-60 hover:opacity-100 disabled:opacity-30"
                disabled={playing}
                title="Replay audio"
              >
                {playing ? (
                  <span className="animate-pulse">🔊</span>
                ) : (
                  <span>🔈</span>
                )}
              </button>
            )}
          </div>

          {/* Text Content */}
          <div
            className={clsx(
              "whitespace-pre-wrap leading-relaxed transition-colors",
              timelineActive && !isWaiting ? "font-medium text-slate-900" : ""
            )}
          >
            {text}
            {translation && (
              <p className="mt-1 text-sm text-slate-500 italic border-t border-slate-200 pt-1">
                {translation}
              </p>
            )}
          </div>

          {/* Progress Bar Layer */}
          {timelineActive && (
            <div className="absolute bottom-0 left-0 mt-2 h-1 w-full bg-slate-100/50">
              <div
                className="h-full bg-blue-500 transition-all duration-100 ease-linear"
                style={{ width: `${timelineProgress}%` }}
              />
            </div>
          )}
        </div>

        {/* Waiting Indicator */}
        {timelineActive && isWaiting && (
          <div className="mt-1 ml-2 animate-pulse text-[10px] text-slate-400">
            Waiting next...
          </div>
        )}
      </div>

      {side === "right" && (
        <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-600/20 text-xs text-blue-800">
          You
        </div>
      )}
    </div>
  );
};