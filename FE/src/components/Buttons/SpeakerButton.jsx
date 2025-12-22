function SpeakerButton({ text, lang = "en" }) {
  const [loading, setLoading] = useState(false);

  const onSpeak = async () => {
    try {
      setLoading(true);
      await speakText(text, lang);
    } catch (e) {
      console.error("TTS error", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={onSpeak}
      disabled={loading}
      title="Play audio"
      className={clsx(
        "rounded-full p-1 hover:bg-slate-200",
        loading && "opacity-50 cursor-not-allowed"
      )}
    >
      🔊
    </button>
  );
}
