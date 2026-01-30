import React from 'react';
import { CheckCircle, XCircle, AlertCircle, RotateCcw, LayoutGrid } from 'lucide-react';
import { ExamSession, ExamQuestion } from '../../types';
import ReactMarkdown from 'react-markdown';

interface ExamResultsProps {
  session: ExamSession;
  onRetake: () => void;
  onExit: () => void;
}

export const ExamResults: React.FC<ExamResultsProps> = ({ session, onRetake, onExit }) => {
  const totalQuestions = session.questions.length;
  const attempted = Object.keys(session.answers).length;
  const maxScore = session.questions.reduce((sum, q) => sum + q.marks, 0);
  const score = session.totalScore || 0;
  const percentage = Math.round((score / maxScore) * 100);

  const correctCount = session.questions.filter(q => {
    const ans = session.answers[q.id];
    return ans && ans.score === q.marks;
  }).length;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8 animate-fade-in overflow-y-auto h-full">
      <div className="text-center">
         <h2 className="text-3xl font-bold text-text mb-2">Exam Results</h2>
         <p className="text-text-sub">Review your performance for {session.config.subject}</p>
      </div>

      {/* Score Card */}
      <div className="glass-panel p-8 rounded-3xl relative overflow-hidden text-center">
         <div className={`absolute top-0 left-0 w-full h-2 ${percentage >= 75 ? 'bg-emerald-500' : percentage >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`} />
         
         <div className="flex flex-col items-center justify-center mb-6">
            <span className="text-6xl font-black bg-gradient-to-br from-text to-text-sub bg-clip-text text-transparent">
              {percentage}%
            </span>
            <span className="text-lg text-text-sub mt-2">
               Score: {score} / {maxScore}
            </span>
         </div>

         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            <div className="bg-surfaceHighlight p-4 rounded-2xl">
               <p className="text-xs text-text-sub uppercase tracking-wider mb-1">Total</p>
               <p className="text-xl font-bold">{totalQuestions}</p>
            </div>
            <div className="bg-surfaceHighlight p-4 rounded-2xl">
               <p className="text-xs text-text-sub uppercase tracking-wider mb-1">Attempted</p>
               <p className="text-xl font-bold">{attempted}</p>
            </div>
            <div className="bg-green-500/10 p-4 rounded-2xl">
               <p className="text-xs text-green-600 uppercase tracking-wider mb-1">Correct</p>
               <p className="text-xl font-bold text-green-600">{correctCount}</p>
            </div>
            <div className="bg-red-500/10 p-4 rounded-2xl">
               <p className="text-xs text-red-500 uppercase tracking-wider mb-1">Incorrect</p>
               <p className="text-xl font-bold text-red-500">{totalQuestions - correctCount}</p>
            </div>
         </div>
      </div>

      {/* Detailed Review */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-text px-2">Detailed Review</h3>
        {session.questions.map((q, idx) => {
           const ans = session.answers[q.id];
           const isCorrect = ans?.score === q.marks;
           const isPartial = ans?.score > 0 && ans?.score < q.marks;
           const isSkipped = !ans;

           return (
             <div key={q.id} className="glass-panel p-6 rounded-2xl border-l-4 border-l-transparent hover:border-l-primary transition-all">
                <div className="flex justify-between items-start mb-3">
                   <div className="flex items-center gap-3">
                      <span className="bg-surfaceHighlight text-text-sub w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm">
                        {idx + 1}
                      </span>
                      <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase ${
                         isCorrect ? 'bg-green-500/10 text-green-500' :
                         isPartial ? 'bg-yellow-500/10 text-yellow-500' :
                         isSkipped ? 'bg-gray-500/10 text-gray-500' :
                         'bg-red-500/10 text-red-500'
                      }`}>
                         {isCorrect ? 'Correct' : isPartial ? 'Partial' : isSkipped ? 'Skipped' : 'Incorrect'}
                      </span>
                   </div>
                   <span className="text-sm font-medium text-text-sub">{ans?.score || 0} / {q.marks} Marks</span>
                </div>

                <p className="text-lg font-medium text-text mb-4">{q.text}</p>

                <div className="grid md:grid-cols-2 gap-6 text-sm">
                   <div className="bg-surfaceHighlight/50 p-4 rounded-xl">
                      <p className="text-xs text-text-sub font-bold uppercase mb-2">Your Answer</p>
                      <p className={isCorrect ? 'text-green-400' : 'text-red-400'}>
                        {ans?.userAnswer || "(No Answer)"}
                      </p>
                   </div>
                   <div className="bg-surfaceHighlight/50 p-4 rounded-xl">
                      <p className="text-xs text-text-sub font-bold uppercase mb-2">Correct Answer</p>
                      <p className="text-text">{q.correctAnswer}</p>
                   </div>
                </div>

                {ans?.feedback && (
                   <div className="mt-4 bg-blue-500/5 border border-blue-500/10 p-3 rounded-xl flex gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                      <div>
                         <p className="text-xs font-bold text-blue-500 uppercase mb-1">Feedback</p>
                         <p className="text-sm text-text-sub">{ans.feedback}</p>
                      </div>
                   </div>
                )}
             </div>
           );
        })}
      </div>

      <div className="flex gap-4 justify-center pt-8 pb-12">
         <button 
           onClick={onRetake}
           className="px-6 py-3 bg-surfaceHighlight hover:bg-surface border border-border rounded-xl text-text font-medium flex items-center gap-2"
         >
           <RotateCcw className="w-4 h-4" /> Retake Exam
         </button>
         <button 
           onClick={onExit}
           className="px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-primary/20"
         >
           <LayoutGrid className="w-4 h-4" /> New Configuration
         </button>
      </div>
    </div>
  );
};