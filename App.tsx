import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense, lazy } from 'react';
import { Sparkles, BookOpen, Heart, Code2, Palette, WifiOff, Globe, Search, ChevronDown, Brain, Upload, FileText, File, Menu, X, Loader2, Activity, Eye, EyeOff } from 'lucide-react';
import { Message, Role, Attachment, ViewMode, ChatConfig, PersonalizationConfig, Persona } from './types';
import { sendMessageToGeminiStream } from './services/geminiRest';
import { OfflineService } from './services/offlineService';
import { securityService } from './services/securityService';
import { authService } from './services/authService';
import { MessageItem } from './components/MessageItem';
import { InputArea } from './components/InputArea';
import { SettingsModal } from './components/SettingsModal';
import { Sidebar } from './components/Sidebar';
import { ChatControls } from './components/ChatControls';
import { FeedbackModal } from './components/FeedbackModal';
import { AuthModal } from './components/AuthModal';
import { useChatSessions } from './hooks/useChatSessions';
import { useTheme } from './theme/ThemeContext';
import { useAppMemory } from './hooks/useAppMemory';
import { useModeThemeSync } from './hooks/useModeThemeSync';
import { CommandPalette } from './components/CommandPalette';
import { HomeDashboard } from './components/features/HomeDashboard';
import { exportChatToMarkdown, exportChatToPDF, exportChatToText } from './utils/exportUtils';
import { useBackgroundSync } from './hooks/useBackgroundSync';

// Lazy Loaded Components for Performance
const StudentMode = lazy(() => import('./components/StudentMode').then(m => ({ default: m.StudentMode })));
const CodeMode = lazy(() => import('./components/CodeMode').then(m => ({ default: m.CodeMode })));
const LiveMode = lazy(() => import('./components/LiveMode').then(m => ({ default: m.LiveMode })));
const ImageMode = lazy(() => import('./components/ImageMode').then(m => ({ default: m.ImageMode })));
const ExamMode = lazy(() => import('./components/ExamMode').then(m => ({ default: m.ExamMode })));
const AnalyticsDashboard = lazy(() => import('./components/AnalyticsDashboard').then(m => ({ default: m.AnalyticsDashboard })));
const StudyPlanner = lazy(() => import('./components/StudyPlanner').then(m => ({ default: m.StudyPlanner })));
const AboutPage = lazy(() => import('./components/AboutPage').then(m => ({ default: m.AboutPage })));
const FlashcardMode = lazy(() => import('./components/FlashcardMode').then(m => ({ default: m.FlashcardMode })));
const VideoMode = lazy(() => import('./components/VideoMode').then(m => ({ default: m.VideoMode })));
const NotesVault = lazy(() => import('./components/NotesVault').then(m => ({ default: m.NotesVault })));

const GithubMode = lazy(() => import('./components/GithubMode').then(m => ({ default: m.GithubMode })));
const LifeOS = lazy(() => import('./components/features/LifeOS').then(m => ({ default: m.LifeOS })));
const SkillOS = lazy(() => import('./components/features/SkillOS').then(m => ({ default: m.SkillOS })));
const MemoryVault = lazy(() => import('./components/features/MemoryVault').then(m => ({ default: m.MemoryVault })));
const CreativeStudio = lazy(() => import('./components/features/CreativeStudio').then(m => ({ default: m.CreativeStudio })));
const PricingView = lazy(() => import('./components/os/PricingView').then(m => ({ default: m.PricingView })));

import { GoogleOAuthProvider } from "@react-oauth/google";

const STORAGE_KEY_PERSONALIZATION = 'zara_personalization';

const LoadingFallback = () => (
  <div className="flex-1 flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="w-10 h-10 text-primary animate-spin" />
      <span className="text-xs font-bold uppercase tracking-widest text-primary animate-pulse">Initializing Component...</span>
    </div>
  </div>
);

const App: React.FC = () => {
  const { lastView, updateView, systemConfig, updateSystemConfig } = useAppMemory();
  const { currentThemeName, setTheme } = useTheme();

  useBackgroundSync();

  const [currentView, setCurrentView] = useState<ViewMode>('chat');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const [isFlipping, setIsFlipping] = useState(false);

  const [currentUser, setCurrentUser] = useState<{ email: string, is_privacy_mode?: boolean, auto_delete_days?: number } | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const fetchUserProfile = async (token: string) => {
    try {
      const res = await fetch(`${(import.meta as any).env.VITE_API_URL || 'http://localhost:8000/api/v1'}/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser({
          email: data.email,
          is_privacy_mode: data.is_privacy_mode,
          auto_delete_days: data.auto_delete_days
        });
      }
    } catch (e) { console.error("Failed to fetch profile", e); }
  };

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const email = localStorage.getItem('auth_email');
    if (token) {
      // If we have an email, set it immediately for UI responsiveness, then fetch full profile
      if (email) setCurrentUser({ email });
      fetchUserProfile(token);
    }
  }, []);

  const handleLoginSuccess = (token: string, email: string) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_email', email);
    setCurrentUser({ email }); // Optimistic update
    fetchUserProfile(token); // Fetch real status
    setIsAuthOpen(false);
  };

  const handleClearSession = async () => {
    const sessionId = sessionStorage.getItem('zara_session_id');
    if (sessionId) {
      try {
        await fetch(`${(import.meta as any).env.VITE_API_URL || 'http://localhost:8000/api/v1'}/ai/session/${sessionId}`, {
          method: 'DELETE'
        });
      } catch (e) {
        console.error("Failed to clear session on backend", e);
      }
    }
    setMessages([]);
    clearCurrentSession();
    // Generate a fresh session ID for immediate use
    const newSessionId = `anon_${crypto.randomUUID()}`;
    sessionStorage.setItem('zara_session_id', newSessionId);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_email');
    setCurrentUser(null);
    handleClearSession(); // Feature 09: Clear chat on logout
  };

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (lastView) setCurrentView(lastView);
  }, [lastView]);

  const handleViewChange = useCallback((view: ViewMode) => {
    setCurrentView(view);
    updateView(view);
    if (view === 'settings') setIsSettingsOpen(true);
    setIsSidebarOpen(false);
  }, [updateView]);

  const [chatConfig, setChatConfig] = useState<ChatConfig>({
    model: 'zara-fast',
    useThinking: false,
    useGrounding: false,
    isEmotionalMode: false
  });

  useModeThemeSync(currentView, chatConfig.isEmotionalMode, systemConfig.autoTheme, setTheme);

  const [personalization, setPersonalization] = useState<PersonalizationConfig>({
    nickname: '', occupation: '', aboutYou: '', customInstructions: '', fontSize: 'medium',
    isVerifiedCreator: securityService.isVerified()
  });

  const {
    sessions, currentSessionId, createSession, updateSession, deleteSession, renameSession, loadSession, clearCurrentSession
  } = useChatSessions();

  const [messages, setMessages] = useState<Message[]>([]);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const abortRef = useRef<boolean>(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY_PERSONALIZATION);
    if (stored) {
      try {
        const p = JSON.parse(stored);
        setPersonalization({ ...p, isVerifiedCreator: securityService.isVerified() });
      } catch (e) { }
    }
  }, []);

  const handleSecurityAction = async (action: 'verify' | 'logout', data?: string): Promise<string> => {
    if (action === 'verify' && data) {
      const result = securityService.verify(data);
      setPersonalization(prev => ({ ...prev, isVerifiedCreator: result.success }));
      return result.message;
    } else if (action === 'logout') {
      securityService.logout();
      setPersonalization(prev => ({ ...prev, isVerifiedCreator: false }));
      return "You’ve been logged out. How can I help you?";
    }
    return "Action failed.";
  };

  const handleSendMessage = async (text: string, attachments: Attachment[]) => {
    if (isLoading) return;

    abortRef.current = false;
    shouldAutoScrollRef.current = true;

    let historyToUse = messages;
    if (editingMessage) {
      const idx = messages.findIndex(m => m.id === editingMessage.id);
      if (idx !== -1) historyToUse = messages.slice(0, idx);
      setEditingMessage(null);
    }

    const newUserMsg: Message = { id: crypto.randomUUID(), role: Role.USER, text, attachments, timestamp: Date.now() };
    const msgsWithUser = [...historyToUse, newUserMsg];
    setMessages(msgsWithUser);
    setIsLoading(true);

    const botMsgId = crypto.randomUUID();

    if (!isOnline) {
      setTimeout(async () => {
        const resp = await OfflineService.processMessage(text, personalization, handleViewChange);
        const botMsg: Message = { id: botMsgId, role: Role.MODEL, text: resp, timestamp: Date.now(), isOffline: true };
        const final = [...msgsWithUser, botMsg];
        setMessages(final);
        setIsLoading(false);
        if (currentSessionId) updateSession(currentSessionId, final); else createSession(final);
      }, 600);
      return;
    }

    const initialBotMsg: Message = { id: botMsgId, role: Role.MODEL, text: '', timestamp: Date.now(), isStreaming: true };
    setMessages([...msgsWithUser, initialBotMsg]);

    try {
      let activePersona: Persona | undefined;
      if (chatConfig.activePersonaId) {
        const stored = localStorage.getItem('zara_personas');
        if (stored) {
          const personas: Persona[] = JSON.parse(stored);
          activePersona = personas.find(p => p.id === chatConfig.activePersonaId);
        }
      }

      const { text: finalText, sources, interactions } = await sendMessageToGeminiStream(
        historyToUse, text, attachments, chatConfig, personalization,
        (partial) => {
          if (abortRef.current) return;
          setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, text: partial } : m));
        },
        activePersona,
        handleSecurityAction
      );

      if (abortRef.current) return;
      const finalBotMsg = { ...initialBotMsg, text: finalText, sources, interactions, isStreaming: false };
      const finalMessages = [...msgsWithUser, finalBotMsg];
      setMessages(finalMessages);
      if (currentSessionId) updateSession(currentSessionId, finalMessages); else createSession(finalMessages);
    } catch (error: any) {
      if (abortRef.current) return;
      let errorMessage = "Zara AI is currently unstable. Please try again in a moment.";
      const errorStr = (error?.message || "").toLowerCase();
      if (errorStr.includes("quota_exceeded") || errorStr.includes("429")) {
        errorMessage = "QUOTA EXCEEDED: I've reached the API processing limit. Please wait about 30 seconds before trying again.";
      }
      setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, isStreaming: false, isError: true, text: errorMessage } : m));
    } finally {
      setIsLoading(false);
    }
  };

  const currentSession = currentSessionId ? sessions.find(s => s.id === currentSessionId) || null : null;

  const handleActivateCare = useCallback(() => {
    setChatConfig(prev => ({ ...prev, isEmotionalMode: true }));
    handleViewChange('chat');
  }, [handleViewChange]);

  const handleRegenerate = async (message: Message) => {
    const idx = messages.findIndex(m => m.id === message.id);
    if (idx <= 0) return;
    const userMsg = messages[idx - 1];
    if (userMsg.role !== Role.USER) return;

    // Remove the message we're regenerating and everything after it
    const history = messages.slice(0, idx);
    setMessages(history);
    handleSendMessage(userMsg.text, userMsg.attachments || []);
  };

  const handleLike = (message: Message) => {
    console.log("Liked message:", message.id);
    // Future: Persistence
  };

  const handleDislike = (message: Message) => {
    console.log("Disliked message:", message.id);
    // Future: Persistence
  };

  const handleShare = (message: Message) => {
    if (navigator.share) {
      navigator.share({
        title: 'Zara AI Response',
        text: message.text,
        url: window.location.href
      }).catch(() => {
        // Fallback to clipboard if share cancelled/failed
        navigator.clipboard.writeText(message.text);
      });
    } else {
      navigator.clipboard.writeText(message.text);
      alert("Text copied to clipboard!");
    }
  };

  const handleBranch = (message: Message) => {
    const idx = messages.findIndex(m => m.id === message.id);
    if (idx <= 0) return;
    const userMsg = messages[idx - 1];

    const branchedMessages = [userMsg, message];
    clearCurrentSession();
    setMessages(branchedMessages);
    handleViewChange('chat');
    // Session will be auto-created on next message or on forced save
    createSession(branchedMessages);
  };

  const MobileMenuToggle = () => (
    <button
      onClick={() => setIsSidebarOpen(true)}
      className="p-2 -ml-2 text-text hover:bg-surfaceHighlight rounded-lg md:hidden flex-shrink-0"
      aria-label="Open Navigation Menu"
    >
      <Menu className="w-6 h-6" />
    </button>
  );

  const currentContent = useMemo(() => {
    const withMobileHeader = (content: React.ReactNode, title: string) => (
      <div className="flex flex-col h-full w-full">
        <header className="md:hidden flex items-center px-4 py-3 bg-background/50 backdrop-blur-sm border-b border-white/5 z-30 sticky top-0">
          <MobileMenuToggle />
          <span className="ml-2 font-bold text-sm uppercase tracking-widest text-primary truncate">{title}</span>
        </header>
        <div className="flex-1 overflow-hidden">
          <Suspense fallback={<LoadingFallback />}>
            {content}
          </Suspense>
        </div>
      </div>
    );

    switch (currentView) {
      case 'dashboard': return withMobileHeader(<HomeDashboard onViewChange={handleViewChange} onActivateCare={handleActivateCare} />, "Dashboard");
      case 'student': return withMobileHeader(<StudentMode />, "Tutor");
      case 'code': return withMobileHeader(<CodeMode />, "Code Architect");
      case 'live': return withMobileHeader(<LiveMode personalization={personalization} />, "Live Studio");
      case 'exam': return withMobileHeader(<ExamMode />, "Exam Prep");
      case 'analytics': return withMobileHeader(<AnalyticsDashboard />, "Analytics");
      case 'planner': return withMobileHeader(<StudyPlanner />, "Study Planner");
      case 'about': return withMobileHeader(<AboutPage />, "About Zara");
      case 'workspace': return withMobileHeader(<ImageMode />, "Image Studio");

      case 'notes': return withMobileHeader(<NotesVault onStartChat={(ctx) => { handleSendMessage(ctx, []); handleViewChange('chat'); }} />, "Notes Vault");
      case 'life-os': return withMobileHeader(<LifeOS />, "LifeOS");
      case 'skills': return withMobileHeader(<SkillOS />, "SkillOS");
      case 'memory': return withMobileHeader(<MemoryVault />, "Memory Vault");
      case 'creative': return withMobileHeader(<CreativeStudio />, "Creative Studio");
      case 'pricing': return withMobileHeader(<PricingView />, "Pricing");
      case 'mastery': return withMobileHeader(<FlashcardMode />, "Flashcards");
      case 'video': return withMobileHeader(<VideoMode />, "Video Studio");
      case 'github': return withMobileHeader(<GithubMode />, "GitHub Architect");
      case 'chat':
      default:
        const fs = personalization.fontSize === 'large' ? 'text-lg' : personalization.fontSize === 'small' ? 'text-sm' : 'text-base';
        return (
          <div className={`flex-1 flex flex-col h-full relative ${fs} transition-all duration-500 animate-fade-in ${chatConfig.isEmotionalMode ? 'bg-[#0f0821]' : ''}`}>
            <header className="flex items-center justify-between px-4 py-3 bg-background/50 backdrop-blur-sm border-b border-white/5 z-30 sticky top-0">
              <div className="flex items-center gap-2 md:gap-3">
                <MobileMenuToggle />
                <ChatControls
                  config={chatConfig} setConfig={setChatConfig}
                  currentSession={currentSession}
                />
              </div>

              <div className="flex items-center gap-1">
                {currentUser && (
                  <button
                    onClick={() => handleTogglePrivacy(!currentUser.is_privacy_mode)}
                    className={`p-2 rounded-full transition-all duration-300 transform active:scale-95 ${currentUser.is_privacy_mode
                      ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.2)]'
                      : 'bg-surfaceHighlight/50 text-text-sub hover:text-green-400 hover:bg-green-500/5'
                      }`}
                    aria-label={currentUser.is_privacy_mode ? "Disable Privacy Mode" : "Enable Privacy Mode"}
                    title={currentUser.is_privacy_mode ? "Privacy Mode: ON (History Protection Active)" : "Privacy Mode: OFF (History Being Saved)"}
                  >
                    {currentUser.is_privacy_mode ? (
                      <EyeOff className="w-5 h-5 animate-in fade-in zoom-in duration-300" />
                    ) : (
                      <Eye className="w-5 h-5 animate-in fade-in zoom-in duration-300" />
                    )}
                  </button>
                )}

                <button
                  onClick={() => setChatConfig(prev => ({ ...prev, isEmotionalMode: !prev.isEmotionalMode }))}
                  className={`p-2 rounded-full transition-all duration-300 ${chatConfig.isEmotionalMode
                    ? 'bg-[#1a1033] text-purple-400 shadow-lg border border-purple-500/20'
                    : 'text-text-sub hover:bg-surfaceHighlight hover:text-purple-400'
                    }`}
                  aria-label={chatConfig.isEmotionalMode ? "Disable Emotional Support Mode" : "Enable Emotional Support Mode"}
                >
                  <Heart className={`w-5 h-5 ${chatConfig.isEmotionalMode ? 'fill-current' : ''}`} />
                </button>

                <button
                  onClick={() => setChatConfig(prev => ({ ...prev, useGrounding: !prev.useGrounding }))}
                  className={`p-2 rounded-full transition-all ${chatConfig.useGrounding
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                    : 'text-text-sub hover:bg-surfaceHighlight hover:text-blue-400'
                    }`}
                  aria-label={chatConfig.useGrounding ? "Disable Google Search" : "Enable Google Search"}
                >
                  <Globe className={`w-5 h-5 ${chatConfig.useGrounding ? 'fill-current' : ''}`} />
                </button>

                {currentSession && (
                  <div className="relative">
                    <button
                      onClick={() => setShowExportMenu(!showExportMenu)}
                      className={`p-2 rounded-full transition-colors ${showExportMenu ? 'bg-surfaceHighlight text-text' : 'text-text-sub hover:bg-surfaceHighlight'}`}
                      aria-label="Export Chat Options"
                    >
                      <Upload className="w-5 h-5" />
                    </button>
                    {showExportMenu && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                        <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-50 animate-fade-in backdrop-blur-xl">
                          <div className="px-4 py-3 text-[10px] font-black text-text-sub uppercase tracking-[0.2em] bg-white/5">Export As</div>
                          <button onClick={() => { exportChatToMarkdown(currentSession); setShowExportMenu(false); }} className="px-4 py-3 hover:bg-white/5 text-left text-sm flex items-center gap-3 text-text transition-colors">
                            <FileText className="w-4 h-4 text-primary" /> Markdown
                          </button>
                          <button onClick={() => { exportChatToText(currentSession); setShowExportMenu(false); }} className="px-4 py-3 hover:bg-white/5 text-left text-sm flex items-center gap-3 text-text transition-colors">
                            <File className="w-4 h-4 text-primary" /> Plain Text
                          </button>
                          <button onClick={() => { exportChatToPDF(currentSession); setShowExportMenu(false); }} className="px-4 py-3 hover:bg-white/5 text-left text-sm flex items-center gap-3 text-text transition-colors">
                            <FileText className="w-4 h-4 text-primary" /> Print / PDF
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                <button
                  onClick={() => setChatConfig(prev => ({ ...prev, useThinking: !prev.useThinking }))}
                  className={`p-2 rounded-full transition-all ${chatConfig.useThinking
                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                    : 'text-text-sub hover:bg-surfaceHighlight'
                    }`}
                  aria-label={chatConfig.useThinking ? "Disable Deep Thinking" : "Enable Deep Thinking"}
                >
                  <Brain className="w-5 h-5" />
                </button>
              </div>
            </header>

            <div ref={scrollContainerRef} onScroll={() => {
              if (scrollContainerRef.current) {
                const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
                shouldAutoScrollRef.current = scrollHeight - scrollTop - clientHeight < 100;
              }
            }} className="flex-1 overflow-y-auto px-4 md:px-0 scroll-smooth">
              <div className="max-w-3xl mx-auto h-full flex flex-col">
                {messages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    {chatConfig.isEmotionalMode ? (
                      <div className="animate-fade-in flex flex-col items-center w-full max-w-lg">
                        <div className="w-28 h-28 rounded-[2rem] bg-[#1a1033] border border-purple-500/20 flex items-center justify-center mb-10 shadow-2xl relative">
                          <Heart className="w-14 h-14 text-purple-400 fill-purple-400/20" />
                          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent rounded-[2rem]" />
                        </div>

                        <div className="mb-14 animate-slide-up">
                          <p className="text-xl font-medium text-text-sub/60 mb-1">Hello, I'm</p>
                          <h1 className="text-7xl font-bold mb-8 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-white">
                            Zara Care
                          </h1>
                          <p className="text-xl text-text font-medium opacity-90">
                            I'm listening. How are you feeling?
                          </p>
                        </div>

                        <div className="mt-8">
                          <div className="flex items-center gap-2 px-5 py-2.5 bg-[#120b24] text-purple-400 rounded-full border border-purple-500/30 shadow-lg shadow-purple-500/5">
                            <Heart className="w-4 h-4 fill-current" />
                            <span className="text-xs font-bold tracking-wide">Emotional Support Active</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div
                          onClick={() => {
                            setIsFlipping(true);
                            setTimeout(() => setIsFlipping(false), 1000);
                          }}
                          className={`w-24 h-24 border rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl relative overflow-hidden group transition-all duration-500 cursor-pointer bg-surfaceHighlight/50 border-white/10 ${isFlipping ? 'animate-flip-3d' : 'animate-float'}`}
                        >
                          <div className={`absolute inset-0 bg-gradient-to-br from-purple-500/20 to-transparent animate-shimmer`} />
                          <Sparkles className="w-12 h-12 text-primary relative z-10" />
                        </div>

                        <div className="mb-12 animate-slide-up">
                          <p className="text-xl font-medium text-text-sub mb-1">Hello, I'm</p>
                          <h1 className={`text-6xl font-black mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400`}>
                            Zara AI
                          </h1>
                          <p className="text-lg text-text-sub/80">
                            What would you like to do?
                          </p>
                        </div>


                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 py-6 space-y-2">
                    {messages.map((msg) => (
                      <MessageItem
                        key={msg.id}
                        message={msg}
                        onEdit={setEditingMessage}
                        onRegenerate={handleRegenerate}
                        onLike={handleLike}
                        onDislike={handleDislike}
                        onShare={handleShare}
                        onBranch={handleBranch}
                      />
                    ))}
                    <div ref={messagesEndRef} className="h-4" />
                  </div>
                )}
              </div>
            </div>
            <InputArea
              onSendMessage={handleSendMessage} onStop={() => { abortRef.current = true; setIsLoading(false); }}
              isLoading={isLoading} disabled={false} isOffline={!isOnline} editMessage={editingMessage}
              onCancelEdit={() => setEditingMessage(null)} viewMode={currentView}
              isEmotionalMode={chatConfig.isEmotionalMode}
            />
          </div>
        );
    }
  }, [currentView, handleViewChange, handleActivateCare, messages, isLoading, isOnline, editingMessage, personalization, chatConfig, sessions, currentSessionId, isFlipping, showExportMenu, handleSecurityAction, handleRegenerate, handleLike, handleDislike, handleShare, handleBranch]);

  const handleTogglePrivacy = async (enabled: boolean) => {
    try {
      await authService.setPrivacyMode(enabled);
      if (currentUser) {
        setCurrentUser({ ...currentUser, is_privacy_mode: enabled });
      }
    } catch (e) {
      console.error("Failed to toggle privacy", e);
    }
  };

  return (
    <GoogleOAuthProvider clientId={(import.meta as any).env.VITE_GOOGLE_CLIENT_ID || ""}>
      <div className={`flex h-screen bg-background overflow-hidden text-text font-sans transition-all duration-300 ${systemConfig.density === 'compact' ? 'text-sm' : ''}`}>
        <Sidebar
          currentView={currentView} onViewChange={handleViewChange} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)}
          sessions={sessions} activeSessionId={currentSessionId} onNewChat={() => { clearCurrentSession(); setMessages([]); handleViewChange('chat'); }}
          onSelectSession={(id) => { setMessages(loadSession(id)); handleViewChange('chat'); }} onRenameSession={renameSession}
          onDeleteSession={(id) => { deleteSession(id); if (currentSessionId === id) setMessages([]); }} onOpenFeedback={() => setIsFeedbackOpen(true)}
          currentUser={currentUser} onLogin={() => setIsAuthOpen(true)} onLogout={handleLogout}
          onTogglePrivacy={handleTogglePrivacy}
        />
        <div className="flex-1 flex flex-col h-full relative w-full overflow-hidden">
          {!isOnline && <div className="bg-orange-500 text-white text-[10px] font-black py-1 px-4 text-center z-50 uppercase tracking-widest animate-slide-in-right">OFFLINE MODE</div>}
          <main className="flex-1 overflow-hidden relative flex flex-col key-transition-wrapper" id="main-content">
            <div key={currentView} className="h-full w-full animate-fade-in overflow-hidden flex flex-col">
              {currentContent}
            </div>
          </main>
        </div>
        <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} onAction={(a, p) => { if (a === 'new-chat') { clearCurrentSession(); setMessages([]); handleViewChange('chat'); } else if (a === 'switch-mode') handleViewChange(p); }} />
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} personalization={personalization} setPersonalization={(p) => { setPersonalization(p); localStorage.setItem(STORAGE_KEY_PERSONALIZATION, JSON.stringify(p)); }} systemConfig={systemConfig} setSystemConfig={updateSystemConfig} />
        <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
        <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onLoginSuccess={handleLoginSuccess} />
      </div>
    </GoogleOAuthProvider>
  );
};

export default App;