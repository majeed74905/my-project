
import React, { useState, useEffect } from 'react';
import { X, Save, User, Settings as SettingsIcon, Monitor, UserPlus, Trash2, Edit2, Zap, Volume2 } from 'lucide-react';
import { PersonalizationConfig, Persona, SystemConfig } from '../types';
import { ThemeSwitcher } from './ThemeSwitcher';
import { APP_VERSION } from '../constants/appConstants';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  personalization: PersonalizationConfig;
  setPersonalization: (config: PersonalizationConfig) => void;
  systemConfig: SystemConfig;
  setSystemConfig: (config: Partial<SystemConfig>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  personalization,
  setPersonalization,
  systemConfig,
  setSystemConfig
}) => {
  const [activeTab, setActiveTab] = useState<'system' | 'personalization' | 'personas'>('system');
  const [tempPersonalization, setTempPersonalization] = useState<PersonalizationConfig>(personalization);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);

  useEffect(() => {
    setTempPersonalization(personalization);
    const storedPersonas = localStorage.getItem('zara_personas');
    if (storedPersonas) {
      setPersonas(JSON.parse(storedPersonas));
    }
  }, [personalization, isOpen]);

  const handleSave = () => {
    setPersonalization(tempPersonalization);
    onClose();
  };

  const savePersonas = (newPersonas: Persona[]) => {
    setPersonas(newPersonas);
    localStorage.setItem('zara_personas', JSON.stringify(newPersonas));
  };

  const handleAddPersona = () => {
    const newPersona: Persona = {
      id: crypto.randomUUID(),
      name: "New Persona",
      description: "Custom AI Character",
      systemPrompt: "You are..."
    };
    setEditingPersona(newPersona);
  };

  const handleSavePersona = () => {
    if (editingPersona) {
      const exists = personas.find(p => p.id === editingPersona.id);
      let updated;
      if (exists) {
        updated = personas.map(p => p.id === editingPersona.id ? editingPersona : p);
      } else {
        updated = [...personas, editingPersona];
      }
      savePersonas(updated);
      setEditingPersona(null);
    }
  };

  const handleDeletePersona = (id: string) => {
    if (confirm("Delete this persona?")) {
      savePersonas(personas.filter(p => p.id !== id));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface border border-border rounded-xl w-full max-w-4xl h-[700px] shadow-2xl flex overflow-hidden animate-fade-in">

        {/* Sidebar */}
        <div className="w-64 bg-surfaceHighlight border-r border-border flex flex-col p-4">
          <h2 className="text-lg font-bold text-text mb-6 px-3">Settings</h2>

          <nav className="space-y-1 flex-1">
            <button
              onClick={() => setActiveTab('system')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'system' ? 'bg-primary/10 text-primary' : 'text-text-sub hover:bg-white/5 hover:text-text'
                }`}
            >
              <Monitor className="w-4 h-4" /> System & UI
            </button>
            <button
              onClick={() => setActiveTab('personalization')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'personalization' ? 'bg-primary/10 text-primary' : 'text-text-sub hover:bg-white/5 hover:text-text'
                }`}
            >
              <User className="w-4 h-4" /> Personalization
            </button>
            <button
              onClick={() => setActiveTab('personas')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'personas' ? 'bg-primary/10 text-primary' : 'text-text-sub hover:bg-white/5 hover:text-text'
                }`}
            >
              <UserPlus className="w-4 h-4" /> AI Personas
            </button>
          </nav>

          <div className="mt-auto border-t border-border pt-4 px-2 space-y-2">
            <div className="text-[10px] text-text-sub text-center">{APP_VERSION}</div>
            <button onClick={onClose} className="w-full flex items-center justify-center gap-2 text-text-sub hover:text-text text-sm transition-colors py-2">
              <X className="w-4 h-4" /> Close
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col bg-background">
          <div className="flex-1 overflow-y-auto p-8">

            {activeTab === 'system' && (
              <div className="space-y-8 max-w-2xl">
                <div>
                  <h3 className="text-xl font-medium text-text mb-1">System & UI Preferences</h3>
                  <p className="text-sm text-text-sub">Customize look, feel, and behavior.</p>
                </div>

                <div className="space-y-4">
                  <div className="bg-surface p-4 rounded-xl border border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-lg text-primary"><Zap className="w-5 h-5" /></div>
                      <div>
                        <p className="font-bold text-sm">Auto-Theme Sync</p>
                        <p className="text-xs text-text-sub">Change theme automatically based on active mode</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={systemConfig.autoTheme} onChange={(e) => setSystemConfig({ autoTheme: e.target.checked })} className="sr-only peer" />
                      <div className="w-11 h-6 bg-surfaceHighlight peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <div className="flex items-center gap-2 mb-4">
                    <SettingsIcon className="w-5 h-5 text-text-sub" />
                    <h4 className="text-sm font-medium text-text">Interface Theme</h4>
                  </div>
                  <ThemeSwitcher />
                </div>
              </div>
            )}

            {activeTab === 'personalization' && (
              <div className="space-y-8 max-w-2xl">
                <div>
                  <h3 className="text-xl font-medium text-text mb-1">Personalization</h3>
                  <p className="text-sm text-text-sub">Customize how Zara interacts with you.</p>
                </div>
                <div className="space-y-6">
                  <section className="space-y-4">
                    <h4 className="text-sm font-bold text-text-sub uppercase tracking-wider">About You</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-text mb-1.5">Nickname</label>
                        <input type="text" value={tempPersonalization.nickname} onChange={(e) => setTempPersonalization({ ...tempPersonalization, nickname: e.target.value })} className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text focus:outline-none focus:border-primary text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text mb-1.5">Occupation</label>
                        <input type="text" value={tempPersonalization.occupation} onChange={(e) => setTempPersonalization({ ...tempPersonalization, occupation: e.target.value })} className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text focus:outline-none focus:border-primary text-sm" />
                      </div>
                    </div>
                  </section>
                  <section className="space-y-4">
                    <h4 className="text-sm font-bold text-text-sub uppercase tracking-wider">Storage & Privacy</h4>
                    <div className="bg-surface p-4 rounded-xl border border-border space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-sm">Auto-Delete History</p>
                          <p className="text-xs text-text-sub">Automatically purge old messages from database</p>
                        </div>
                        <select
                          className="bg-surfaceHighlight border border-white/10 rounded-lg px-2 py-1.5 text-xs text-text focus:outline-none focus:border-primary"
                          defaultValue={0}
                          onChange={async (e) => {
                            const days = parseInt(e.target.value);
                            const token = localStorage.getItem('auth_token');
                            if (token) {
                              await fetch(`${(import.meta as any).env.VITE_API_URL || 'http://localhost:8000/api/v1'}/users/me/auto-delete?days=${days}`, {
                                method: 'POST',
                                headers: { 'Authorization': `Bearer ${token}` }
                              });
                            }
                          }}
                        >
                          <option value={0}>Never Delete</option>
                          <option value={7}>After 7 Days</option>
                          <option value={30}>After 30 Days</option>
                          <option value={90}>After 90 Days</option>
                        </select>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-white/5 flex items-center justify-between mt-4">
                      <div>
                        <p className="font-bold text-sm text-red-400">Delete Account</p>
                        <p className="text-xs text-text-sub">Permanently remove all data</p>
                      </div>
                      <button
                        onClick={async () => {
                          if (confirm("Are you sure? This action is IRREVERSIBLE. All chat history and account data will be lost forever.")) {
                            const token = localStorage.getItem('auth_token');
                            if (token) {
                              await fetch(`${(import.meta as any).env.VITE_API_URL || 'http://localhost:8000/api/v1'}/users/me`, {
                                method: 'DELETE',
                                headers: { 'Authorization': `Bearer ${token}` }
                              });
                              localStorage.removeItem('auth_token');
                              window.location.reload();
                            }
                          }
                        }}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      >
                        Delete Forever
                      </button>
                    </div>
                  </section>
                </div>
              </div>
            )}

            {activeTab === 'personas' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-medium text-text mb-1">AI Personas</h3>
                    <p className="text-sm text-text-sub">Create custom characters for Zara to enact.</p>
                  </div>
                  {!editingPersona && (
                    <button onClick={handleAddPersona} className="bg-primary hover:bg-primary-dark text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                      <UserPlus className="w-4 h-4" /> Create
                    </button>
                  )}
                </div>

                {editingPersona ? (
                  <div className="bg-surfaceHighlight p-6 rounded-xl border border-border space-y-4 animate-fade-in">
                    <h4 className="font-bold">Editor</h4>
                    <input
                      value={editingPersona.name}
                      onChange={e => setEditingPersona({ ...editingPersona, name: e.target.value })}
                      placeholder="Persona Name (e.g. Coding Wizard)"
                      className="w-full bg-surface border border-border rounded-lg p-2 text-sm"
                    />
                    <input
                      value={editingPersona.description}
                      onChange={e => setEditingPersona({ ...editingPersona, description: e.target.value })}
                      placeholder="Short Description"
                      className="w-full bg-surface border border-border rounded-lg p-2 text-sm"
                    />
                    <textarea
                      value={editingPersona.systemPrompt}
                      onChange={e => setEditingPersona({ ...editingPersona, systemPrompt: e.target.value })}
                      placeholder="System Prompt (e.g. You are a senior engineer...)"
                      className="w-full bg-surface border border-border rounded-lg p-2 text-sm h-32 resize-none"
                    />
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setEditingPersona(null)} className="px-3 py-2 text-text-sub text-sm">Cancel</button>
                      <button onClick={handleSavePersona} className="bg-primary text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"><Save className="w-3 h-3" /> Save Persona</button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {personas.map(p => (
                      <div key={p.id} className="bg-surface border border-border rounded-xl p-4 hover:border-primary/50 transition-colors group relative">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-text">{p.name}</h4>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setEditingPersona(p)} className="p-1.5 hover:bg-surfaceHighlight rounded text-primary"><Edit2 className="w-3 h-3" /></button>
                            <button onClick={() => handleDeletePersona(p.id)} className="p-1.5 hover:bg-surfaceHighlight rounded text-red-500"><Trash2 className="w-3 h-3" /></button>
                          </div>
                        </div>
                        <p className="text-xs text-text-sub line-clamp-2">{p.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-border bg-surface flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-text-sub hover:text-text transition-colors text-sm font-medium">Cancel</button>
            <button onClick={handleSave} className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-primary/20">
              <Save className="w-4 h-4" /> Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
