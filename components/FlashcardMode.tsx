import React, { useState, useEffect } from 'react';
import { Book, RotateCw, CheckCircle, XCircle, ChevronLeft, ChevronRight, Plus, Brain, Trash2 } from 'lucide-react';
import { generateFlashcards } from '../services/gemini';
import { FlashcardSet, Flashcard } from '../types';

export const FlashcardMode: React.FC = () => {
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [activeSetId, setActiveSetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Creation State
  const [topic, setTopic] = useState('');
  const [notes, setNotes] = useState('');
  
  // Study State
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('zara_flashcards');
    if (stored) {
      setSets(JSON.parse(stored));
    }
  }, []);

  const saveSets = (newSets: FlashcardSet[]) => {
    setSets(newSets);
    localStorage.setItem('zara_flashcards', JSON.stringify(newSets));
  };

  const handleGenerate = async () => {
    if (!topic) return;
    setLoading(true);
    try {
      const cards = await generateFlashcards(topic, notes);
      const newSet: FlashcardSet = {
        id: crypto.randomUUID(),
        topic,
        cards,
        createdAt: Date.now()
      };
      saveSets([newSet, ...sets]);
      setTopic('');
      setNotes('');
      setActiveSetId(newSet.id);
    } catch (e: any) {
      alert(e.message);
    }
    setLoading(false);
  };

  const handleDeleteSet = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this flashcard set?")) {
      const newSets = sets.filter(s => s.id !== id);
      saveSets(newSets);
      if (activeSetId === id) setActiveSetId(null);
    }
  };

  const activeSet = sets.find(s => s.id === activeSetId);

  const toggleMastered = () => {
    if (!activeSet) return;
    const updatedCards = [...activeSet.cards];
    updatedCards[currentCardIndex].mastered = !updatedCards[currentCardIndex].mastered;
    
    const updatedSet = { ...activeSet, cards: updatedCards };
    const updatedSets = sets.map(s => s.id === activeSetId ? updatedSet : s);
    saveSets(updatedSets);
  };

  const nextCard = () => {
    if (!activeSet) return;
    setIsFlipped(false);
    setCurrentCardIndex((prev) => (prev + 1) % activeSet.cards.length);
  };

  const prevCard = () => {
    if (!activeSet) return;
    setIsFlipped(false);
    setCurrentCardIndex((prev) => (prev - 1 + activeSet.cards.length) % activeSet.cards.length);
  };

  // Render Set List
  if (!activeSetId) {
    return (
      <div className="h-full max-w-5xl mx-auto p-4 md:p-8 animate-fade-in overflow-y-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent mb-2">
            Flashcards
          </h2>
          <p className="text-text-sub">Create study sets instantly from any topic or notes.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* Generator */}
           <div className="lg:col-span-1 glass-panel p-6 rounded-2xl h-fit">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" /> Create New Set
              </h3>
              <div className="space-y-4">
                 <div>
                    <label className="text-xs font-bold text-text-sub uppercase mb-1 block">Topic</label>
                    <input 
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g. Photosynthesis"
                      className="w-full bg-background border border-border rounded-xl p-3 text-sm focus:border-primary focus:outline-none"
                    />
                 </div>
                 <div>
                    <label className="text-xs font-bold text-text-sub uppercase mb-1 block">Notes (Optional Context)</label>
                    <textarea 
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Paste text here to generate cards from..."
                      className="w-full bg-background border border-border rounded-xl p-3 text-sm focus:border-primary focus:outline-none h-32 resize-none"
                    />
                 </div>
                 <button 
                   onClick={handleGenerate}
                   disabled={loading || !topic}
                   className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-xl font-bold transition-all disabled:opacity-50"
                 >
                   {loading ? 'Generating...' : 'Generate Flashcards'}
                 </button>
              </div>
           </div>

           {/* List */}
           <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              {sets.map(set => (
                 <div 
                   key={set.id}
                   onClick={() => setActiveSetId(set.id)}
                   className="glass-panel p-5 rounded-xl cursor-pointer hover:border-primary/50 transition-all group relative"
                 >
                    <div className="flex justify-between items-start mb-2">
                       <h4 className="font-bold text-lg truncate pr-6">{set.topic}</h4>
                       <button onClick={(e) => handleDeleteSet(set.id, e)} className="p-1.5 hover:bg-red-500/10 text-text-sub hover:text-red-500 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-text-sub">
                       <span className="flex items-center gap-1"><Book className="w-3 h-3" /> {set.cards.length} cards</span>
                       <span className="flex items-center gap-1 text-green-500">
                         <CheckCircle className="w-3 h-3" /> 
                         {set.cards.filter(c => c.mastered).length} mastered
                       </span>
                    </div>
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity rounded-b-xl" />
                 </div>
              ))}
              {sets.length === 0 && (
                 <div className="col-span-2 flex flex-col items-center justify-center py-12 text-text-sub/40 border-2 border-dashed border-border rounded-xl">
                    <Brain className="w-12 h-12 mb-2" />
                    <p>No flashcard sets yet.</p>
                 </div>
              )}
           </div>
        </div>
      </div>
    );
  }

  // Study Interface
  if (activeSet) {
    const card = activeSet.cards[currentCardIndex];
    return (
      <div className="h-full flex flex-col items-center justify-center p-4 animate-fade-in relative max-w-4xl mx-auto w-full">
         <button 
           onClick={() => setActiveSetId(null)}
           className="absolute top-4 left-4 flex items-center gap-2 text-text-sub hover:text-text transition-colors"
         >
            <ChevronLeft className="w-4 h-4" /> Back to Sets
         </button>

         <div className="w-full max-w-2xl perspective-1000 h-[400px] cursor-pointer group" onClick={() => setIsFlipped(!isFlipped)}>
            <div className={`relative w-full h-full transition-all duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
               
               {/* Front */}
               <div className="absolute inset-0 backface-hidden glass-panel rounded-3xl p-8 flex flex-col items-center justify-center text-center border-2 border-primary/20 group-hover:border-primary/50 shadow-2xl">
                  <span className="absolute top-6 left-6 text-xs font-bold text-primary tracking-widest uppercase">Question</span>
                  <p className="text-2xl md:text-3xl font-medium leading-relaxed">{card.front}</p>
                  <span className="absolute bottom-6 text-xs text-text-sub animate-bounce">Click to flip</span>
               </div>

               {/* Back */}
               <div className="absolute inset-0 backface-hidden glass-panel rounded-3xl p-8 flex flex-col items-center justify-center text-center rotate-y-180 border-2 border-accent/20 bg-surfaceHighlight shadow-2xl">
                  <span className="absolute top-6 left-6 text-xs font-bold text-accent tracking-widest uppercase">Answer</span>
                  <p className="text-xl md:text-2xl leading-relaxed">{card.back}</p>
               </div>
            </div>
         </div>

         {/* Controls */}
         <div className="mt-8 flex flex-col items-center gap-6 w-full max-w-md">
            <div className="flex items-center justify-between w-full">
               <button onClick={prevCard} className="p-3 rounded-full hover:bg-surfaceHighlight border border-border"><ChevronLeft className="w-6 h-6" /></button>
               <span className="font-mono font-bold text-lg">{currentCardIndex + 1} / {activeSet.cards.length}</span>
               <button onClick={nextCard} className="p-3 rounded-full hover:bg-surfaceHighlight border border-border"><ChevronRight className="w-6 h-6" /></button>
            </div>

            <div className="flex gap-4">
               <button 
                 onClick={(e) => { e.stopPropagation(); toggleMastered(); }}
                 className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${
                   card.mastered 
                     ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' 
                     : 'bg-surface border border-border text-text-sub hover:bg-surfaceHighlight'
                 }`}
               >
                 {card.mastered ? <CheckCircle className="w-5 h-5" /> : <div className="w-5 h-5 border-2 border-current rounded-full" />}
                 {card.mastered ? 'Mastered' : 'Mark as Mastered'}
               </button>
            </div>
         </div>
      </div>
    );
  }

  return null;
};