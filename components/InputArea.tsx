import React, { useRef, useState, useEffect, useCallback } from 'react';
import { SendHorizontal, X, FileText, Loader2, Plus, Square, Pencil, Sparkles, Mic, MicOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Attachment, Message, ViewMode } from '../types';
import { validateFile, createAttachment } from '../utils/fileUtils';
import { getTemplatesForView } from '../constants/templates';
import { analysisService } from '../services/analysisService';

interface InputAreaProps {
  onSendMessage: (text: string, attachments: Attachment[], analysisContext?: string) => void;
  onStop: () => void;
  isLoading: boolean;
  disabled: boolean;
  isOffline?: boolean;
  editMessage: Message | null;
  onCancelEdit: () => void;
  viewMode?: ViewMode;
  isEmotionalMode?: boolean;
}

const PLACEHOLDERS = [
  "Ask Zara anything…",
  "Zara is listening…",
  "Need help? Just type…",
  "Summarize a document…",
  "Explain a concept simply…"
];

export const InputArea: React.FC<InputAreaProps> = ({
  onSendMessage,
  onStop,
  isLoading,
  disabled,
  isOffline = false,
  editMessage,
  onCancelEdit,
  viewMode = 'chat',
  isEmotionalMode = false
}) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [analyzedContext, setAnalyzedContext] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const baseTextRef = useRef('');

  // Placeholder rotation logic
  useEffect(() => {
    if (isFocused || text.length > 0 || disabled || isLoading) return;

    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
    }, 3500);

    return () => clearInterval(interval);
  }, [isFocused, text, disabled, isLoading]);

  // Handle Paste Events
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (document.activeElement !== textareaRef.current) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].kind === 'file') {
          const file = items[i].getAsFile();
          if (file) files.push(file);
        }
      }

      if (files.length > 0) {
        e.preventDefault();
        for (const file of files) {
          const error = validateFile(file);
          if (error) continue;
          try {
            const attachment = await createAttachment(file);
            setAttachments((prev) => [...prev, attachment]);
          } catch (err) { }
        }

        setIsAnalyzing(true);
        try {
          const result = await analysisService.analyzeFiles(files);
          setAnalyzedContext(prev => prev + (prev ? "\n" : "") + result.context_text);
        } catch (err) {
          console.error("Paste analysis failed", err);
        } finally {
          setIsAnalyzing(false);
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);

  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        for (let i = 0; i < event.results.length; ++i) {
          if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
          else interimTranscript += event.results[i][0].transcript;
        }
        const currentTranscript = finalTranscript + interimTranscript;
        const base = baseTextRef.current;
        const spacer = base && !base.endsWith(' ') && currentTranscript ? ' ' : '';
        setText(base + spacer + currentTranscript);
      };
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (isOffline) return;
    if (!recognitionRef.current) return;
    if (isListening) recognitionRef.current.stop();
    else {
      baseTextRef.current = text;
      recognitionRef.current.start();
    }
  };

  useEffect(() => {
    if (editMessage) {
      setText(editMessage.text);
      setAttachments(editMessage.attachments || []);
      baseTextRef.current = editMessage.text;
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
      }, 0);
    } else {
      setText('');
      setAttachments([]);
    }
  }, [editMessage]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [text]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if ((!text.trim() && attachments.length === 0) || isLoading || disabled) return;
    if (isListening && recognitionRef.current) recognitionRef.current.stop();
    onSendMessage(text, attachments, analyzedContext);
    setText('');
    setAttachments([]);
    setAnalyzedContext('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isOffline) return;
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files) as File[];
      for (const file of files) {
        const error = validateFile(file);
        if (error) continue;
        try {
          const attachment = await createAttachment(file);
          setAttachments((prev) => [...prev, attachment]);
        } catch (err) { }
      }
      setIsAnalyzing(true);
      try {
        const result = await analysisService.analyzeFiles(files);
        setAnalyzedContext(prev => prev + (prev ? "\n" : "") + result.context_text);
      } catch (err) {
        console.error("Analysis failed", err);
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const templates = getTemplatesForView(viewMode as ViewMode);

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-6 md:pb-10 relative z-20">
      {/* Templates / Suggestions */}
      <AnimatePresence>
        {!editMessage && !isLoading && !disabled && !isOffline && !isEmotionalMode && text.length === 0 && !isFocused && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex gap-2 mb-4 md:mb-6 overflow-x-auto pb-2 scrollbar-hide px-4 md:px-2 justify-start md:justify-center"
          >
            {templates.slice(0, 4).map(tpl => (
              <button
                key={tpl.id}
                onClick={() => setText(tpl.prompt)}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-full text-sm text-white/50 hover:text-white hover:border-white/30 hover:bg-white/10 transition-all whitespace-nowrap shadow-lg group stardust-bg"
              >
                <div className="relative">
                  {/* Primary Star */}
                  <motion.div
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.7, 1, 0.7],
                      rotate: [0, 10, -10, 0],
                      filter: [
                        "drop-shadow(0 0 2px rgba(168,85,247,0.5))",
                        "drop-shadow(0 0 10px rgba(168,85,247,0.9))",
                        "drop-shadow(0 0 2px rgba(168,85,247,0.5))"
                      ]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    whileHover={{
                      rotate: 180,
                      scale: 1.6,
                      filter: "drop-shadow(0 0 20px rgba(168,85,247,1))"
                    }}
                  >
                    <Sparkles className="w-4 h-4 text-purple-400" />
                  </motion.div>

                  {/* Secondary Sparkle */}
                  <motion.div
                    animate={{
                      scale: [0.7, 1.2, 0.7],
                      opacity: [0.4, 0.9, 0.4],
                      x: [3, -3, 3],
                      y: [-3, 3, -3]
                    }}
                    transition={{
                      duration: 2.2,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.3
                    }}
                    className="absolute -top-1.5 -right-1.5 pointer-events-none"
                  >
                    <Sparkles className="w-2.5 h-2.5 text-pink-300/70" />
                  </motion.div>

                  {/* Tertiary Sparkle (Mini) */}
                  <motion.div
                    animate={{
                      scale: [0.5, 1, 0.5],
                      opacity: [0, 0.7, 0],
                      x: [-4, 4, -4],
                      y: [4, -4, 4]
                    }}
                    transition={{
                      duration: 1.8,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.7
                    }}
                    className="absolute -bottom-1 -left-1 pointer-events-none"
                  >
                    <Sparkles className="w-2 h-2 text-blue-300/50" />
                  </motion.div>
                </div>
                {tpl.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editing State UI */}
      {editMessage && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mx-4 mb-4 bg-white/5 backdrop-blur-2xl border border-purple-500/30 rounded-3xl p-5 flex items-start gap-4 shadow-[0_0_30px_rgba(168,85,247,0.15)]"
        >
          <div className="bg-purple-500/20 p-2.5 rounded-full text-purple-400">
            <Pencil className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-purple-300 flex items-center gap-2 uppercase tracking-widest">
                Editing Mode
              </span>
              <button onClick={onCancelEdit} className="hover:bg-white/10 p-1.5 rounded-full text-white/40 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-white/60 mt-1">Updates will re-route the internal conversation context.</p>
          </div>
        </motion.div>
      )}

      {/* Main Input Box Wrapper with Neon Glow */}
      <motion.div
        animate={{
          scale: isFocused ? 1.01 : 1,
          boxShadow: isFocused
            ? (isEmotionalMode
              ? "0 0 50px rgba(168,85,247,0.3), 0 0 100px rgba(236,72,153,0.15)"
              : "0 0 40px rgba(168,85,247,0.25), 0 0 100px rgba(236,72,153,0.1)")
            : "0 0 20px rgba(0,0,0,0.3)"
        }}
        transition={{ duration: 0.3 }}
        className={`relative flex flex-col glass-morphism ${isEmotionalMode ? 'rounded-full border-purple-500/30' : 'rounded-[1.5rem] md:rounded-[2rem] border-white/10'} border overflow-hidden transition-all bg-black/40 backdrop-blur-3xl`}
      >
        {/* Attachment Ribbon */}
        <AnimatePresence>
          {(attachments.length > 0 || isAnalyzing) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex gap-4 p-5 pb-1 overflow-x-auto scrollbar-hide"
            >
              {attachments.map((att) => (
                <motion.div
                  key={att.id}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="relative group flex-shrink-0"
                >
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/10 bg-white/5 hover:border-purple-500/50 transition-colors">
                    {att.mimeType.startsWith('image/') ? (
                      <img src={att.previewUrl} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-2 text-white/40">
                        <FileText className="w-8 h-8 mb-1" />
                        <span className="text-[9px] uppercase tracking-tighter truncate w-full text-center">{att.file.name}</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => removeAttachment(att.id)}
                    className="absolute -top-2 -right-2 bg-pink-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              ))}
              {isAnalyzing && (
                <div className="flex flex-col items-center justify-center px-4 bg-white/5 rounded-2xl animate-pulse min-w-[80px]">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-400 mb-1" />
                  <span className="text-[10px] text-white/30 uppercase font-bold">Parsing</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-end gap-2 md:gap-3 px-3 md:px-6 py-2">
          {/* Action Icons */}
          <div className="flex items-center mb-1">
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`p-2.5 rounded-full transition-all bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 active:scale-90 ${isOffline ? 'opacity-20 pointer-events-none' : 'text-white/60 hover:text-white'}`}
              disabled={disabled || isLoading || isOffline}
            >
              <Plus className="w-6 h-6" />
            </button>
            <input type="file" multiple ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
          </div>

          {/* Text Area Content */}
          <div className="relative flex-1 min-h-[56px] flex items-center">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              disabled={disabled}
              className={`w-full bg-transparent text-white placeholder-transparent text-[16px] leading-relaxed resize-none py-3.5 focus:outline-none max-h-[200px] overflow-y-auto custom-scrollbar relative z-10`}
              rows={1}
            />

            {/* Animated Placeholder Text */}
            <AnimatePresence mode="wait">
              {text.length === 0 && !isFocused && (
                <motion.div
                  key={placeholderIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 0.5, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute left-0 text-white/50 pointer-events-none select-none text-[16px] italic"
                >
                  {isEmotionalMode
                    ? "How are you feeling right now? I'm here to listen."
                    : (disabled ? "System initialization needed..." : PLACEHOLDERS[placeholderIndex])
                  }
                </motion.div>
              )}
            </AnimatePresence>

            {isOffline && text.length === 0 && !isFocused && (
              <div className="absolute left-0 text-orange-400/50 italic text-[16px] pointer-events-none">Offline - Accessing Local Knowledge...</div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 mb-1">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleListening}
              className={`p-2.5 rounded-full transition-all border border-white/5 ${isListening ? 'bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'}`}
              disabled={disabled || isLoading || isOffline}
            >
              {isListening ? (
                <div className="relative">
                  <MicOff className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                  </span>
                </div>
              ) : <Mic className="w-5 h-5" />}
            </motion.button>

            {isLoading || isAnalyzing ? (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onStop}
                className="p-2.5 rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/30 group"
              >
                {isAnalyzing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Square className="w-6 h-6 fill-current group-hover:scale-90 transition-transform" />}
              </motion.button>
            ) : (
              <motion.button
                whileHover={text.trim() || attachments.length > 0 ? { scale: 1.1 } : {}}
                whileTap={text.trim() || attachments.length > 0 ? { scale: 0.95 } : {}}
                onClick={handleSend}
                disabled={(!text.trim() && attachments.length === 0) || disabled}
                className={`p-3 rounded-full transition-all shadow-lg ${(!text.trim() && attachments.length === 0)
                  ? 'bg-white/5 text-white/10 border border-white/5'
                  : 'bg-gradient-to-tr from-purple-600 to-pink-600 text-white border-none shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)]'}`}
              >
                <SendHorizontal className={`w-6 h-6 ${text.trim() ? 'animate-pulse-slow' : ''}`} />
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Compliance / Footer Text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="text-center mt-5"
      >
        <p data-nosnippet className="text-[11px] text-white/20 leading-relaxed px-4">
          Zara AI may display inaccurate info, including about people, so double-check its responses.
        </p>
      </motion.div>

      <style>{`
        .glass-morphism {
          background: rgba(10, 10, 10, 0.4);
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.9; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s infinite ease-in-out;
        }
        .stardust-bg {
          background-image: 
            radial-gradient(1px 1px at 20% 30%, white, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 40% 70%, white, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 80% 40%, white, rgba(0,0,0,0));
          background-size: 200% 200%;
          animation: stardust 4s infinite linear;
        }
        @keyframes stardust {
          0% { background-position: 0% 0%; }
          100% { background-position: 100% 100%; }
        }
      `}</style>
    </div>
  );
};
