import React, { useState } from 'react';
import { FileText, Plus, Trash2, Edit2, Search, MessageSquare, Save, X, Tag } from 'lucide-react';
import { useNotes } from '../hooks/useNotes';
import { Note } from '../types';

interface NotesVaultProps {
  onStartChat: (context: string) => void;
}

export const NotesVault: React.FC<NotesVaultProps> = ({ onStartChat }) => {
  const { notes, addNote, updateNote, deleteNote } = useNotes();
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedForChat, setSelectedForChat] = useState<string[]>([]);
  
  // Editor State
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState('');

  const activeNote = notes.find(n => n.id === activeNoteId);

  const handleNewNote = () => {
    const note = addNote("Untitled Note", "Start writing here...");
    openNote(note);
  };

  const openNote = (note: Note) => {
    setActiveNoteId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditTags(note.tags.join(', '));
  };

  const handleSave = () => {
    if (activeNoteId) {
      updateNote(activeNoteId, {
        title: editTitle,
        content: editContent,
        tags: editTags.split(',').map(t => t.trim()).filter(Boolean)
      });
    }
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedForChat(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const startMultiDocChat = () => {
    const selectedNotes = notes.filter(n => selectedForChat.includes(n.id));
    const context = `CONTEXT FROM USER NOTES:\n\n${selectedNotes.map(n => `--- NOTE: ${n.title} ---\n${n.content}\n`).join('\n')}`;
    onStartChat(context);
  };

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(search.toLowerCase()) || 
    n.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="h-full flex max-w-7xl mx-auto p-4 md:p-8 animate-fade-in gap-6">
      
      {/* Sidebar List */}
      <div className="w-full md:w-1/3 flex flex-col gap-4 h-full">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-text">Notes Vault</h2>
          <button onClick={handleNewNote} className="bg-primary hover:bg-primary-dark text-white p-2 rounded-lg">
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="relative">
           <Search className="absolute left-3 top-2.5 w-4 h-4 text-text-sub" />
           <input 
             type="text" 
             placeholder="Search notes..." 
             value={search}
             onChange={(e) => setSearch(e.target.value)}
             className="w-full bg-surface border border-border rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary"
           />
        </div>

        {selectedForChat.length > 0 && (
           <button 
             onClick={startMultiDocChat}
             className="bg-gradient-to-r from-primary to-accent text-white py-2 rounded-xl font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
           >
             <MessageSquare className="w-4 h-4" />
             Chat with {selectedForChat.length} Notes
           </button>
        )}

        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
           {filteredNotes.map(note => (
             <div 
               key={note.id}
               onClick={() => openNote(note)}
               className={`p-4 rounded-xl cursor-pointer border transition-all ${
                 activeNoteId === note.id 
                   ? 'bg-primary/10 border-primary' 
                   : 'bg-surface border-border hover:border-primary/50'
               }`}
             >
                <div className="flex justify-between items-start mb-2">
                   <h4 className="font-bold text-text truncate pr-2 flex-1">{note.title}</h4>
                   <input 
                     type="checkbox" 
                     checked={selectedForChat.includes(note.id)}
                     onClick={(e) => e.stopPropagation()}
                     onChange={(e) => toggleSelect(note.id, e as any)}
                     className="accent-primary w-4 h-4"
                   />
                </div>
                <p className="text-xs text-text-sub line-clamp-2 mb-2">{note.content}</p>
                <div className="flex gap-1 flex-wrap">
                   {note.tags.map(tag => (
                     <span key={tag} className="text-[10px] bg-surfaceHighlight px-2 py-0.5 rounded text-text-sub">#{tag}</span>
                   ))}
                </div>
             </div>
           ))}
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 glass-panel rounded-2xl p-6 flex flex-col h-full">
         {activeNoteId ? (
            <>
               <div className="flex justify-between items-center mb-4 pb-4 border-b border-border">
                  <input 
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="bg-transparent text-xl font-bold text-text focus:outline-none w-full"
                    placeholder="Note Title"
                  />
                  <div className="flex gap-2">
                     <button onClick={handleSave} className="text-green-500 hover:bg-green-500/10 p-2 rounded-lg" title="Save">
                        <Save className="w-5 h-5" />
                     </button>
                     <button onClick={() => deleteNote(activeNoteId)} className="text-red-500 hover:bg-red-500/10 p-2 rounded-lg" title="Delete">
                        <Trash2 className="w-5 h-5" />
                     </button>
                  </div>
               </div>
               
               <div className="flex items-center gap-2 mb-4 text-sm text-text-sub">
                  <Tag className="w-4 h-4" />
                  <input 
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    className="bg-transparent focus:outline-none flex-1 border-b border-transparent focus:border-border"
                    placeholder="Add tags separated by commas..."
                  />
               </div>

               <textarea 
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="flex-1 bg-transparent resize-none focus:outline-none text-text leading-relaxed"
                  placeholder="Start typing..."
               />
            </>
         ) : (
            <div className="h-full flex flex-col items-center justify-center text-text-sub/30">
               <FileText className="w-16 h-16 mb-4" />
               <p>Select a note or create a new one</p>
            </div>
         )}
      </div>
    </div>
  );
};