import { useEffect, useRef, useState, useCallback } from "react";
import { audioKeyToUrl } from "./utils";

// Thêm tham số { onStepFinish } để báo ra ngoài khi chạy xong 1 card
export function useTimeline({ onStepFinish } = {}) {
  const [queue, setQueue] = useState([]);
  const [activeItem, setActiveItem] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isWaiting, setIsWaiting] = useState(false);

  const audioRef = useRef(typeof Audio !== "undefined" ? new Audio() : null);
  const timerRef = useRef(null);
  const resolveStepRef = useRef(null);
  
  // Lưu callback vào ref để tránh re-render loop
  const onFinishRef = useRef(onStepFinish);
  useEffect(() => {
    onFinishRef.current = onStepFinish;
  }, [onStepFinish]);

  // Cleanup
  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      if (audio) {
        audio.pause();
        audio.src = "";
      }
      clearTimeout(timerRef.current);
    };
  }, []);

  const playAudio = useCallback((audioKey) => {
    return new Promise((resolve) => {
      if (!audioKey || !audioRef.current) {
        resolve("no-audio");
        return;
      }
      const url = audioKeyToUrl(audioKey);
      const audio = audioRef.current;
      audio.src = url;
      audio.currentTime = 0;

      const updateProgress = () => {
        if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100);
      };

      const handleEnd = () => {
        cleanup();
        setProgress(100);
        resolve("ended");
      };

      const handleError = () => {
        cleanup();
        resolve("error");
      };

      const cleanup = () => {
        audio.removeEventListener("timeupdate", updateProgress);
        audio.removeEventListener("ended", handleEnd);
        audio.removeEventListener("error", handleError);
      };

      audio.addEventListener("timeupdate", updateProgress);
      audio.addEventListener("ended", handleEnd);
      audio.addEventListener("error", handleError);

      setProgress(0);
      resolveStepRef.current = () => {
        audio.pause();
        cleanup();
        resolve("skipped");
      };

      audio.play().catch((err) => {
        console.warn("Auto-play blocked:", err);
        handleError();
      });
    });
  }, []);

  const waitDelay = useCallback((ms) => {
    return new Promise((resolve) => {
      setIsWaiting(true);
      setProgress(100);
      const id = setTimeout(() => {
        setIsWaiting(false);
        resolve("waited");
      }, ms);
      timerRef.current = id;
      resolveStepRef.current = () => {
        clearTimeout(id);
        setIsWaiting(false);
        resolve("skipped-wait");
      };
    });
  }, []);

  // Processor: Xử lý từng card trong hàng đợi
  useEffect(() => {
    if (!activeItem && queue.length > 0) {
      const current = queue[0];
      setActiveItem(current); // Hiển thị card mới

      (async () => {
        // 1. Play Audio
        await playAudio(current.audio_key);

        // 2. Wait Delay
        const delay = current.waitAfter ?? 2000;
        if (delay > 0) await waitDelay(delay);

        // 3. DONE: Gọi callback để Parent lưu vào History
        if (onFinishRef.current) {
            onFinishRef.current(current);
        }

        // 4. Next item
        setQueue((prev) => prev.slice(1));
        setActiveItem(null);
        setProgress(0);
        resolveStepRef.current = null;
      })();
    }
  }, [queue, activeItem, playAudio, waitDelay]);

  const addBlocks = useCallback((blocks) => {
    const normalized = blocks.map((b) => ({
      ...b,
      waitAfter: b.waitAfter ?? 2000,
    }));
    setQueue((prev) => [...prev, ...normalized]);
  }, []);

  const skipCurrent = useCallback(() => {
    if (resolveStepRef.current) resolveStepRef.current();
  }, []);

  const clearTimeline = useCallback(() => {
    if (resolveStepRef.current) resolveStepRef.current();
    setQueue([]);
    setActiveItem(null);
    setProgress(0);
    setIsWaiting(false);
    if (audioRef.current) audioRef.current.pause();
  }, []);

  return {
    queue,
    activeItem,
    progress,
    isWaiting,
    addBlocks,
    skipCurrent,
    clearTimeline,
  };
}