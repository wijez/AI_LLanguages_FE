import { useEffect, useRef, useState } from "react";
import { blobToBase64 } from "./utils";

export function useVoiceRecorder() {
  const [recOn, setRecOn] = useState(false);
  const [recBusy, setRecBusy] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const destNodeRef = useRef(null);

  useEffect(() => {
    return () => {
      try {
        streamRef.current?.getTracks()?.forEach((t) => t.stop());
        if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
      } catch {
        console.warn("Cleanup audio resources failed");
      }
    };
  }, []);

  // Hardware noise suppression + Web Audio filters
  async function getNoiseReducedStream() {
    const sup = navigator.mediaDevices.getSupportedConstraints?.() || {};
    // 1) Bật chống ồn/khử vọng/AGC ở driver nếu có
    const raw = await navigator.mediaDevices.getUserMedia({
      audio: {
        noiseSuppression: sup.noiseSuppression ? { ideal: true } : true,
        echoCancellation: sup.echoCancellation ? { ideal: true } : true,
        autoGainControl: sup.autoGainControl ? { ideal: true } : true,
        channelCount: sup.channelCount ? { ideal: 1 } : undefined,
        sampleRate: sup.sampleRate ? { ideal: 48000 } : undefined,
      },
      video: false,
    });

    // 2) Chuỗi lọc Web Audio: High-pass → Low-pass → Compressor → Destination
    const AC = window.AudioContext || window.webkitAudioContext;
    const ctx = new AC();
    audioCtxRef.current = ctx;

    const src = ctx.createMediaStreamSource(raw);

    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 120; // cắt ù thấp

    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 3800; // cắt hiss cao

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -40;
    comp.knee.value = 28;
    comp.ratio.value = 12;
    comp.attack.value = 0.003;
    comp.release.value = 0.25;

    src.connect(hp);
    hp.connect(lp);
    lp.connect(comp);

    const dest = ctx.createMediaStreamDestination();
    comp.connect(dest);
    destNodeRef.current = dest;

    // stream đã lọc (ghi) + raw (để stop track gốc)
    return { stream: dest.stream, raw };
  }

  const startRecording = async (onStop) => {
    try {
      // lấy stream đã chống ồn (constraints + Web Audio chain)
      const { stream, raw } = await getNoiseReducedStream();

      // Debug nhanh
      const track = raw?.getAudioTracks?.()[0];
      const settings = track?.getSettings?.() || {};
      console.log("[Mic settings]", settings);
      console.log("[AudioContext]", {
        state: audioCtxRef.current?.state,
        sampleRate: audioCtxRef.current?.sampleRate,
      });

      streamRef.current = raw || stream;
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data?.size) chunksRef.current.push(e.data);
      };

      mr.onstop = async () => {
        try {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          // dọn resource an toàn
          streamRef.current?.getTracks()?.forEach((t) => t.stop());
          if (audioCtxRef.current) {
            audioCtxRef.current.close().catch(() => {});
          }
          audioCtxRef.current = null;
          destNodeRef.current = null;

          setRecOn(false);
          setRecBusy(true);
          const base64 = await blobToBase64(blob);

          if (onStop) {
            await onStop(base64);
          }
        } catch (e) {
          console.error("Recording stop error:", e);
          throw e;
        } finally {
          setRecBusy(false);
        }
      };

      mr.start();
      setRecOn(true);
    } catch (e) {
      console.error("Recording start error:", e);
      throw e;
    }
  };

  const stopRecording = () => {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== "inactive") mr.stop();
    // đảm bảo đóng track/context dù onstop không chạy
    streamRef.current?.getTracks()?.forEach((t) => t.stop());
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
    }
    audioCtxRef.current = null;
    destNodeRef.current = null;
  };

  return {
    recOn,
    recBusy,
    startRecording,
    stopRecording,
  };
}