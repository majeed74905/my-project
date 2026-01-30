
import React, { useState, useEffect, useRef } from 'react';
import { Search, Command, ArrowRight, Zap, Settings, MessageSquare, BookOpen, PenTool, Hammer, ClipboardCheck } from 'lucide-react';
import { ViewMode } from '../types';
import { ThemeName } from '../theme/types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: string, payload?: any) => void;
}

interface CommandItem {
  id: string;
  label: string;
  icon: React.ElementType;
  shortcut?: string;
  category: string;
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onAction }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const commands: CommandItem[] = [
    { id: 'new-chat', label: 'New Chat', icon: MessageSquare, shortcut: 'Ctrl+N', category: 'General', action: () => onAction('new-chat') },
    { id: 'theme-next', label: 'Switch Theme', icon: Zap, shortcut: 'Ctrl+Shift+T', category: 'Appearance', action: () => onAction('theme-next') },
    { id: 'mode-student', label: 'Student Mode', icon: BookOpen, category: 'Modes', action: () => onAction('switch-mode', 'student') },
    { id: 'mode-exam', label: 'Exam Mode', icon: ClipboardCheck, category: 'Modes', action: () => onAction('switch-mode', 'exam') },
    { id: 'mode-code', label: 'Code Mode', icon: Zap, category: 'Modes', action: () => onAction('switch-mode', 'code') },
    { id: 'mode-live', label: 'Live Mode', icon: Zap, category: 'Modes', action: () => onAction('switch-mode', 'live') },
    { id: 'mode-image', label: 'Image Studio', icon: PenTool, category: 'Modes', action: () => onAction('switch-mode', 'workspace') },
    { id: 'mode-builder', label: 'App Builder', icon: Hammer, category: 'Modes', action: () => onAction('switch-mode', 'builder') },
    { id: 'open-settings', label: 'Settings', icon: Settings, category: 'General', action: () => onAction('open-settings') },
  ];

  const filtered = commands.filter(c => c.label.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filtered.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filtered.length) % filtered.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action();
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[15vh] animate-fade-in" onClick={onClose}>
      <div 
        className="w-full max-w-xl bg-surface border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[60vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <Command className="w-5 h-5 text-text-sub" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type a command..."
            className="flex-1 bg-transparent text-lg text-text focus:outline-none placeholder-text-sub/50"
          />
          <div className="flex gap-1">
             <span className="text-[10px] bg-surfaceHighlight border border-border px-1.5 py-0.5 rounded text-text-sub">ESC</span>
          </div>
        </div>
        
        <div className="overflow-y-auto py-2">
           {filtered.length === 0 ? (
             <div className="p-4 text-center text-text-sub text-sm">No commands found.</div>
           ) : (
             filtered.map((cmd, idx) => (
               <button
                 key={cmd.id}
                 onClick={() => { cmd.action(); onClose(); }}
                 className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                   idx === selectedIndex ? 'bg-primary/10 text-primary border-l-2 border-primary' : 'text-text hover:bg-surfaceHighlight'
                 }`}
               >
                 <cmd.icon className={`w-4 h-4 ${idx === selectedIndex ? 'text-primary' : 'text-text-sub'}`} />
                 <div className="flex-1 text-left">
                    <span className="font-medium">{cmd.label}</span>
                    <span className="ml-2 text-[10px] text-text-sub opacity-70 border border-border px-1 rounded">{cmd.category}</span>
                 </div>
                 {cmd.shortcut && (
                   <span className="text-[10px] text-text-sub font-mono">{cmd.shortcut}</span>
                 )}
                 {idx === selectedIndex && <ArrowRight className="w-3 h-3" />}
               </button>
             ))
           )}
        </div>
        
        <div className="p-2 bg-surfaceHighlight border-t border-border text-[10px] text-text-sub flex justify-between px-4">
           <span>Zara AI Pro</span>
           <span>Use arrows to navigate</span>
        </div>
      </div>
    </div>
  );
};
