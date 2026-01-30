import React, { useRef, useState, useEffect } from 'react';
import { SendHorizontal, Paperclip, X, Image as ImageIcon, FileText, Loader2, Plus, Square, Info, Pencil, Sparkles, Mic, MicOff, WifiOff } from 'lucide-react';
import { Attachment, Message, ViewMode } from '../types';
import { validateFile, createAttachment } from '../utils/fileUtils';
import { getTemplatesForView } from '../constants/templates';
import { analysisService } from '../services/analysisService';

interface InputAreaProps {
  onSendMessage: (text: string, attachments: Attachment[]) => void;
  onStop: () => void;
  isLoading: boolean;
  disabled: boolean;
  isOffline?: boolean;
  editMessage: Message | null;
  onCancelEdit: () => void;
  viewMode?: ViewMode;
  isEmotionalMode?: boolean;
}

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Paste Events
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      // Only handle paste if textarea is focused
      if (document.activeElement !== textareaRef.current) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      let hasFiles = false;
      const files: File[] = [];

      for (let i = 0; i < items.length; i++) {
        if (items[i].kind === 'file') {
          const file = items[i].getAsFile();
          if (file) {
            files.push(file);
            hasFiles = true;
          }
        }
      }

      if (hasFiles) {
        e.preventDefault(); // Prevent pasting the file name or binary text

        // Re-use file selection logic
        for (const file of files) {
          const error = validateFile(file);
          if (error) {
            alert(error); // Simple alert for now
            continue;
          }
          try {
            const attachment = await createAttachment(file);
            setAttachments((prev) => [...prev, attachment]);
          } catch (err) { }
        }

        // Trigger analysis
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
  const recognitionRef = useRef<any>(null);
  const baseTextRef = useRef('');

  const templates = getTemplatesForView(viewMode as ViewMode);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = 0; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const currentTranscript = finalTranscript + interimTranscript;
        const base = baseTextRef.current;
        const spacer = base && !base.endsWith(' ') && currentTranscript ? ' ' : '';
        setText(base + spacer + currentTranscript);

        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (isOffline) {
      alert("Voice input requires an internet connection.");
      return;
    }
    if (!recognitionRef.current) {
      alert("Speech to text is not supported in this browser.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      baseTextRef.current = text;
      recognitionRef.current.start();
    }
  };

  useEffect(() => {
    if (editMessage) {
      setText(editMessage.text);
      setAttachments(editMessage.attachments || []);
      baseTextRef.current = editMessage.text;
      if (textareaRef.current) {
        textareaRef.current.focus();
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
          }
        }, 0);
      }
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

    // Combine text with analysis context if available
    const finalText = analyzedContext ? `${text}\n\n${analyzedContext}` : text;

    onSendMessage(finalText, attachments);
    setText('');
    setAttachments([]);
    setAnalyzedContext('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isOffline) return;
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files) as File[];

      // 1. Create UI attachments immediately
      for (const file of files) {
        const error = validateFile(file);
        if (error) continue;
        try {
          const attachment = await createAttachment(file);
          setAttachments((prev) => [...prev, attachment]);
        } catch (err) { }
      }

      // 2. Start detailed analysis in background
      setIsAnalyzing(true);
      try {
        const result = await analysisService.analyzeFiles(files);
        setAnalyzedContext(prev => prev + (prev ? "\n" : "") + result.context_text);
      } catch (err) {
        console.error("Analysis failed", err);
        // Don't block sending, just log error
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const getPlaceholder = () => {
    if (disabled) return "Please enter API Key to start";
    if (isOffline) return "Offline Mode: Search local notes and memory...";
    if (editMessage) return "Update your message...";
    if (isListening) return "Listening...";
    if (isAnalyzing) return "Analyzing uploaded files... (You can keep typing)";
    if (isEmotionalMode) return "How are you feeling right now? I'm here to listen.";
    return "Enter a prompt here";
  };

  const containerRadius = isEmotionalMode ? 'rounded-full' : 'rounded-[2rem]';
  const containerPadding = isEmotionalMode ? 'px-8' : 'px-6';
  const borderColor = isEmotionalMode
    ? 'border-purple-500/40 shadow-[0_0_20px_rgba(139,92,246,0.15)]'
    : isOffline ? 'border-orange-500/30' : 'border-white/10';

  return (
    <div className="w-full max-w-3xl mx-auto p-4 md:pb-6 relative">
      {!editMessage && !isLoading && !disabled && !isOffline && !isEmotionalMode && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide px-2">
          {templates.map(tpl => (
            <button
              key={tpl.id}
              onClick={() => setText(tpl.prompt)}
              className="flex items-center gap-1.5 px-4 py-2 bg-surfaceHighlight border border-white/10 rounded-xl text-xs text-text-sub hover:text-text hover:border-white/20 transition-all whitespace-nowrap shadow-sm group"
            >
              <Sparkles className="w-3 h-3 text-text-sub group-hover:text-primary transition-colors" />
              {tpl.label}
            </button>
          ))}
        </div>
      )}

      {editMessage && (
        <div className="mx-2 mb-3 bg-surfaceHighlight border border-border rounded-2xl p-4 flex items-start gap-3 animate-fade-in shadow-xl">
          <div className="bg-primary/10 p-2 rounded-full text-primary mt-0.5">
            <Pencil className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <span className="text-sm font-bold text-primary flex items-center gap-2">
                Editing message
                <button onClick={onCancelEdit} className="bg-surface border border-border rounded-full p-0.5 text-text-sub hover:text-text"><X className="w-3.5 h-3.5" /></button>
              </span>
            </div>
            <p className="text-xs text-text-sub mt-1">Changes will restart the conversation from this point.</p>
          </div>
        </div>
      )}

      <div className={`relative bg-surface/40 backdrop-blur-xl border transition-all focus-within:ring-2 focus-within:ring-purple-500/20 shadow-2xl flex flex-col ${containerRadius} ${borderColor}`}>

        {attachments.length > 0 && (
          <div className="flex gap-3 p-4 pb-2 overflow-x-auto">
            {attachments.map((att) => (
              <div key={att.id} className="relative group flex-shrink-0">
                <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/5 bg-background">
                  {att.mimeType.startsWith('image/') ? <img src={att.previewUrl} alt="preview" className="w-full h-full object-cover" /> : <FileText className="w-full h-full p-4 text-text-sub" />}
                </div>
                <button onClick={() => removeAttachment(att.id)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
              </div>
            ))}
            {isAnalyzing && (
              <div className="flex items-center justify-center p-4 bg-surfaceHighlight/20 rounded-xl animate-pulse">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            )}
          </div>
        )}

        <div className={`flex items-center gap-2 ${containerPadding} py-2`}>
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`p-2 -ml-2 rounded-full transition-colors ${isOffline ? 'text-gray-600' : 'text-text-sub hover:text-text hover:bg-surfaceHighlight'}`}
            disabled={disabled || isLoading || isOffline}
          >
            <Plus className="w-6 h-6" />
          </button>
          <input
            type="file"
            multiple
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileSelect}
          // accept="image/*,application/pdf,text/*" 
          // Removed strict accept to allow all files for backend analysis
          />

          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={getPlaceholder()}
            disabled={disabled}
            className={`flex-1 bg-transparent text-text placeholder-text-sub/50 text-[16px] resize-none py-4 focus:outline-none max-h-[160px] overflow-y-auto transition-colors`}
            rows={1}
          />

          <div className="flex items-center gap-1">
            {isEmotionalMode && <div className="w-px h-6 bg-white/10 mx-2" />}

            <button
              onClick={toggleListening}
              className={`p-2 rounded-full transition-all ${isListening ? 'text-purple-400 animate-pulse' : 'text-text-sub hover:text-text'}`}
              disabled={disabled || isLoading || isOffline}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {isLoading || isAnalyzing ? (
              <button onClick={onStop} className="p-2 rounded-full text-text hover:text-red-400">
                {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : <Square className="w-5 h-5 fill-current" />}
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={(!text.trim() && attachments.length === 0) || disabled}
                className={`p-2 rounded-full transition-all ${(!text.trim() && attachments.length === 0) ? 'text-text-sub/20' : 'text-text hover:scale-110 active:scale-95'}`}
              >
                <SendHorizontal className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="text-center mt-4">
        <p data-nosnippet className="text-[11px] text-text-sub/40 leading-relaxed px-4">
          Zara AI may display inaccurate info, including about people, so double-check its responses.
        </p>
      </div>
    </div>
  );
};