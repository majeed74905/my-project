import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense, lazy } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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

  const handleSendMessage = async (text: string, attachments: Attachment[]) => {
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
        undefined, async () => "Verified"
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
          <div className={`flex-1 flex flex-col h-full relative transition-all duration-500 ${chatConfig.isEmotionalMode ? 'bg-[#0f0821]' : ''}`}>
            <header className="flex items-center justify-between px-4 py-3 border-b border-white/5 z-30 sticky top-0 backdrop-blur-md">
              <div className="flex items-center gap-2"><button onClick={() => setIsSidebarOpen(true)} className="md:hidden"><Menu /></button><ChatControls config={chatConfig} setConfig={setChatConfig} currentSession={currentSessionId ? sessions.find(s => s.id === currentSessionId) || null : null} /></div>
              <div className="flex items-center gap-2">
                {currentUser && <button onClick={() => handleTogglePrivacy(!currentUser.is_privacy_mode)} className="p-2">{currentUser.is_privacy_mode ? <EyeOff className="text-orange-400" /> : <Eye />}</button>}
                <button onClick={() => setChatConfig(p => ({ ...p, isEmotionalMode: !p.isEmotionalMode }))} className="p-2"><Heart className={chatConfig.isEmotionalMode ? 'fill-purple-400 text-purple-400' : ''} /></button>
                <button onClick={() => setChatConfig(p => ({ ...p, useGrounding: !p.useGrounding }))} className="p-2"><Globe className={chatConfig.useGrounding ? 'text-blue-400' : ''} /></button>
                <button onClick={() => setChatConfig(p => ({ ...p, useThinking: !p.useThinking }))} className="p-2"><Brain className={chatConfig.useThinking ? 'text-purple-400' : ''} /></button>
              </div>
            </header>
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
              <div className="max-w-3xl mx-auto py-6 space-y-2 px-4 md:px-0">
                {messages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-20 text-center animate-fade-in">
                    <div onClick={() => { setIsFlipping(true); setTimeout(() => setIsFlipping(false), 1000); }} className={`w-28 h-28 border rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl relative bg-surfaceHighlight/30 border-white/10 ${isFlipping ? 'animate-flip-3d' : 'animate-float'}`}><Sparkles className="w-14 h-14 text-primary" /></div>
                    <h1 className="text-6xl font-black mb-4 tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">Zara AI</h1>
                    <p className="text-text-sub/60">How can I assist you today?</p>
                  </div>
                ) : messages.map(msg => <MessageItem key={msg.id} message={msg} onEdit={setEditingMessage} onRegenerate={() => { }} onLike={() => { }} onDislike={() => { }} onShare={() => { }} onBranch={() => { }} />)}
              </div>
            </div>
            <InputArea onSendMessage={handleSendMessage} onStop={() => { abortRef.current = true; setIsLoading(false); }} isLoading={isLoading} disabled={false} isOffline={!isOnline} editMessage={editingMessage} onCancelEdit={() => setEditingMessage(null)} viewMode={currentView} isEmotionalMode={chatConfig.isEmotionalMode} />
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