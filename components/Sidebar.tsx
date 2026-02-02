import React, { useState } from 'react';
import { MessageSquare, GraduationCap, Code2, Layout, Settings, Sparkles, Radio, Plus, Trash2, MessageCircle, Sun, Moon, Edit2, Check, X, Image as ImageIcon, ClipboardCheck, BarChart3, Calendar, PenTool, Info, Heart, Brain, Zap, FolderOpen, Lightbulb, RotateCw, Github, LogOut, User, AlertTriangle, WifiOff, Activity, Search } from 'lucide-react';
import { ViewMode, ChatSession } from '../types';
import { useTheme } from '../theme/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  activeSessionId: string | null;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onDeleteSession: (id: string) => void;
  onOpenFeedback: () => void;
  currentUser: { email: string, is_privacy_mode?: boolean } | null;
  onLogin: () => void;
  onLogout: () => void;
  onTogglePrivacy: (enabled: boolean) => void;
}

const NavItem = ({
  icon: Icon,
  label,
  active,
  onClick
}: {
  icon: React.ElementType,
  label: string,
  active: boolean,
  onClick: () => void
}) => (
  <button
    onClick={onClick}
    aria-current={active ? 'page' : undefined}
    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${active
      ? 'bg-gradient-to-r from-primary/20 to-blue-500/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(139,92,246,0.1)]'
      : 'text-text-sub hover:text-text hover:bg-surfaceHighlight/50'
      }`}
  >
    <Icon className={`w-5 h-5 ${active ? 'text-primary' : ''}`} aria-hidden="true" />
    <span className="font-medium text-sm">{label}</span>
  </button>
);

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onViewChange,
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onNewChat,
  onSelectSession,
  onRenameSession,
  onDeleteSession,
  onOpenFeedback,
  currentUser,
  onLogin,
  onLogout,
  onTogglePrivacy
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900); // 15:00

  React.useEffect(() => {
    if (currentUser) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => prev > 0 ? prev - 1 : 900);
    }, 1000);
    return () => clearInterval(timer);
  }, [currentUser]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const { currentThemeName, setTheme } = useTheme();

  const toggleSimpleTheme = () => {
    const isLightAligned = ['light', 'glass', 'pastel'].includes(currentThemeName);
    setTheme(isLightAligned ? 'dark' : 'light');
  };

  const startEdit = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title);
    setDeletingId(null);
  };

  const saveEdit = (e: React.MouseEvent | React.FormEvent) => {
    e.stopPropagation();
    if (editingId && editTitle.trim()) {
      onRenameSession(editingId, editTitle.trim());
      setEditingId(null);
    }
  };

  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const startDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
    setEditingId(null);
  };

  const confirmDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteSession(id);
    setDeletingId(null);
  };

  const cancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(null);
  };

  return (
    <>
      <div
        className={`${isOpen ? 'translate-x-0' : '-translate-x-full'
          } fixed md:relative z-[60] w-[280px] h-full bg-gradient-to-b from-surface/95 via-surface/90 to-primary/10 backdrop-blur-xl border-r border-white/10 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 overflow-hidden shadow-2xl md:shadow-none`}
      >
        <div className="p-6 pb-2 flex-shrink-0">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="w-5 h-5 text-white fill-white" aria-hidden="true" />
            </div>
            <div>
              <p className="font-bold text-lg tracking-tight text-text">Zara AI</p>
              <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold ml-1">PRO</span>
            </div>
          </div>

          <button
            onClick={onNewChat}
            aria-label="Start a new chat session"
            className="w-full bg-gradient-to-r from-primary to-accent text-white rounded-xl p-3 flex items-center justify-center gap-2 font-medium shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all mb-4 active:scale-95"
          >
            <Plus className="w-5 h-5" aria-hidden="true" />
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-6 scrollbar-hide">
          <nav className="space-y-1">
            <p className="px-2 text-[10px] font-bold text-text-sub/40 uppercase tracking-widest mb-2">Core</p>
            <NavItem icon={MessageSquare} label="Chat" active={currentView === 'chat'} onClick={() => onViewChange('chat')} />

            <p className="px-2 text-[10px] font-bold text-text-sub/40 uppercase tracking-widest mt-6 mb-2">Studio</p>
            <NavItem icon={Radio} label="Live" active={currentView === 'live'} onClick={() => onViewChange('live')} />
            <NavItem icon={ImageIcon} label="Image" active={currentView === 'workspace'} onClick={() => onViewChange('workspace')} />

            <p className="px-2 text-[10px] font-bold text-text-sub/40 uppercase tracking-widest mt-6 mb-2">Academic & Dev</p>
            <NavItem icon={GraduationCap} label="Tutor" active={currentView === 'student'} onClick={() => onViewChange('student')} />
            <NavItem icon={ClipboardCheck} label="Exam Prep" active={currentView === 'exam'} onClick={() => onViewChange('exam')} />
            <NavItem icon={Code2} label="Code" active={currentView === 'code'} onClick={() => onViewChange('code')} />

            <NavItem icon={Github} label="GitHub Architect" active={currentView === 'github'} onClick={() => onViewChange('github')} />
          </nav>

          {currentUser && sessions.length > 0 && (
            <div className="pt-2">
              <div className="px-2 mb-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-text-sub/40 uppercase tracking-widest">Recent Chats</p>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        const token = localStorage.getItem('auth_token');
                        window.open(`${(import.meta as any).env.VITE_API_URL || 'http://localhost:8000/api/v1'}/users/me/history/export?format=pdf&token=${token}`, '_blank');
                      }}
                      className="p-1 text-text-sub hover:text-primary transition-colors"
                      title="Export PDF"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                    </button>
                  </div>
                </div>

                {/* Feature 14: Search Bar */}
                <div className="relative group">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-text-sub group-focus-within:text-primary transition-colors" />
                  <input
                    type="text"
                    placeholder="Search history..."
                    className="w-full bg-surfaceHighlight/30 border border-white/5 rounded-lg py-1.5 pl-8 pr-3 text-[11px] text-text focus:outline-none focus:border-primary/30 transition-all font-medium"
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter') {
                        const q = (e.target as HTMLInputElement).value;
                        const token = localStorage.getItem('auth_token');
                        if (q && token) {
                          try {
                            const url = `${(import.meta as any).env.VITE_API_URL || 'http://localhost:8000/api/v1'}/users/me/history/search?q=${encodeURIComponent(q)}`;
                            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
                            const data = await res.json();
                            console.log("Search Results:", data);
                            // For real usage, we'd update a 'searchResults' state and display it.
                            // For this demonstration, we've verified the API connection.
                            alert(`Found ${data.length} matches in your history.`);
                          } catch (err) { console.error(err); }
                        }
                      }
                    }}
                  />
                </div>
              </div>
              <div className="space-y-1">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer ${activeSessionId === session.id
                      ? 'bg-gradient-to-r from-surfaceHighlight to-transparent text-text border-l-2 border-primary'
                      : 'text-text-sub hover:text-text hover:bg-surfaceHighlight/50'
                      }`}
                    onClick={() => onSelectSession(session.id)}
                  >
                    {editingId === session.id ? (
                      <div className="flex-1 flex items-center gap-1 min-w-0 bg-surfaceHighlight p-1 rounded-md" onClick={e => e.stopPropagation()}>
                        <input
                          autoFocus
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit(e);
                            if (e.key === 'Escape') cancelEdit(e as any);
                          }}
                          className="flex-1 bg-background border border-primary/50 rounded px-2 py-1 text-sm text-text focus:outline-none min-w-0"
                          onClick={e => e.stopPropagation()}
                          aria-label="Rename chat"
                        />
                        <button onClick={saveEdit} aria-label="Confirm rename" className="p-1 text-green-500 hover:bg-green-500/10 rounded"><Check className="w-3.5 h-3.5" /></button>
                        <button onClick={cancelEdit} aria-label="Cancel rename" className="p-1 text-red-500 hover:bg-red-500/10 rounded"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    ) : deletingId === session.id ? (
                      <div className="flex-1 flex items-center justify-between gap-2 bg-red-500/10 p-1 rounded-md border border-red-500/20">
                        <span className="text-sm font-medium text-red-500 truncate pl-2">Delete?</span>
                        <div className="flex items-center gap-1">
                          <button onClick={(e) => confirmDelete(session.id, e)} aria-label="Confirm delete" className="p-1 text-red-500 hover:bg-red-500/20 rounded"><Check className="w-3.5 h-3.5" /></button>
                          <button onClick={cancelDelete} aria-label="Cancel delete" className="p-1 text-text-sub hover:bg-surface/50 rounded"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <MessageCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                        <span className="text-sm truncate pr-14">{session.title}</span>
                        <div className={`absolute right-2 flex items-center bg-surfaceHighlight/90 backdrop-blur-md rounded-lg shadow-sm border border-white/5 transition-all duration-200 ${activeSessionId === session.id
                          ? 'opacity-100 translate-x-0'
                          : 'opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'
                          }`}>
                          <button
                            onClick={(e) => startEdit(session, e)}
                            className="p-1.5 text-text-sub hover:text-primary transition-colors border-r border-white/5"
                            aria-label={`Rename chat: ${session.title}`}
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => startDelete(session.id, e)}
                            className="p-1.5 text-text-sub hover:text-red-500 transition-colors"
                            aria-label={`Delete chat: ${session.title}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 p-4 border-t border-border space-y-2 bg-background/50 backdrop-blur">
          {currentUser ? (
            <div className="flex flex-col gap-2 mb-2 p-1">
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/10">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-sm font-bold text-white shadow-lg">
                  {currentUser.email[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[10px] font-black text-text-sub uppercase tracking-widest leading-none">Signed In</p>
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-green-500/20 text-green-400 border border-green-500/20">VERIFIED</span>
                  </div>
                  <p className="text-sm font-bold text-text truncate">{currentUser.email}</p>
                </div>
              </div>



              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl py-3 border border-red-500/20 transition-all font-bold text-xs uppercase tracking-widest shadow-sm active:scale-95"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="p-4 text-center">
                <p className="text-xs text-text-sub font-medium mb-4">You are currently in guest mode. Sign in to unlock full features.</p>
              </div>

              <button onClick={onLogin} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white rounded-xl py-4 border border-red-500/20 transition-all mb-2 shadow-lg shadow-red-500/20 group">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center transition-transform group-hover:scale-110">
                  <User className="w-3.5 h-3.5" />
                </div>
                <span className="text-sm font-bold tracking-wide">Sign In to Zara AI</span>
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button onClick={toggleSimpleTheme} aria-label="Toggle interface theme" className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl transition-all text-text-sub hover:bg-surfaceHighlight/50">
              {['light', 'glass', 'pastel'].includes(currentThemeName) ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button onClick={() => onViewChange('settings')} aria-label="Open settings" className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl transition-all ${currentView === 'settings' ? 'bg-primary/10 text-primary' : 'text-text-sub hover:bg-surfaceHighlight/50'}`}>
              <Settings className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center justify-between pt-1">
            <button onClick={onOpenFeedback} className="text-[10px] text-text-sub hover:text-primary w-full text-center">
              Send Feedback
            </button>
          </div>
        </div>
      </div >

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm bg-surface border border-white/10 rounded-2xl shadow-2xl p-6 overflow-hidden"
            >
              {/* Decorative background element */}
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-red-500/10 blur-[50px] rounded-full pointer-events-none" />

              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                  <AlertTriangle className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-text">Are you sure?</h3>
                  <p className="text-sm text-text-sub">
                    You're about to sign out of <span className="text-primary font-bold">Zara AI</span>.
                    You'll need to log in again to access your chats.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 w-full mt-2">
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    className="flex-1 px-4 py-3 rounded-xl bg-surfaceHighlight text-text font-bold text-sm hover:bg-white/10 transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      onLogout();
                      setShowLogoutConfirm(false);
                    }}
                    className="flex-1 px-4 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-all shadow-lg shadow-red-500/20 active:scale-95"
                  >
                    Yes, Logout
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Overlay for mobile */}
      {
        isOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-50 md:hidden backdrop-blur-sm transition-opacity duration-300"
            onClick={onClose}
          />
        )
      }
    </>
  );
};