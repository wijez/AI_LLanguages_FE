import { useRef, useState, useEffect } from "react";
import { sttRecognizeBlob } from "../api/stt";

/**
 * Hook ghi âm + trả transcript qua onTranscript.
 * recState: 'idle' | 'rec' | 'proc'
 */
export function useSpeechRecorder({
  onTranscript,
  languageCode = "en", 
  mimeType = "audio/webm"
} = {}) {
  const [recState, setRecState] = useState("idle");
  const mediaRecRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  async function start() {
    if (recState === "rec") return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      mr.ondataavailable = (e) => e.data && chunksRef.current.push(e.data);
      mr.onstop = async () => {
        setRecState("proc");
        try {
          const blob = new Blob(chunksRef.current, { type: mimeType });
          const text = await sttRecognizeBlob(blob, { languageCode });
          onTranscript?.(text || "");
        } finally {
          cleanupStream();
          setRecState("idle");
        }
      };

      mediaRecRef.current = mr;
      mr.start();
      setRecState("rec");
    } catch (e) {
      console.warn("[useSpeechRecorder] start failed:", e);
    }
  }

  function stop() {
    try {
      if (mediaRecRef.current?.state === "recording") mediaRecRef.current.stop();
      else cleanupStream();
    } catch (e) {
      console.warn("[useSpeechRecorder] stop failed:", e);
    }
  }

  function cancel() {
    try {
      if (mediaRecRef.current?.state === "recording") mediaRecRef.current.stop();
    } catch (e){
        console.warn("[useSpeechRecorder] cancel failed:", e);
    }
    cleanupStream();
    setRecState("idle");
  }

  function cleanupStream() {
    try {
      mediaRecRef.current = null;
      chunksRef.current = [];
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    } catch (e) {
      console.warn("[useSpeechRecorder] cleanupStream failed:", e);
    }
  }

  useEffect(() => () => cleanupStream(), []);

  return {
    recState,          // 'idle' | 'rec' | 'proc'
    startRecord: start,
    stopRecord: stop,
    cancelRecord: cancel,
    isRecording: recState === "rec",
    isProcessing: recState === "proc",
  };
}
