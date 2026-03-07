import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense, lazy } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { trackEvent, identifyUser } from './services/analytics';
import { motion, AnimatePresence } from 'framer-motion';
import { VerifyEmailPage } from './VerifyEmailPage';
import { ResetPasswordPage } from './ResetPasswordPage';
import { MagicLinkPage } from './MagicLinkPage';
import { Sparkles, BookOpen, Heart, Code2, Palette, WifiOff, Globe, Search, ChevronDown, Brain, Upload, FileText, File, Menu, X, Loader2, Activity, Eye, EyeOff } from 'lucide-react';
import { Message, Role, Attachment, ViewMode, ChatConfig, PersonalizationConfig, Persona } from './types';
import { sendMessageToGeminiStream } from './services/gemini';
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
import OrbBackground from './src/components/OrbBackground';

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
      <span className="text-xs font-bold uppercase tracking-widest text-primary animate-pulse">Initializing...</span>
    </div>
  </div>
);

const App: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isVerificationPage = location.pathname === '/verify-email';
  const isResetPage = location.pathname === '/reset-password';
  const isMagicLinkPage = location.pathname === '/auth/magic-link';

  const { lastView, updateView, systemConfig, updateSystemConfig } = useAppMemory();
  const { setTheme } = useTheme();

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

  const fetchUserProfile = useCallback(async (token: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'}/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser({ email: data.email, is_privacy_mode: data.is_privacy_mode, auto_delete_days: data.auto_delete_days });
      }
    } catch (e) { console.error("Profile fetch failed", e); }
  }, []);

  const handleLoginSuccess = useCallback((token: string, email: string) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_email', email);
    setCurrentUser({ email });
    identifyUser(email); // Identify user in analytics
    trackEvent('login', { method: 'token' });
    fetchUserProfile(token);
    setIsAuthOpen(false);
  }, [fetchUserProfile]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      handleLoginSuccess(token, urlParams.get('email') || "User");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [handleLoginSuccess]);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const email = localStorage.getItem('auth_email');
    if (token) {
      if (email) setCurrentUser({ email });
      fetchUserProfile(token);
    }
  }, [fetchUserProfile]);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_email');
    trackEvent('logout');
    setCurrentUser(null);
    clearCurrentSession();
    setMessages([]);
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

  useEffect(() => { if (lastView) setCurrentView(lastView); }, [lastView]);

  const handleViewChange = useCallback((view: ViewMode) => {
    setCurrentView(view);
    updateView(view);
    trackEvent('view_change', { view });
    if (view === 'settings') setIsSettingsOpen(true);
    setIsSidebarOpen(false);
  }, [updateView]);

  const [chatConfig, setChatConfig] = useState<ChatConfig>({ model: 'zara-fast', useThinking: false, useGrounding: false, isEmotionalMode: false });
  useModeThemeSync(currentView, chatConfig.isEmotionalMode, systemConfig.autoTheme, setTheme);

  const [personalization, setPersonalization] = useState<PersonalizationConfig>({ nickname: '', occupation: '', aboutYou: '', customInstructions: '', fontSize: 'medium', isVerifiedCreator: securityService.isVerified() });
  const { sessions, currentSessionId, createSession, updateSession, deleteSession, renameSession, loadSession, clearCurrentSession } = useChatSessions();
  const [messages, setMessages] = useState<Message[]>([]);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<boolean>(false);

  const handleSendMessage = async (text: string, attachments: Attachment[], analysisContext?: string) => {
    trackEvent('chat_send', {
      has_attachments: attachments.length > 0,
      view: currentView,
      config: chatConfig.model
    });
    if (isLoading) return;
    abortRef.current = false;
    let historyToUse = messages;
    if (editingMessage) {
      const idx = messages.findIndex(m => m.id === editingMessage.id);
      if (idx !== -1) historyToUse = messages.slice(0, idx);
      setEditingMessage(null);
    }
    const newUserMsg = { id: crypto.randomUUID(), role: Role.USER, text, attachments, timestamp: Date.now() };
    const msgsWithUser = [...historyToUse, newUserMsg];
    setMessages(msgsWithUser);
    setIsLoading(true);
    const botMsgId = crypto.randomUUID();
    const initialBotMsg = { id: botMsgId, role: Role.MODEL, text: '', timestamp: Date.now(), isStreaming: true };
    setMessages([...msgsWithUser, initialBotMsg]);

    try {
      const { text: finalText, sources } = await sendMessageToGeminiStream(
        historyToUse, text, attachments, chatConfig, personalization,
        (partial) => { if (!abortRef.current) setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, text: partial } : m)); },
        undefined, async () => "Verified",
        analysisContext
      );
      if (abortRef.current) return;
      const finalBotMsg = { ...initialBotMsg, text: finalText, sources, isStreaming: false };
      const finalMessages = [...msgsWithUser, finalBotMsg];
      setMessages(finalMessages);
      if (currentSessionId) updateSession(currentSessionId, finalMessages); else createSession(finalMessages);
    } catch (e: any) {
      if (!abortRef.current) setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, isStreaming: false, isError: true, text: "Wait 30s..." } : m));
    } finally { setIsLoading(false); }
  };

  const handleTogglePrivacy = async (enabled: boolean) => {
    try {
      await authService.setPrivacyMode(enabled);
      if (currentUser) setCurrentUser({ ...currentUser, is_privacy_mode: enabled });
    } catch (e) { }
  };

  const currentContent = useMemo(() => {
    const withHeader = (content: React.ReactNode, title: string) => (
      <div className="flex flex-col h-full w-full">
        <header className="md:hidden flex items-center px-4 py-3 bg-background/50 border-b border-white/5 z-30 sticky top-0">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2"><Menu /></button>
          <span className="ml-2 font-bold text-xs uppercase text-primary truncate">{title}</span>
        </header>
        <div className="flex-1 overflow-hidden"><Suspense fallback={<LoadingFallback />}>{content}</Suspense></div>
      </div>
    );
    switch (currentView) {
      case 'dashboard': return withHeader(<HomeDashboard onViewChange={handleViewChange} onActivateCare={() => setChatConfig(p => ({ ...p, isEmotionalMode: true }))} />, "Dashboard");
      case 'student': return withHeader(<StudentMode />, "Tutor");
      case 'code': return withHeader(<CodeMode />, "Architect");
      case 'live': return withHeader(<LiveMode personalization={personalization} />, "Live");
      case 'workspace': return withHeader(<ImageMode />, "Studio");
      case 'exam': return withHeader(<ExamMode />, "Exam");
      case 'analytics': return withHeader(<AnalyticsDashboard />, "Analytics");
      case 'planner': return withHeader(<StudyPlanner />, "Planner");
      case 'about': return withHeader(<AboutPage />, "About");
      case 'notes': return withHeader(<NotesVault onStartChat={(ctx) => { handleSendMessage(ctx, []); handleViewChange('chat'); }} />, "Notes");
      case 'life-os': return withHeader(<LifeOS />, "LifeOS");
      case 'skills': return withHeader(<SkillOS />, "SkillOS");
      case 'memory': return withHeader(<MemoryVault />, "Memory");
      case 'creative': return withHeader(<CreativeStudio />, "Creative");
      case 'pricing': return withHeader(<PricingView />, "Pricing");
      case 'mastery': return withHeader(<FlashcardMode />, "Flashcards");
      case 'video': return withHeader(<VideoMode />, "Video");
      case 'github': return withHeader(<GithubMode />, "GitHub");
      default:
        return (
          <div className={`flex-1 flex flex-col h-full relative transition-all duration-500 overflow-hidden ${chatConfig.isEmotionalMode ? 'bg-[#0f0821]' : 'bg-background'}`}>
            {/* Background Orb Layer */}
            <div className="orb-wrapper">
              <OrbBackground
                backgroundColor={chatConfig.isEmotionalMode ? "#0f0821" : "#09090B"}
                hue={chatConfig.isEmotionalMode ? 320 : 270}
                hoverIntensity={0.5}
                forceHoverState={messages.length === 0}
              />
              <div className="orb-glow" />
            </div>

            <div className="relative z-10 flex flex-col h-full">
              <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 z-30 sticky top-0 backdrop-blur-3xl bg-background/20">
                <div className="flex items-center gap-2">
                  <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 hover:bg-white/5 rounded-full text-white/70"><Menu /></button>
                  <div className="scale-90 md:scale-100 origin-left">
                    <ChatControls config={chatConfig} setConfig={setChatConfig} currentSession={currentSessionId ? sessions.find(s => s.id === currentSessionId) || null : null} />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {currentUser && (
                    <button
                      onClick={() => handleTogglePrivacy(!currentUser.is_privacy_mode)}
                      className={`p-2 md:p-2.5 rounded-full transition-all border border-white/5 ${currentUser.is_privacy_mode ? 'bg-orange-500/10 text-orange-400 border-orange-500/20 shadow-[0_0_15px_rgba(251,146,60,0.2)]' : 'bg-white/5 text-white/40 hover:text-white'}`}
                    >
                      {currentUser.is_privacy_mode ? <EyeOff className="w-4 h-4 md:w-5 md:h-5" /> : <Eye className="w-4 h-4 md:w-5 md:h-5" />}
                    </button>
                  )}
                  <button
                    onClick={() => setChatConfig(p => ({ ...p, isEmotionalMode: !p.isEmotionalMode }))}
                    className={`p-2 md:p-2.5 rounded-full transition-all border border-white/5 ${chatConfig.isEmotionalMode ? 'bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.3)]' : 'bg-white/5 text-white/40 hover:text-white'}`}
                  >
                    <Heart className={`w-4 h-4 md:w-5 md:h-5 ${chatConfig.isEmotionalMode ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={() => setChatConfig(p => ({ ...p, useGrounding: !p.useGrounding }))}
                    className={`p-2 md:p-2.5 rounded-full transition-all border border-white/5 ${chatConfig.useGrounding ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'bg-white/5 text-white/40 hover:text-white'}`}
                  >
                    <Globe className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                  <button
                    onClick={() => setChatConfig(p => ({ ...p, useThinking: !p.useThinking }))}
                    className={`p-2 md:p-2.5 rounded-full transition-all border border-white/5 ${chatConfig.useThinking ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'bg-white/5 text-white/40 hover:text-white'}`}
                  >
                    <Brain className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                </div>
              </header>
              <div ref={scrollContainerRef} className="flex-1 overflow-y-auto flex flex-col">
                <div className="max-w-3xl mx-auto py-6 space-y-2 px-4 md:px-0 flex-1 flex flex-col justify-center">
                  {messages.length === 0 ? (
                    chatConfig.isEmotionalMode ? (
                      <div className="flex flex-col items-center justify-center py-6 md:py-10 text-center animate-fade-in space-y-6 md:space-y-8">
                        {/* High Fidelity Zara Care Heart Box */}
                        <motion.div
                          animate={{
                            scale: [1, 1.05, 1],
                            boxShadow: [
                              "0 0 20px rgba(168, 85, 247, 0.1)",
                              "0 0 50px rgba(168, 85, 247, 0.3)",
                              "0 0 20px rgba(168, 85, 247, 0.1)"
                            ]
                          }}
                          transition={{
                            scale: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                            boxShadow: { duration: 3, repeat: Infinity, ease: "easeInOut" }
                          }}
                          className="w-24 h-24 md:w-32 md:h-32 bg-[#1a1033]/80 border border-purple-500/30 rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center relative group overflow-hidden backdrop-blur-md"
                        >
                          <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 via-transparent to-pink-500/20 opacity-50 group-hover:opacity-100 transition-opacity" />

                          {/* Animated Heart Icon with "Heartbeat" */}
                          <motion.div
                            animate={{
                              scale: [1, 1.15, 1, 1.2, 1],
                              filter: [
                                "drop-shadow(0 0 5px rgba(168, 85, 247, 0.4))",
                                "drop-shadow(0 0 25px rgba(168, 85, 247, 0.8))",
                                "drop-shadow(0 0 5px rgba(168, 85, 247, 0.4))"
                              ]
                            }}
                            transition={{
                              duration: 2.5,
                              repeat: Infinity,
                              ease: "easeInOut",
                              times: [0, 0.1, 0.2, 0.5, 1]
                            }}
                          >
                            <Heart className="w-12 h-12 md:w-16 md:h-16 text-purple-400 stroke-[1.5] fill-purple-400/10" />
                          </motion.div>

                          {/* Particle Accents */}
                          <div className="absolute inset-0 pointer-events-none">
                            <motion.div
                              animate={{
                                y: [-20, 20, -20],
                                scale: [1, 1.4, 1],
                                opacity: [0.3, 0.8, 0.3]
                              }}
                              transition={{ duration: 5, repeat: Infinity }}
                              className="absolute top-4 left-6 w-1.5 h-1.5 bg-pink-400 rounded-full blur-[1px]"
                            />
                            <motion.div
                              animate={{
                                y: [20, -20, 20],
                                scale: [0.8, 1.5, 0.8],
                                opacity: [0.2, 0.6, 0.2]
                              }}
                              transition={{ duration: 7, repeat: Infinity }}
                              className="absolute bottom-6 right-8 w-2 h-2 bg-purple-400 rounded-full blur-[1px]"
                            />
                          </div>
                        </motion.div>

                        <div className="space-y-2 md:space-y-4 px-6 md:px-0">
                          <h2 className="text-lg md:text-xl font-medium text-white/80">Hello, I'm</h2>
                          <h1 className="text-5xl md:text-7xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-300">
                            Zara Care
                          </h1>
                          <p className="text-xl md:text-2xl font-medium text-white/90">
                            I'm listening. How are you feeling?
                          </p>
                        </div>

                        {/* Emotional Support Badge */}
                        <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full">
                          <Heart className="w-4 h-4 fill-purple-400 text-purple-400" />
                          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-300">Emotional Support Active</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-6 md:py-10 text-center animate-fade-in space-y-6 md:space-y-8">
                        {/* High Fidelity Zara AI Sparkles Box */}
                        <motion.div
                          onClick={() => { setIsFlipping(true); setTimeout(() => setIsFlipping(false), 1000); }}
                          animate={{
                            scale: [1, 1.05, 1],
                            rotateY: isFlipping ? 360 : 0,
                            boxShadow: [
                              "0 0 20px rgba(168, 85, 247, 0.1)",
                              "0 0 45px rgba(168, 85, 247, 0.3)",
                              "0 0 20px rgba(168, 85, 247, 0.1)"
                            ]
                          }}
                          transition={{
                            scale: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                            rotateY: { duration: 0.8, ease: "easeInOut" },
                            boxShadow: { duration: 3, repeat: Infinity, ease: "easeInOut" }
                          }}
                          className={`w-24 h-24 md:w-32 md:h-32 bg-[#121214]/80 border border-white/10 rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center relative group cursor-pointer overflow-hidden backdrop-blur-md`}
                        >
                          <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 via-transparent to-indigo-500/10 opacity-50 group-hover:opacity-100 transition-opacity" />

                          {/* Inner Animated Sparkles */}
                          <motion.div
                            animate={{
                              scale: [1, 1.15, 1.05, 1.15, 1],
                              rotate: [0, 5, -5, 10, -10, 0],
                              filter: [
                                "drop-shadow(0 0 5px rgba(168, 85, 247, 0.3))",
                                "drop-shadow(0 0 20px rgba(168, 85, 247, 0.7))",
                                "drop-shadow(0 0 5px rgba(168, 85, 247, 0.3))"
                              ]
                            }}
                            transition={{
                              duration: 5,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                          >
                            <Sparkles className="w-12 h-12 md:w-16 md:h-16 text-purple-400 stroke-[1.5]" />
                          </motion.div>

                          {/* Secondary Particle Accents */}
                          <div className="absolute inset-0 pointer-events-none">
                            <motion.div
                              animate={{
                                y: [-15, 15, -15],
                                x: [-5, 5, -5],
                                opacity: [0.3, 0.7, 0.3],
                                scale: [1, 1.5, 1]
                              }}
                              transition={{ duration: 6, repeat: Infinity }}
                              className="absolute top-6 left-6 w-1.5 h-1.5 bg-purple-400 rounded-full blur-[1px]"
                            />
                            <motion.div
                              animate={{
                                y: [15, -15, 15],
                                x: [5, -5, 5],
                                opacity: [0.2, 0.6, 0.2],
                                scale: [0.8, 1.3, 0.8]
                              }}
                              transition={{ duration: 8, repeat: Infinity }}
                              className="absolute bottom-8 right-10 w-2 h-2 bg-indigo-400 rounded-full blur-[1.5px]"
                            />
                          </div>
                        </motion.div>

                        <div className="space-y-2 md:space-y-4 px-6 md:px-0">
                          <h2 className="text-lg md:text-xl font-medium text-white/60">Hello, I'm</h2>
                          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-[#a78bfa]">
                            Zara AI
                          </h1>
                          <p className="text-xl md:text-2xl font-medium text-white">
                            What would you like to do?
                          </p>
                        </div>
                      </div>
                    )
                  ) : messages.map(msg => <MessageItem key={msg.id} message={msg} onEdit={setEditingMessage} onRegenerate={() => { }} onLike={() => { }} onDislike={() => { }} onShare={() => { }} onBranch={() => { }} />)}
                </div>
              </div>
              <InputArea onSendMessage={handleSendMessage} onStop={() => { abortRef.current = true; setIsLoading(false); }} isLoading={isLoading} disabled={false} isOffline={!isOnline} editMessage={editingMessage} onCancelEdit={() => setEditingMessage(null)} viewMode={currentView} isEmotionalMode={chatConfig.isEmotionalMode} />
            </div>
          </div>
        );
    }
  }, [currentView, messages, isLoading, isOnline, editingMessage, personalization, chatConfig, currentUser, isFlipping, sessions, currentSessionId]);

  if (isVerificationPage) return <div className="h-screen flex items-center justify-center w-full"><VerifyEmailPage /></div>;
  if (isResetPage) return <div className="h-screen flex items-center justify-center w-full"><ResetPasswordPage /></div>;
  if (isMagicLinkPage) return <div className="h-screen flex items-center justify-center w-full"><MagicLinkPage onLoginSuccess={handleLoginSuccess} /></div>;

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ""}>
      <div className="flex h-screen bg-background text-text overflow-hidden">
        <Sidebar currentView={currentView} onViewChange={handleViewChange} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} sessions={sessions} activeSessionId={currentSessionId} onNewChat={() => { clearCurrentSession(); setMessages([]); handleViewChange('chat'); }} onSelectSession={(id) => { setMessages(loadSession(id)); handleViewChange('chat'); }} onRenameSession={renameSession} onDeleteSession={deleteSession} onOpenFeedback={() => setIsFeedbackOpen(true)} currentUser={currentUser} onLogin={() => setIsAuthOpen(true)} onLogout={handleLogout} onTogglePrivacy={handleTogglePrivacy} />
        <main className="flex-1 flex flex-col overflow-hidden relative">{currentContent}</main>
        <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onLoginSuccess={handleLoginSuccess} />
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} personalization={personalization} setPersonalization={setPersonalization} systemConfig={systemConfig} setSystemConfig={updateSystemConfig} />
        <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
      </div>
    </GoogleOAuthProvider>
  );
};

export default App;