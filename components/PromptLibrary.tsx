import React, { useState, useEffect } from 'react';
import { BookMarked, Plus, Search, Tag, Trash2, Edit2, Copy, Check } from 'lucide-react';
import { SavedPrompt } from '../types';

export const PromptLibrary: React.FC = () => {
  const [prompts, setPrompts] = useState<SavedPrompt[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Editor State
  const [activeId, setActiveId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General');

  useEffect(() => {
    const stored = localStorage.getItem('zara_saved_prompts');
    if (stored) setPrompts(JSON.parse(stored));
  }, []);

  const savePrompts = (updated: SavedPrompt[]) => {
    setPrompts(updated);
    localStorage.setItem('zara_saved_prompts', JSON.stringify(updated));
  };

  const handleSave = () => {
    if (!title || !content) return;
    
    if (activeId) {
       const updated = prompts.map(p => p.id === activeId ? { ...p, title, content, category } : p);
       savePrompts(updated);
    } else {
       const newPrompt: SavedPrompt = {
         id: crypto.randomUUID(),
         title,
         content,
         category
       };
       savePrompts([newPrompt, ...prompts]);
    }
    closeEditor();
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this prompt?")) savePrompts(prompts.filter(p => p.id !== id));
  };

  const openEditor = (prompt?: SavedPrompt) => {
    if (prompt) {
      setActiveId(prompt.id);
      setTitle(prompt.title);
      setContent(prompt.content);
      setCategory(prompt.category);
    } else {
      setActiveId(null);
      setTitle('');
      setContent('');
      setCategory('General');
    }
    setIsEditing(true);
  };

  const closeEditor = () => {
    setIsEditing(false);
    setActiveId(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const filtered = prompts.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full max-w-5xl mx-auto p-4 md:p-8 animate-fade-in flex flex-col">
       <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent mb-1">
              Prompt Library
            </h2>
            <p className="text-text-sub">Manage your reusable AI instructions.</p>
          </div>
          <button onClick={() => openEditor()} className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2">
             <Plus className="w-5 h-5" /> New Prompt
          </button>
       </div>

       {isEditing ? (
          <div className="glass-panel p-6 rounded-2xl animate-fade-in max-w-2xl mx-auto w-full">
             <h3 className="font-bold text-lg mb-4">{activeId ? 'Edit Prompt' : 'Create Prompt'}</h3>
             <div className="space-y-4">
                <div>
                   <label className="text-xs font-bold text-text-sub uppercase mb-1 block">Title</label>
                   <input 
                     value={title} 
                     onChange={e => setTitle(e.target.value)} 
                     className="w-full bg-background border border-border rounded-lg p-2 text-sm focus:border-primary focus:outline-none" 
                   />
                </div>
                <div>
                   <label className="text-xs font-bold text-text-sub uppercase mb-1 block">Category</label>
                   <input 
                     value={category} 
                     onChange={e => setCategory(e.target.value)} 
                     className="w-full bg-background border border-border rounded-lg p-2 text-sm focus:border-primary focus:outline-none" 
                     placeholder="e.g. Coding, Email, Creative"
                   />
                </div>
                <div>
                   <label className="text-xs font-bold text-text-sub uppercase mb-1 block">Prompt Content</label>
                   <textarea 
                     value={content} 
                     onChange={e => setContent(e.target.value)} 
                     className="w-full bg-background border border-border rounded-lg p-2 text-sm h-40 resize-none focus:border-primary focus:outline-none" 
                   />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                   <button onClick={closeEditor} className="px-4 py-2 text-text-sub hover:text-text">Cancel</button>
                   <button onClick={handleSave} className="bg-primary text-white px-6 py-2 rounded-lg font-medium">Save</button>
                </div>
             </div>
          </div>
       ) : (
          <>
             <div className="relative mb-6">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-text-sub" />
                <input 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search templates..."
                  className="w-full bg-surface border border-border rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary"
                />
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto">
                {filtered.map(p => (
                   <div key={p.id} className="glass-panel p-5 rounded-xl border border-border hover:border-primary/50 transition-all group flex flex-col">
                      <div className="flex justify-between items-start mb-2">
                         <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider">{p.category}</span>
                         <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openEditor(p)} className="p-1.5 hover:bg-surfaceHighlight rounded text-primary"><Edit2 className="w-3 h-3" /></button>
                            <button onClick={() => handleDelete(p.id)} className="p-1.5 hover:bg-surfaceHighlight rounded text-red-500"><Trash2 className="w-3 h-3" /></button>
                         </div>
                      </div>
                      <h4 className="font-bold text-text mb-2">{p.title}</h4>
                      <p className="text-xs text-text-sub line-clamp-3 mb-4 flex-1">{p.content}</p>
                      <button 
                        onClick={() => copyToClipboard(p.content)}
                        className="w-full border border-border hover:bg-surfaceHighlight text-text-sub text-xs py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                      >
                         <Copy className="w-3 h-3" /> Copy Text
                      </button>
                   </div>
                ))}
             </div>
          </>
       )}
    </div>
  );
};