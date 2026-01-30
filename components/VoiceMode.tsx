
import React, { useState, useRef, useEffect } from 'react';
import { Mic, Volume2, Loader2, PlayCircle, PauseCircle, AlertCircle } from 'lucide-react';
import { generateSpeech } from '../services/gemini';
import { base64ToUint8Array, decodeAudioData } from '../utils/audioUtils';

export const VoiceMode: React.FC = () => {
  const [text, setText] = useState('');
  const [voice, setVoice] = useState('Kore');
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Persistent references to avoid recreating contexts and causing leaks
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      stopAudio();
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  const getAudioContext = async () => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    
    // Resume if suspended (browser autoplay policy)
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    
    return audioContextRef.current;
  };

  const stopAudio = () => {
    if (audioSourceRef.current) {
      try {
        // Critical: Remove onended to prevent state conflicts when rapidly switching
        audioSourceRef.current.onended = null;
        audioSourceRef.current.stop();
        audioSourceRef.current.disconnect();
      } catch (e) {
        // Ignore errors if already stopped
      }
      audioSourceRef.current = null;
    }
    setIsPlaying(false);
  };

  const handleSpeak = async () => {
    if (!text) return;
    
    stopAudio();
    setIsLoading(true);
    setError(null);

    try {
      const base64Audio = await generateSpeech(text, voice);
      
      const ctx = await getAudioContext();
      const audioBytes = base64ToUint8Array(base64Audio);
      const audioBuffer = await decodeAudioData(audioBytes, ctx, 24000, 1);
      
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      
      source.onended = () => {
        setIsPlaying(false);
        audioSourceRef.current = null;
      };
      
      source.start();
      audioSourceRef.current = source;
      setIsPlaying(true);

    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to generate speech");
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  };

  const voices = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'];

  return (
    <div className="h-full flex flex-col max-w-2xl mx-auto p-8 animate-fade-in justify-center">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-4">
          Voice Lab
        </h2>
        <p className="text-text-sub">Zara Voice Engine Text-to-Speech</p>
      </div>

      <div className="glass-panel p-8 rounded-3xl space-y-6 relative overflow-hidden">
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-sub ml-1">Select Voice</label>
          <div className="flex gap-2 flex-wrap">
            {voices.map(v => (
              <button
                key={v}
                onClick={() => setVoice(v)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  voice === v ? 'bg-cyan-500 text-white' : 'bg-surfaceHighlight text-text-sub hover:bg-surfaceHighlight/80'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type something for me to say..."
          className="w-full h-40 bg-background rounded-2xl p-6 text-xl text-text focus:outline-none focus:ring-1 focus:ring-cyan-500/50 resize-none border border-border"
        />

        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm justify-center bg-red-500/10 p-2 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <div className="flex justify-center pt-2">
           {isPlaying ? (
             <button
               onClick={stopAudio}
               className="bg-red-500 hover:bg-red-600 text-white w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg shadow-red-500/20 active:scale-95"
             >
               <PauseCircle className="w-8 h-8" />
             </button>
           ) : (
             <button
               onClick={handleSpeak}
               disabled={isLoading || !text}
               className="bg-cyan-500 hover:bg-cyan-600 text-white w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
             >
               {isLoading ? <Loader2 className="w-8 h-8 animate-spin" /> : <Volume2 className="w-8 h-8" />}
             </button>
           )}
        </div>
      </div>
    </div>
  );
};
