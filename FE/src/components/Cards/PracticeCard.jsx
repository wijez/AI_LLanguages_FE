function ContextCard({ items = [] }) {
    const audioRef = useRef(null);
    const [playingIndex, setPlayingIndex] = useState(null);
  
    const handlePlayAudio = async (audioKey, index) => {
      if (!audioKey || playingIndex === index) return;
      
      try {
        audioRef.current?.pause();
        const url = audioKeyToUrl(audioKey);
        const audio = new Audio(url);
        audioRef.current = audio;
        setPlayingIndex(index);
        
        audio.onended = () => setPlayingIndex(null);
        audio.onerror = () => {
          setPlayingIndex(null);
          alert("Không phát được audio");
        };
        
        await audio.play();
      } catch {
        setPlayingIndex(null);
        alert("Không phát được audio");
      }
    };
  
    useEffect(() => {
      return () => {
        audioRef.current?.pause();
        audioRef.current = null;
      };
    }, []);
  
    if (!items?.length) return null;
    
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 my-2 text-xs">
        <div className="font-semibold text-amber-900 mb-2">
          Context (top {items.length})
        </div>
        {items.map((b, i) => (
          <div key={i} className="mb-2 pb-2 border-b border-amber-100 last:border-0">
            <div className="flex gap-1 mb-1 items-center">
              {b.section && <Tag color="amber">{b.section}</Tag>}
              {typeof b.order === "number" && <Tag color="amber">#{b.order}</Tag>}
              {b.role && <Tag color="amber">{b.role}</Tag>}
              {b.audio_key && (
                <button
                  onClick={() => handlePlayAudio(b.audio_key, i)}
                  disabled={playingIndex === i}
                  className="ml-auto text-amber-700 hover:text-amber-900 disabled:opacity-50"
                  title="Play audio"
                >
                  {playingIndex === i ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              )}
            </div>
            <div className="text-amber-800">{b.text}</div>
          </div>
        ))}
      </div>
    );
  }