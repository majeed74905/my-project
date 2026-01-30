import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, ChevronLeft, ChevronRight, Flag } from 'lucide-react';
import { ExamQuestion, ExamAnswer } from '../../types';
import { useExamTimer } from '../../hooks/useExamTimer';

interface ExamTakingProps {
  questions: ExamQuestion[];
  durationMinutes: number;
  answers: Record<number, ExamAnswer>;
  onAnswer: (questionId: number, value: string) => void;
  onSubmit: () => void;
  subject: string;
}

export const ExamTaking: React.FC<ExamTakingProps> = ({ 
  questions, 
  durationMinutes, 
  answers, 
  onAnswer, 
  onSubmit,
  subject
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentQ = questions[currentIndex];
  
  const { minutes, seconds } = useExamTimer(durationMinutes, onSubmit, true);

  const handleOptionSelect = (opt: string) => {
    onAnswer(currentQ.id, opt);
  };

  const isAnswered = (id: number) => !!answers[id];

  // Helper to get letter for index (0->A, 1->B...)
  const getLetter = (i: number) => String.fromCharCode(65 + i);

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto md:p-4 animate-fade-in">
      
      {/* Top Bar */}
      <div className="bg-surface border-b md:border border-border md:rounded-2xl p-4 flex items-center justify-between shadow-sm z-10 sticky top-0 md:relative">
         <div>
            <h2 className="font-bold text-text text-lg">{subject}</h2>
            <p className="text-xs text-text-sub">Question {currentIndex + 1} of {questions.length}</p>
         </div>
         
         <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-xl ${minutes < 5 ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
            <Clock className="w-5 h-5" />
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
         </div>

         <button 
           onClick={() => { if(confirm("Are you sure you want to submit?")) onSubmit(); }}
           className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg shadow-primary/20"
         >
           Submit
         </button>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden md:mt-6">
         
         {/* Question Area */}
         <div className="flex-1 overflow-y-auto px-4 md:px-0 pb-20 md:pb-0">
            <div className="glass-panel p-6 md:p-8 rounded-3xl min-h-[400px]">
               <div className="flex justify-between items-start mb-6">
                  <span className="bg-surfaceHighlight text-text-sub px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                     {currentQ.type} • {currentQ.marks} Marks
                  </span>
               </div>
               
               <h3 className="text-xl md:text-2xl font-medium text-text mb-8 leading-relaxed">
                 {currentQ.text}
               </h3>

               {currentQ.type === 'MCQ' && currentQ.options ? (
                 <div className="grid grid-cols-1 gap-4">
                    {currentQ.options.map((opt, idx) => {
                       const isSelected = answers[currentQ.id]?.userAnswer === opt;
                       return (
                         <button
                           key={idx}
                           onClick={() => handleOptionSelect(opt)}
                           className={`text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4 group ${
                             isSelected 
                               ? 'border-emerald-500 bg-emerald-500/5' 
                               : 'border-transparent bg-surfaceHighlight hover:bg-surface hover:border-border'
                           }`}
                         >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-colors ${
                               isSelected ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-border text-text-sub group-hover:border-emerald-500/50'
                            }`}>
                               {getLetter(idx)}
                            </div>
                            <span className={`text-sm md:text-base ${isSelected ? 'text-text font-medium' : 'text-text-sub'}`}>
                               {opt}
                            </span>
                         </button>
                       );
                    })}
                 </div>
               ) : (
                 <textarea
                   value={answers[currentQ.id]?.userAnswer || ''}
                   onChange={(e) => onAnswer(currentQ.id, e.target.value)}
                   placeholder="Type your answer here..."
                   className="w-full h-64 bg-surfaceHighlight border border-border rounded-xl p-4 text-text focus:outline-none focus:border-emerald-500 resize-none"
                 />
               )}
            </div>

            {/* Mobile Nav */}
            <div className="flex justify-between mt-4 md:hidden">
                <button 
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex(prev => prev - 1)}
                  className="px-4 py-2 bg-surface border border-border rounded-lg disabled:opacity-50"
                >
                  Prev
                </button>
                <button 
                  disabled={currentIndex === questions.length - 1}
                  onClick={() => setCurrentIndex(prev => prev + 1)}
                  className="px-4 py-2 bg-surface border border-border rounded-lg disabled:opacity-50"
                >
                  Next
                </button>
            </div>
         </div>

         {/* Sidebar Navigation (Desktop) */}
         <div className="hidden md:flex flex-col w-64 glass-panel p-4 rounded-2xl h-fit">
            <h4 className="text-sm font-bold text-text mb-4">Question Map</h4>
            <div className="grid grid-cols-4 gap-2">
               {questions.map((q, idx) => (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-10 w-10 rounded-lg flex items-center justify-center text-sm font-medium transition-all ${
                      currentIndex === idx 
                        ? 'ring-2 ring-primary bg-surface' 
                        : isAnswered(q.id)
                           ? 'bg-emerald-500 text-white'
                           : 'bg-surfaceHighlight text-text-sub hover:bg-surface'
                    }`}
                  >
                    {idx + 1}
                  </button>
               ))}
            </div>

            <div className="mt-8 pt-6 border-t border-border">
               <div className="flex items-center justify-between mb-4">
                 <button 
                    disabled={currentIndex === 0}
                    onClick={() => setCurrentIndex(prev => prev - 1)}
                    className="p-2 rounded-full hover:bg-surfaceHighlight disabled:opacity-50"
                 >
                    <ChevronLeft className="w-5 h-5" />
                 </button>
                 <span className="text-sm font-medium">
                   {currentIndex + 1} / {questions.length}
                 </span>
                 <button 
                    disabled={currentIndex === questions.length - 1}
                    onClick={() => setCurrentIndex(prev => prev + 1)}
                    className="p-2 rounded-full hover:bg-surfaceHighlight disabled:opacity-50"
                 >
                    <ChevronRight className="w-5 h-5" />
                 </button>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};