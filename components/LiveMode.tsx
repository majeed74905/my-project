
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Radio, AlertTriangle, User, Sparkles, Activity, WifiOff, X, Music, Youtube, RefreshCw, ExternalLink, Loader2, Key } from 'lucide-react';
import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";
import { buildSystemInstruction, MEDIA_PLAYER_TOOL } from '../services/gemini';
import { float32ToInt16, base64ToUint8Array, decodeAudioData, arrayBufferToBase64 } from '../utils/audioUtils';
import { PersonalizationConfig, MediaAction } from '../types';

interface LiveModeProps {
  personalization: PersonalizationConfig;
}

interface LiveMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export const LiveMode: React.FC<LiveModeProps> = ({ personalization }) => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState('Ready');
  const [volume, setVolume] = useState(0);
  const [messages, setMessages] = useState<LiveMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showKeyPicker, setShowKeyPicker] = useState(false);
  const [mediaCard, setMediaCard] = useState<MediaAction | null>(null);
  
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  
  // Refs for connection management
  const isActiveRef = useRef(false);
  const isMountedRef = useRef(true);
  const isUserStoppingRef = useRef(false); 
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sessionRef = useRef<any>(null);
  
  const nextStartTimeRef = useRef<number>(0);
  const audioQueueRef = useRef<AudioBufferSourceNode[]>([]);
  const processingQueueRef = useRef<Promise<void>>(Promise.resolve());

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const cleanup = () => {
    isActiveRef.current = false;
    setIsActive(false);
    
    if (sessionRef.current) {
        try { 
            sessionRef.current.close(); 
        } catch(e) {}
        sessionRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => {
          try { track.stop(); } catch(e) {}
      });
      mediaStreamRef.current = null;
    }

    if (processorRef.current) {
      try {
        processorRef.current.disconnect();
        processorRef.current.onaudioprocess = null;
      } catch(e) {}
      processorRef.current = null;
    }

    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch(e) {}
      audioContextRef.current = null;
    }
    if (inputAudioContextRef.current) {
      try { inputAudioContextRef.current.close(); } catch(e) {}
      inputAudioContextRef.current = null;
    }

    audioQueueRef.current.forEach(source => {
        try { source.stop(); } catch(e) {}
    });
    audioQueueRef.current = [];
    nextStartTimeRef.current = 0;
    
    processingQueueRef.current = Promise.resolve();
    
    if (isMountedRef.current) {
        setIsAiSpeaking(false);
        setVolume(0);
        setStatus('Ready');
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      isUserStoppingRef.current = true;
      cleanup();
    };
  }, []);

  const downsampleBuffer = (buffer: Float32Array, inputRate: number, outputRate: number) => {
    if (outputRate === inputRate) return buffer;
    const ratio = inputRate / outputRate;
    const newLength = Math.floor(buffer.length / ratio);
    const result = new Float32Array(newLength);
    for (let i = 0; i < newLength; i++) {
      const offset = Math.floor(i * ratio);
      result[i] = buffer[offset];
    }
    return result;
  };

  const schedulePlayback = (buffer: AudioBuffer) => {
    const ctx = audioContextRef.current;
    if (!ctx) return;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    
    const gainNode = ctx.createGain();
    gainNode.gain.value = 1.0; 
    
    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    const now = ctx.currentTime;
    if (nextStartTimeRef.current < now) {
        nextStartTimeRef.current = now + 0.1;
    }

    source.start(nextStartTimeRef.current);
    nextStartTimeRef.current += buffer.duration;
    
    if (isMountedRef.current) setIsAiSpeaking(true);
    audioQueueRef.current.push(source);
    
    source.onended = () => {
       const idx = audioQueueRef.current.indexOf(source);
       if (idx > -1) audioQueueRef.current.splice(idx, 1);
       if (audioQueueRef.current.length === 0 && isMountedRef.current) {
         setIsAiSpeaking(false);
       }
    };
  };

  const handleKeySelection = async () => {
    if (window.aistudio && window.aistudio.openSelectKey) {
      await window.aistudio.openSelectKey();
      setError(null);
      setShowKeyPicker(false);
      connect(); // Retry after selection
    }
  };

  const connect = async () => {
    if (!navigator.onLine) {
        setError("No internet connection.");
        return;
    }

    setError(null);
    setShowKeyPicker(false);
    setIsActive(true); 
    isActiveRef.current = true;
    isUserStoppingRef.current = false;
    setStatus('Initializing...');

    try {
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      inputAudioContextRef.current = inputCtx;

      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;
      
      if (outputCtx.state === 'suspended') await outputCtx.resume();
      if (inputCtx.state === 'suspended') await inputCtx.resume();

      nextStartTimeRef.current = outputCtx.currentTime;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const indiaTime = new Date().toLocaleString('en-IN', { 
        timeZone: 'Asia/Kolkata', 
        dateStyle: 'full', 
        timeStyle: 'long' 
      });
      
      // Fixed: Create a new GoogleGenAI instance right before making an API call to ensure it uses the most up-to-date key
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      setStatus('Connecting...');
      
      const sessionPromise = ai.live.connect({
        // Updated model ID from -09-2025 to -12-2025 as per guidelines
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            if (isMountedRef.current) setStatus('Online');
          },
          onmessage: async (message: LiveServerMessage) => {
             if (message.toolCall) {
                for (const call of message.toolCall.functionCalls) {
                   if (call.name === 'play_media') {
                       const args = call.args as any;
                       let url = args.platform === 'spotify' 
                          ? `https://open.spotify.com/search/${encodeURIComponent(args.query)}`
                          : `https://www.youtube.com/results?search_query=${encodeURIComponent(args.query)}`;

                       if (isMountedRef.current) setMediaCard({ ...args, action: 'PLAY_MEDIA', url });

                       sessionPromise.then(session => {
                          session.sendToolResponse({
                              functionResponses: {
                                  id: call.id,
                                  name: call.name,
                                  response: { result: "ok" }
                              }
                          });
                       });
                   }
                }
             }

             const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
             if (base64Audio) {
                const audioBytes = base64ToUint8Array(base64Audio);
                const decodingPromise = decodeAudioData(audioBytes, outputCtx, 24000, 1);
                processingQueueRef.current = processingQueueRef.current
                   .then(() => decodingPromise)
                   .then(buffer => schedulePlayback(buffer))
                   .catch(() => {});
             }

             let role: 'user' | 'model' | null = null;
             let text = '';
             if (message.serverContent?.inputTranscription) {
                role = 'user';
                text = message.serverContent.inputTranscription.text;
             } else if (message.serverContent?.outputTranscription) {
                role = 'model';
                text = message.serverContent.outputTranscription.text;
             }

             if (role && text && isMountedRef.current) {
                setMessages(prev => {
                    const last = prev[prev.length - 1];
                    if (last && last.role === role) {
                        return [...prev.slice(0, -1), { ...last, text: last.text + text }];
                    }
                    return [...prev, { id: crypto.randomUUID(), role, text }];
                });
             }

             if (message.serverContent?.interrupted) {
                processingQueueRef.current = Promise.resolve();
                audioQueueRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
                audioQueueRef.current = [];
                if (audioContextRef.current) nextStartTimeRef.current = audioContextRef.current.currentTime;
                if (isMountedRef.current) setIsAiSpeaking(false);
             }
          },
          onerror: (e: ErrorEvent) => {
             console.error("Live API Session Error:", e);
             const errorMsg = e.message || String(e);
             if (isMountedRef.current) {
                // Guidelines check for Requested entity was not found
                if (errorMsg.includes("Requested entity was not found")) {
                  setError("Model or API Key access denied. Please select a valid key.");
                  setShowKeyPicker(true);
                } else {
                  setError(`Connection Error: ${errorMsg}`);
                }
                setStatus("Failed");
             }
             cleanup();
          },
          onclose: (e: CloseEvent) => {
            if (!isUserStoppingRef.current) {
                if (isMountedRef.current) setStatus("Disconnected");
                cleanup();
            }
          }
        },
        config: {
            responseModalities: [Modality.AUDIO],
            tools: [{ functionDeclarations: [MEDIA_PLAYER_TOOL] }],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
            },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            systemInstruction: buildSystemInstruction(personalization) + 
              `\n\n**UP-TO-DATE CONTEXT (CRITICAL):**
              1. **CURRENT TIME**: Today is ${indiaTime}.
              2. **LOCATION**: User is in India.
              3. **ACCURACY**: If the user asks for the date, day, or time, use the above information exactly.
              4. **IDENTITY**: You are Zara, an advanced AI companion. Maintain fluent native-like conversation.`
        }
      });

      sessionRef.current = await sessionPromise;

      const source = inputCtx.createMediaStreamSource(stream);
      const processor = inputCtx.createScriptProcessor(2048, 1, 1);
      processorRef.current = processor;
      source.connect(processor);
      processor.connect(inputCtx.destination); 

      processor.onaudioprocess = (e) => {
         let inputData = e.inputBuffer.getChannelData(0);
         
         if (isMountedRef.current) {
            let sum = 0;
            for (let i=0; i<inputData.length; i+=16) sum += inputData[i] * inputData[i];
            setVolume(Math.sqrt(sum / (inputData.length/16)) * 5); 
         }
         
         if (inputCtx.sampleRate !== 16000) {
             inputData = downsampleBuffer(inputData, inputCtx.sampleRate, 16000);
         }
         const pcmData = float32ToInt16(inputData);
         const pcmBase64 = arrayBufferToBase64(pcmData.buffer);
         
         sessionPromise.then(session => {
            try {
                session.sendRealtimeInput({
                    media: { mimeType: 'audio/pcm;rate=16000', data: pcmBase64 }
                });
            } catch(e) {}
         });
      };

    } catch (e: any) {
      console.error("Live API Connection Failed:", e);
      const errorMsg = e.message || String(e);
      if (isMountedRef.current) {
         if (errorMsg.includes("Requested entity was not found")) {
            setError("Requested entity was not found. This model may require a selected API key.");
            setShowKeyPicker(true);
         } else {
            setError(`Connection Failed: ${errorMsg}`);
         }
         setStatus('Failed');
      }
      cleanup();
    }
  };

  const toggleConnection = () => {
    if (isActive) {
      isUserStoppingRef.current = true;
      cleanup();
    } else {
      isUserStoppingRef.current = false;
      connect();
    }
  };

  return (
    <div className="h-full flex flex-col relative overflow-hidden animate-fade-in">
      
      {/* Header Visualizer */}
      <div className={`flex-shrink-0 flex flex-col items-center justify-center transition-all duration-300 bg-gradient-to-b from-surfaceHighlight/30 to-transparent ${messages.length > 0 ? 'h-[180px]' : 'h-[300px]'}`}>
        
        <div className="flex items-center gap-3 mb-8">
           <div className={`w-2.5 h-2.5 rounded-full shadow-[0_0_10px_currentColor] ${isActive ? 'bg-green-500 text-green-500 animate-pulse' : error ? 'bg-red-500 text-red-500' : 'bg-gray-400 text-gray-400'}`} />
           <div className="text-text-sub font-mono text-sm flex items-center gap-2">
              {error ? (
                <span className="text-red-400 font-bold flex items-center gap-1">
                   <AlertTriangle className="w-3.5 h-3.5" />
                   {error}
                </span>
              ) : (isAiSpeaking ? (
                <span className="text-primary font-bold flex items-center gap-1.5">
                  <Activity className="w-4 h-4 animate-bounce" />
                  Speaking...
                </span>
              ) : (
                <span className="flex items-center gap-2 font-medium">
                   {status === 'Connecting...' && <Loader2 className="w-3 h-3 animate-spin" />}
                   <span className="opacity-70">{status}</span>
                </span>
              ))}
           </div>
        </div>

        {/* Pulse Visualizer */}
        <div className="relative flex items-center justify-center">
            <div className={`absolute left-1/2 top-1/2 -ml-24 -mt-24 rounded-full border border-primary/20 transition-transform duration-[50ms] ease-linear will-change-transform`}
                 style={{ width: '192px', height: '192px', transform: `scale(${1 + volume * 0.3})` }} />
            
            <div className={`absolute left-1/2 top-1/2 -ml-20 -mt-20 rounded-full border border-accent/30 transition-transform duration-[75ms] ease-linear will-change-transform`}
                 style={{ width: '160px', height: '160px', transform: `scale(${1 + volume * 0.5})`, opacity: 0.5 }} />

            <div 
                 className={`w-32 h-32 rounded-full bg-gradient-to-br transition-all duration-100 ease-out shadow-[0_0_50px_rgba(139,92,246,0.5)] will-change-transform ${
                   isAiSpeaking ? 'from-accent to-purple-600 scale-110 shadow-[0_0_80px_rgba(217,70,239,0.8)]' : 'from-primary to-accent blur-md'
                 }`}
                 style={{ 
                   transform: isAiSpeaking ? `scale(${1.1 + volume * 0.2})` : `scale(${0.9 + volume * 0.6})`, 
                   opacity: isActive ? 0.9 : 0.3 
                 }} 
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {navigator.onLine ? (
                   <Radio className={`w-10 h-10 text-white transition-opacity ${isActive ? 'opacity-100' : 'opacity-50'}`} />
                ) : (
                   <WifiOff className="w-10 h-10 text-white/50" />
                )}
            </div>
        </div>
      </div>

      {/* Key Selection Prompt */}
      {showKeyPicker && (
        <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
           <div className="bg-surface border border-white/10 rounded-[2rem] p-8 max-w-sm w-full text-center shadow-2xl">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-primary">
                 <Key className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">API Key Required</h3>
              <p className="text-text-sub text-sm mb-8 leading-relaxed">
                 To use Live Studio, you must select an API key from a paid GCP project. 
                 <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-primary hover:underline ml-1">Learn about billing</a>
              </p>
              <button 
                onClick={handleKeySelection}
                className="w-full bg-primary hover:bg-primary-dark text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-primary/20 active:scale-95"
              >
                 Select API Key
              </button>
           </div>
        </div>
      )}

      {/* Media Card Overlay */}
      {mediaCard && isActive && (
        <div className="absolute top-4 left-4 right-4 z-50 flex justify-center animate-fade-in pointer-events-none">
              <div className="pointer-events-auto bg-surface/90 backdrop-blur-md border border-primary/30 rounded-2xl p-4 flex items-center gap-4 shadow-xl max-w-md w-full">
                  <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500">
                      {mediaCard.platform === 'spotify' ? <Music className="w-6 h-6 text-green-500" /> : <Youtube className="w-6 h-6" />}
                  </div>
                  <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-text truncate">{mediaCard.title}</h4>
                      <p className="text-xs text-text-sub truncate">
                        {mediaCard.artist || `Playing on ${mediaCard.platform === 'spotify' ? 'Spotify' : 'YouTube'}`}
                      </p>
                  </div>
                  <a 
                     href={mediaCard.url} 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="bg-primary hover:bg-primary-dark text-white p-3 rounded-full shadow-lg"
                  >
                     <ExternalLink className="w-5 h-5" />
                  </a>
                  <button onClick={() => setMediaCard(null)} className="text-text-sub hover:text-text p-1">
                      <X className="w-4 h-4" />
                  </button>
              </div>
        </div>
      )}

      {/* Transcription Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 space-y-4 relative custom-scrollbar">
        {messages.length === 0 && isActive && (
             <div className="text-center text-text-sub/40 mt-10 animate-pulse">
               <p>Listening for your voice...</p>
             </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            <div className={`flex max-w-[85%] gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
               <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border border-border ${msg.role === 'user' ? 'bg-surfaceHighlight' : 'bg-primary/20'}`}>
                 {msg.role === 'user' ? <User className="w-4 h-4 text-text" /> : <Sparkles className="w-4 h-4 text-primary" />}
               </div>
               <div className={`px-4 py-2.5 rounded-2xl text-[15px] shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-surfaceHighlight text-text rounded-tr-sm' 
                    : 'bg-gradient-to-br from-surface/40 to-surface/10 backdrop-blur-sm text-text rounded-tl-sm'
               }`}>
                 {msg.text}
               </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Footer Controls */}
      <div className="flex-shrink-0 p-6 bg-surface/30 backdrop-blur border-t border-border flex flex-col items-center gap-3">
        {error && !showKeyPicker && (
          <button onClick={() => { setError(null); connect(); }} className="flex items-center gap-2 text-xs bg-surfaceHighlight hover:bg-surface px-4 py-2 rounded-lg border border-white/10 mb-2">
            <RefreshCw className="w-3 h-3" /> Reconnect
          </button>
        )}
        
        <button
          onClick={toggleConnection}
          className={`px-10 py-4 rounded-full font-bold text-lg transition-all flex items-center gap-3 shadow-xl transform active:scale-95 ${
            isActive 
              ? 'bg-red-500 text-white hover:bg-red-600 shadow-red-500/30' 
              : 'bg-text text-background hover:opacity-90'
          }`}
        >
          {isActive ? (
            <><MicOff className="w-6 h-6" /> End Session</>
          ) : (
            <><Mic className="w-6 h-6" /> Start Live</>
          )}
        </button>
      </div>

    </div>
  );
};
