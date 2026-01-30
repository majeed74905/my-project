
import React, { useState, useEffect } from 'react';
import { Database, Search, Hash, Brain, FileText, Plus, Trash2, Calendar, Tag } from 'lucide-react';
import { GlassCard } from '../shared/UIComponents';
import { memoryService } from '../../services/memoryService';
import { MemoryNode, MemoryCategory } from '../../types';

export const MemoryVault: React.FC = () => {
  const [search, setSearch] = useState('');
  const [memories, setMemories] = useState<MemoryNode[]>([]);
  const [stats, setStats] = useState<any>({ total: 0, byCategory: {} });
  
  // Add Memory State
  const [isAdding, setIsAdding] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryCategory>('fact');
  const [newTags, setNewTags] = useState('');

  const refreshMemories = () => {
    setMemories(memoryService.getMemories({ query: search }));
    setStats(memoryService.getStats());
  };

  useEffect(() => {
    refreshMemories();
  }, [search]);

  const handleAdd = () => {
    if (!newContent) return;
    memoryService.addMemory(
      newContent, 
      newCategory, 
      newTags.split(',').map(t => t.trim()).filter(Boolean)
    );
    setNewContent('');
    setNewTags('');
    setIsAdding(false);
    refreshMemories();
  };

  const handleDelete = (id: string) => {
    if (confirm("Forgetting this memory permanently?")) {
      memoryService.deleteMemory(id);
      refreshMemories();
    }
  };

  return (
    <div className="h-full p-6 md:p-8 animate-fade-in overflow-y-auto max-w-6xl mx-auto">
       <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
               Memory Engine
            </h2>
            <p className="text-text-sub">Long-term knowledge graph and fact storage.</p>
          </div>
          <button 
            onClick={() => setIsAdding(!isAdding)} 
            className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-cyan-500/20"
          >
             <Plus className="w-5 h-5" /> Add Memory
          </button>
       </div>

       {isAdding && (
         <div className="glass-panel p-6 rounded-2xl mb-8 animate-fade-in border-cyan-500/30 border">
            <h3 className="font-bold text-lg mb-4">New Memory Entry</h3>
            <div className="space-y-4">
               <textarea 
                 value={newContent}
                 onChange={e => setNewContent(e.target.value)}
                 placeholder="What should Zara remember?"
                 className="w-full bg-background border border-border rounded-xl p-4 text-sm focus:border-cyan-500 focus:outline-none h-24 resize-none"
               />
               <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                     <label className="text-xs font-bold text-text-sub uppercase mb-1 block">Category</label>
                     <select 
                       value={newCategory}
                       onChange={e => setNewCategory(e.target.value as MemoryCategory)}
                       className="w-full bg-background border border-border rounded-xl p-2.5 text-sm focus:border-cyan-500 focus:outline-none"
                     >
                       <option value="fact">General Fact</option>
                       <option value="preference">User Preference</option>
                       <option value="project">Project Detail</option>
                       <option value="core">Core Identity</option>
                       <option value="emotional">Emotional Context</option>
                     </select>
                  </div>
                  <div className="flex-1">
                     <label className="text-xs font-bold text-text-sub uppercase mb-1 block">Tags (comma separated)</label>
                     <input 
                       value={newTags}
                       onChange={e => setNewTags(e.target.value)}
                       placeholder="e.g. coding, work, react"
                       className="w-full bg-background border border-border rounded-xl p-2.5 text-sm focus:border-cyan-500 focus:outline-none"
                     />
                  </div>
               </div>
               <div className="flex justify-end gap-2">
                  <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-text-sub hover:text-text">Cancel</button>
                  <button onClick={handleAdd} className="bg-cyan-500 text-white px-6 py-2 rounded-xl font-medium">Save to Database</button>
               </div>
            </div>
         </div>
       )}

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
             <div className="relative">
                <Search className="absolute left-4 top-3.5 w-5 h-5 text-text-sub" />
                <input 
                   value={search}
                   onChange={e => setSearch(e.target.value)}
                   placeholder="Search stored memories..."
                   className="w-full bg-surface border border-border rounded-2xl pl-12 pr-4 py-3 text-text focus:outline-none focus:border-cyan-500 shadow-lg shadow-cyan-500/5"
                />
             </div>

             <div className="space-y-4">
                {memories.length === 0 ? (
                   <div className="text-center py-12 text-text-sub/40 border-2 border-dashed border-border rounded-2xl">
                      <Brain className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Memory banks are empty.</p>
                   </div>
                ) : (
                   memories.map(memory => (
                      <GlassCard key={memory.id} className="p-5 group relative">
                         <div className="flex justify-between items-start mb-2">
                            <div className="flex gap-2">
                               <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                  memory.category === 'preference' ? 'bg-pink-500/10 text-pink-500' :
                                  memory.category === 'project' ? 'bg-purple-500/10 text-purple-500' :
                                  memory.category === 'core' ? 'bg-yellow-500/10 text-yellow-500' :
                                  'bg-cyan-500/10 text-cyan-500'
                               }`}>
                                  {memory.category}
                               </span>
                               <span className="text-xs text-text-sub flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(memory.timestamp).toLocaleDateString()}
                               </span>
                            </div>
                            <button 
                              onClick={() => handleDelete(memory.id)}
                              className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/10 text-red-500 rounded transition-all"
                            >
                               <Trash2 className="w-4 h-4" />
                            </button>
                         </div>
                         <p className="text-text font-medium leading-relaxed">{memory.content}</p>
                         {memory.tags.length > 0 && (
                            <div className="flex gap-1 mt-3">
                               {memory.tags.map((tag, i) => (
                                  <span key={i} className="text-[10px] bg-surfaceHighlight px-2 py-0.5 rounded text-text-sub flex items-center gap-1">
                                     <Hash className="w-2.5 h-2.5" /> {tag}
                                  </span>
                               ))}
                            </div>
                         )}
                      </GlassCard>
                   ))
                )}
             </div>
          </div>

          <div className="space-y-6">
             <GlassCard className="p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Brain className="w-5 h-5 text-cyan-500" /> Neural Stats</h3>
                <div className="space-y-4">
                   <div className="flex justify-between items-center">
                      <span className="text-sm text-text-sub">Total Nodes</span>
                      <span className="font-bold text-xl">{stats.total}</span>
                   </div>
                   <div className="h-px bg-border" />
                   <div className="space-y-2">
                      {Object.entries(stats.byCategory).map(([cat, count]: any) => (
                         <div key={cat} className="flex justify-between items-center text-xs">
                            <span className="capitalize text-text-sub">{cat}</span>
                            <span className="font-bold bg-surfaceHighlight px-2 py-0.5 rounded">{count}</span>
                         </div>
                      ))}
                   </div>
                   <div className="w-full h-1 bg-surfaceHighlight rounded-full overflow-hidden mt-2">
                      <div className="h-full bg-cyan-500 w-full animate-pulse" />
                   </div>
                   <p className="text-[10px] text-text-sub text-center">Engine Status: Online</p>
                </div>
             </GlassCard>

             <div className="bg-surfaceHighlight/30 p-4 rounded-xl border border-dashed border-border text-xs text-text-sub">
                <p><strong>Tip:</strong> Zara automatically saves important facts during conversations. Use this panel to manually curate your knowledge graph.</p>
             </div>
          </div>
       </div>
    </div>
  );
};
