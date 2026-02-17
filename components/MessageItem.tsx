import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Role, Message } from '../types';
import { Bot, User, FileText, ExternalLink, Volume2, Square, Copy, Check, Pencil, Download, WifiOff, Workflow, FileDown, AlertTriangle, Loader2, Play, ThumbsUp, ThumbsDown, RefreshCw, Share2, MoreHorizontal, GitBranch, Share, Heart, Bookmark, Flag } from 'lucide-react';
import { DiagramSystem } from './DiagramSystem';

interface MessageItemProps {
  message: Message;
  onEdit?: (message: Message) => void;
  onRegenerate?: (message: Message) => void;
  onLike?: (message: Message) => void;
  onDislike?: (message: Message) => void;
  onShare?: (message: Message) => void;
  onBranch?: (message: Message) => void;
}

const CodeBlock = ({ inline, className, children, ...props }: any) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');

  const handleCopy = () => {
    navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!inline && match) {
    if (match[1] === 'json_diagram') {
      try {
        const schema = JSON.parse(String(children));
        return <DiagramSystem schema={schema} />;
      } catch (e) {
        return (
          <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl text-xs text-red-500 font-mono">
            Diagram JSON Parse Error: {String(e)}
          </div>
        );
      }
    }

    if (match[1] === 'mermaid') {
      // Fallback or legacy support if AI still outputs mermaid for a moment
      return (
        <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-xl text-xs text-orange-500">
          Mermaid visualization is deprecated. Please ask for a "Graphviz diagram".
        </div>
      );
    }

    return (
      <div className="relative group my-4 rounded-lg overflow-hidden border border-white/10 bg-[#1e1e1e] animate-scale-in">
        <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-white/5">
          <span className="text-xs text-gray-400 font-mono">{match[1]}</span>
          <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors">
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy code'}
          </button>
        </div>
        <pre className="!m-0 !p-4 !bg-transparent overflow-x-auto">
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      </div>
    );
  }
  return <code className={`${className} bg-primary/10 text-primary px-1.5 py-0.5 rounded text-sm`} {...props}>{children}</code>;
};

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  onEdit,
  onRegenerate,
  onLike,
  onDislike,
  onShare,
  onBranch
}) => {
  const isUser = message.role === Role.USER;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [utterance, setUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    return () => {
      if (isSpeaking) window.speechSynthesis.cancel();
    };
  }, [isSpeaking]);

  const handleSpeak = () => {
    window.speechSynthesis.cancel();
    const cleanText = message.text
      .replace(/[*_#`]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\[.*?\]/g, '');

    const newUtterance = new SpeechSynthesisUtterance(cleanText);
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.name.includes('Google') && v.lang.startsWith('en'))
      || voices.find(v => v.lang.startsWith('en'));
    if (preferredVoice) newUtterance.voice = preferredVoice;
    newUtterance.rate = speed;
    newUtterance.onend = () => { setIsSpeaking(false); setUtterance(null); };
    newUtterance.onerror = () => { setIsSpeaking(false); setUtterance(null); };
    setUtterance(newUtterance);
    setIsSpeaking(true);
    window.speechSynthesis.speak(newUtterance);
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setUtterance(null);
  };

  const cycleSpeed = () => {
    const speeds = [1, 1.25, 1.5, 2, 0.75];
    const nextIndex = (speeds.indexOf(speed) + 1) % speeds.length;
    const newSpeed = speeds[nextIndex];
    setSpeed(newSpeed);
    if (isSpeaking && utterance) {
      window.speechSynthesis.cancel();
      const newUtt = new SpeechSynthesisUtterance(utterance.text);
      newUtt.voice = utterance.voice;
      newUtt.rate = newSpeed;
      newUtt.onend = () => { setIsSpeaking(false); setUtterance(null); };
      setUtterance(newUtt);
      window.speechSynthesis.speak(newUtt);
    }
  };

  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    if (showMoreMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMoreMenu]);

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6 group animate-slide-up`}>
      <div className={`flex max-w-[95%] md:max-w-[80%] gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border border-border ${isUser ? 'bg-surfaceHighlight' : message.isOffline ? 'bg-orange-500/10 border-orange-500/30' : 'bg-transparent'} transition-transform duration-300 hover:scale-110`}>
          {isUser ? (
            <User className="w-5 h-5 text-text" />
          ) : (
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shadow-sm ${message.isOffline ? 'bg-orange-500' : 'bg-gradient-to-br from-primary to-accent'}`}>
              {message.isOffline ? <WifiOff className="w-3.5 h-3.5 text-white" /> : <Bot className="w-3.5 h-3.5 text-white" />}
            </div>
          )}
        </div>

        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} w-full min-w-0`}>
          <span className="text-xs text-text-sub mb-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            {isUser ? 'You' : 'Zara AI'}
            {!isUser && message.isOffline && <span className="text-[10px] bg-orange-500/10 text-orange-500 px-1.5 rounded">OFFLINE</span>}
          </span>

          {message.attachments && message.attachments.length > 0 && (
            <div className={`flex flex-wrap gap-2 mb-2 ${isUser ? 'justify-end' : 'justify-start'} animate-scale-in`}>
              {message.attachments.map((att) => {
                const isImage = att.mimeType.startsWith('image/');
                const isVideo = att.mimeType.startsWith('video/');
                const isPdf = att.mimeType === 'application/pdf';
                const isText = att.mimeType.startsWith('text/') ||
                  att.mimeType === 'application/json' ||
                  ['.ts', '.tsx', '.js', '.jsx', '.py', '.md', '.txt'].some(ext => att.file.name.endsWith(ext));

                return (
                  <div key={att.id} className={`relative group overflow-hidden rounded-xl border border-border bg-surfaceHighlight/30 transition-all hover:border-primary/30 ${isPdf || isText || isVideo ? 'w-full max-w-2xl' : ''}`}>
                    {(isPdf || isText || isVideo) && (
                      <div className="flex items-center justify-between p-3 border-b border-border bg-surfaceHighlight/50">
                        <div className="flex items-center gap-2.5 overflow-hidden px-1">
                          {isPdf ? <div className="p-1.5 bg-red-500/10 rounded-lg"><FileText className="w-4 h-4 text-red-500" /></div> :
                            isVideo ? <div className="p-1.5 bg-purple-500/10 rounded-lg"><Play className="w-4 h-4 text-purple-500" /></div> :
                              <div className="p-1.5 bg-blue-500/10 rounded-lg"><FileText className="w-4 h-4 text-blue-500" /></div>}
                          <div className="flex flex-col truncate">
                            <span className="text-[12px] font-bold text-text truncate">{att.file.name}</span>
                            <span className="text-[9px] text-text-sub uppercase tracking-wider font-bold">
                              {isPdf ? 'PDF Document' : isVideo ? 'Video File' : 'Text File'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <a href={att.previewUrl} download={att.file.name} className="p-2 hover:bg-surface rounded-xl text-text-sub hover:text-text transition-all bg-surface/40 border border-transparent hover:border-border" title="Download File">
                            <FileDown className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    )}

                    {isImage ? (
                      <img src={att.previewUrl} alt="attachment" className="h-32 w-auto object-cover transition-transform hover:scale-105" />
                    ) : isVideo ? (
                      <div className="w-full bg-black">
                        <video src={att.previewUrl} controls className="w-full max-h-[400px] block" />
                      </div>
                    ) : isText ? (
                      <div className="p-3 bg-black/40 font-mono text-[10px] text-text-sub leading-relaxed max-h-40 overflow-y-auto custom-scrollbar select-all">
                        {(() => {
                          try {
                            const decoded = atob(att.base64);
                            return decoded.length > 2000 ? decoded.substring(0, 2000) + '...' : decoded;
                          } catch (e) { return 'Error previewing text content.'; }
                        })()}
                      </div>
                    ) : isPdf ? (
                      <div className="w-full h-[500px] bg-white overflow-hidden border-t border-border relative">
                        <object data={att.previewUrl} type="application/pdf" className="w-full h-full block">
                          <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-surfaceHighlight/10">
                            <FileText className="w-16 h-16 text-text-sub/20 mb-4" />
                            <p className="text-sm font-medium text-text-sub mb-4">Preview not available in this browser.</p>
                            <a href={att.previewUrl} target="_blank" rel="noopener noreferrer" className="px-6 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform">Open in New Tab</a>
                          </div>
                        </object>
                      </div>
                    ) : (
                      <div className="h-16 w-32 flex flex-col items-center justify-center p-2">
                        <FileText className="w-6 h-6 text-text-sub mb-1" />
                        <span className="text-[9px] text-text-sub truncate w-full text-center">{att.file.name}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-end gap-2 max-w-full">
            {isUser && onEdit && (
              <button onClick={() => onEdit(message)} className="p-1.5 text-text-sub hover:text-text bg-surfaceHighlight hover:bg-surface border border-transparent hover:border-border rounded-full opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110" title="Edit message">
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}

            <div className={`px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed shadow-sm overflow-hidden transition-all hover:shadow-md ${isUser ? 'bg-surfaceHighlight text-text rounded-tr-sm border border-white/5' : message.isOffline ? 'bg-orange-500/5 text-text-sub w-full markdown-body border border-orange-500/10' : 'bg-transparent text-text-sub w-full markdown-body'}`}>
              {isUser ? <div className="whitespace-pre-wrap">{message.text}</div> : (
                <div className="relative">
                  <ReactMarkdown components={{ code: CodeBlock }}>{message.text}</ReactMarkdown>
                  {message.isStreaming && <span className="inline-block w-2.5 h-2.5 rounded-full bg-text-sub ml-1 animate-pulse align-baseline" />}
                </div>
              )}
              {message.isError && <p className="text-red-400 text-sm mt-2 animate-pulse">Error sending message.</p>}
            </div>
          </div>

          {!isUser && message.sources && message.sources.length > 0 && (
            <div className="mt-2 ml-1 mb-2 animate-slide-up delay-100">
              <div className="flex wrap gap-2">
                {message.sources.map((source, idx) => (
                  <a key={idx} href={source.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 bg-surfaceHighlight border border-border hover:bg-surface hover:border-primary/50 text-text-sub hover:text-primary px-3 py-1.5 rounded-full text-xs transition-all max-w-[240px] hover:scale-105" title={source.title}>
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{source.title}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {!isUser && !message.isError && (
            <div className="mt-2 ml-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* Like / Dislike */}
              <button
                onClick={() => onLike?.(message)}
                className="p-1.5 rounded-lg text-text-sub hover:text-green-400 hover:bg-surfaceHighlight transition-colors"
                title="Like response"
              >
                <ThumbsUp className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDislike?.(message)}
                className="p-1.5 rounded-lg text-text-sub hover:text-red-400 hover:bg-surfaceHighlight transition-colors"
                title="Dislike response"
              >
                <ThumbsDown className="w-4 h-4" />
              </button>

              <div className="w-px h-3 bg-white/5 mx-1" />

              {/* Copy */}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(message.text);
                  // Optional: trigger a small "Copied" alert or icon change elsewhere
                }}
                className="p-1.5 rounded-lg text-text-sub hover:text-text hover:bg-surfaceHighlight transition-colors"
                title="Copy response"
              >
                <Copy className="w-4 h-4" />
              </button>

              {/* Share */}
              <button
                onClick={() => onShare?.(message)}
                className="p-1.5 rounded-lg text-text-sub hover:text-blue-400 hover:bg-surfaceHighlight transition-colors"
                title="Share response"
              >
                <Share2 className="w-4 h-4" />
              </button>

              {/* Regenerate */}
              <button
                onClick={() => onRegenerate?.(message)}
                className="p-1.5 rounded-lg text-text-sub hover:text-primary hover:bg-surfaceHighlight transition-colors"
                title="Regenerate response"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              {/* More Menu */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className={`p-1.5 rounded-lg transition-colors ${showMoreMenu ? 'text-primary bg-surfaceHighlight' : 'text-text-sub hover:text-text hover:bg-surfaceHighlight'}`}
                  title="More options"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>

                {showMoreMenu && (
                  <div className="absolute left-0 bottom-full mb-2 flex flex-col bg-surface border border-white/10 rounded-xl shadow-2xl overflow-hidden min-w-[170px] z-50 animate-in fade-in slide-in-from-bottom-2 select-none">
                    <button
                      onClick={() => { onBranch?.(message); setShowMoreMenu(false); }}
                      className="px-3 py-2.5 hover:bg-white/5 text-left text-xs flex items-center gap-2.5 text-text transition-colors"
                    >
                      <GitBranch className="w-4 h-4 text-primary" /> Branch in new chat
                    </button>
                    <button
                      onClick={() => { if (isSpeaking) handleStop(); else handleSpeak(); setShowMoreMenu(false); }}
                      className="px-3 py-2.5 hover:bg-white/5 text-left text-xs flex items-center gap-2.5 text-text transition-colors"
                    >
                      {isSpeaking ? (
                        <><Square className="w-4 h-4 text-red-500 fill-current" /> Stop reading</>
                      ) : (
                        <><Volume2 className="w-4 h-4 text-blue-400" /> Read aloud</>
                      )}
                    </button>
                    <div className="h-px bg-white/5 mx-2" />
                    <button
                      onClick={() => setShowMoreMenu(false)}
                      className="px-3 py-2.5 hover:bg-white/5 text-left text-xs flex items-center gap-2.5 text-text-sub transition-colors"
                    >
                      <Bookmark className="w-4 h-4" /> Save message
                    </button>
                    <button
                      // REQUIRED FOR GOOGLE PLAY GENERATIVE AI POLICY
                      onClick={async () => {
                        setShowMoreMenu(false);
                        const reason = window.prompt("Why are you reporting this message? (e.g. Offensive, Harmful, Inaccurate)");
                        if (reason) {
                          const { reportService } = await import('../services/reportService');
                          await reportService.reportMessage(message.text, reason);
                          alert("Thank you. This content has been flagged for review.");
                        }
                      }}
                      className="px-3 py-2.5 hover:bg-white/5 text-left text-xs flex items-center gap-2.5 text-red-500/70 hover:text-red-400 transition-colors"
                    >
                      <Flag className="w-4 h-4" /> Report issue
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
