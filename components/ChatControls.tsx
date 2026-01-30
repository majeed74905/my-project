
import React, { useState, useEffect } from 'react';
import { ChevronDown, UserCircle } from 'lucide-react';
import { ChatConfig, GeminiModel, Persona, ChatSession } from '../types';

interface ChatControlsProps {
  config: ChatConfig;
  setConfig: React.Dispatch<React.SetStateAction<ChatConfig>>;
  currentSession: ChatSession | null;
}

export const ChatControls: React.FC<ChatControlsProps> = ({ config, setConfig, currentSession }) => {
  const [personas, setPersonas] = useState<Persona[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('zara_personas');
    if (stored) setPersonas(JSON.parse(stored));
  }, []);

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setConfig(prev => ({ ...prev, model: e.target.value as GeminiModel }));
  };

  const handlePersonaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setConfig(prev => ({ ...prev, activePersonaId: e.target.value || undefined }));
  };

  return (
    <div className="flex items-center gap-2">

      {/* Model Selector - Pill Design */}
      <div className="relative group">
        <select
          value={config.model}
          onChange={handleModelChange}
          className="appearance-none bg-surfaceHighlight border border-white/10 text-text text-sm font-medium rounded-full pl-4 pr-10 py-2 focus:outline-none cursor-pointer hover:bg-surface transition-all shadow-sm"
        >
          <option value="zara-fast">Zara Fast</option>
          <option value="zara-pro">Zara Pro</option>
          <option value="zara-eco">Zara Eco</option>
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-sub pointer-events-none" />
      </div>

      {/* Persona Selector - Only if available */}
      {personas.length > 0 && (
        <div className="relative group hidden md:block">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <UserCircle className="w-4 h-4 text-text-sub" />
          </div>
          <select
            value={config.activePersonaId || ''}
            onChange={handlePersonaChange}
            className="appearance-none bg-surfaceHighlight border border-white/10 text-text text-[13px] font-medium rounded-full pl-9 pr-9 py-2 focus:outline-none focus:border-primary/50 cursor-pointer hover:bg-white/5 transition-all max-w-[140px] truncate shadow-sm"
          >
            <option value="">Default Zara</option>
            {personas.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-sub pointer-events-none" />
        </div>
      )}

    </div>
  );
};
