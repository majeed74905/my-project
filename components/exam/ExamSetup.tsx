
import React from 'react';
import { BookOpen, Clock, Settings, Brain, Layers } from 'lucide-react';
import { ExamConfig, AppLanguage, ExamType, ExamDifficulty } from '../../types';

interface ExamSetupProps {
  config: ExamConfig;
  setConfig: React.Dispatch<React.SetStateAction<ExamConfig>>;
  onStart: () => void;
  isLoading: boolean;
}

export const ExamSetup: React.FC<ExamSetupProps> = ({ config, setConfig, onStart, isLoading }) => {
  
  const subjects = [
    "Computer Science", "Data Structures", "Algorithms", 
    "Database Management", "Operating Systems", "Computer Networks",
    "Web Development", "Artificial Intelligence", "Cybersecurity"
  ];

  const updateConfig = (key: keyof ExamConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent mb-3">
          Exam Configuration
        </h2>
        <p className="text-text-sub">Customize your mock test parameters.</p>
      </div>

      <div className="glass-panel p-8 rounded-3xl space-y-6">
        
        {/* Subject */}
        <div>
           <label className="text-sm font-bold text-text mb-2 block flex items-center gap-2">
             <BookOpen className="w-4 h-4 text-emerald-500" /> Subject
           </label>
           <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
             {subjects.map(sub => (
               <button
                 key={sub}
                 onClick={() => updateConfig('subject', sub)}
                 className={`py-2 px-3 rounded-xl text-xs font-medium transition-all ${
                   config.subject === sub 
                     ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                     : 'bg-surfaceHighlight text-text-sub hover:bg-surface'
                 }`}
               >
                 {sub}
               </button>
             ))}
             <input 
               type="text" 
               placeholder="Other Subject..."
               value={subjects.includes(config.subject) ? '' : config.subject}
               onChange={(e) => updateConfig('subject', e.target.value)}
               className="bg-surface border border-border rounded-xl px-3 py-2 text-xs text-text focus:outline-none focus:border-emerald-500 col-span-2 md:col-span-1"
             />
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {/* Type & Time */}
           <div>
              <label className="text-sm font-bold text-text mb-2 block flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-500" /> Exam Mode
              </label>
              <div className="flex gap-2 p-1 bg-surfaceHighlight rounded-xl">
                 {(['Quiz', 'Unit Test', 'Semester'] as ExamType[]).map(type => (
                   <button
                     key={type}
                     onClick={() => {
                        updateConfig('examType', type);
                        updateConfig('durationMinutes', type === 'Quiz' ? 10 : type === 'Unit Test' ? 30 : 60);
                        updateConfig('questionCount', type === 'Quiz' ? 5 : type === 'Unit Test' ? 15 : 30);
                     }}
                     className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                       config.examType === type ? 'bg-surface shadow-sm text-text' : 'text-text-sub'
                     }`}
                   >
                     {type}
                   </button>
                 ))}
              </div>
              
              {/* Custom Duration & Count Override */}
              <div className="bg-surfaceHighlight/30 p-4 rounded-xl border border-dashed border-border mt-2">
                 <div className="flex justify-between text-xs text-text-sub mb-2 font-bold uppercase">
                    <span>Customize</span>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="text-xs text-text-sub block mb-1">Duration (mins)</label>
                       <input 
                         type="number" 
                         value={config.durationMinutes}
                         onChange={(e) => updateConfig('durationMinutes', parseInt(e.target.value))}
                         className="w-full bg-surface border border-border rounded-lg px-2 py-1 text-sm focus:border-emerald-500 outline-none"
                       />
                    </div>
                    <div>
                       <label className="text-xs text-text-sub block mb-1">Question Count</label>
                       <input 
                         type="number" 
                         value={config.questionCount}
                         onChange={(e) => updateConfig('questionCount', parseInt(e.target.value))}
                         className="w-full bg-surface border border-border rounded-lg px-2 py-1 text-sm focus:border-emerald-500 outline-none"
                       />
                    </div>
                 </div>
              </div>
           </div>

           {/* Difficulty */}
           <div>
              <label className="text-sm font-bold text-text mb-2 block flex items-center gap-2">
                <Brain className="w-4 h-4 text-emerald-500" /> Difficulty
              </label>
              <div className="flex gap-2">
                 {(['Easy', 'Medium', 'Hard', 'Mixed'] as ExamDifficulty[]).map(diff => (
                   <button
                     key={diff}
                     onClick={() => updateConfig('difficulty', diff)}
                     className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all ${
                       config.difficulty === diff 
                         ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' 
                         : 'bg-transparent border-border text-text-sub hover:bg-surfaceHighlight'
                     }`}
                   >
                     {diff}
                   </button>
                 ))}
              </div>
           </div>
        </div>

        {/* Format & Language */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
               <label className="text-sm font-bold text-text mb-2 block flex items-center gap-2">
                 <Layers className="w-4 h-4 text-emerald-500" /> Question Types
               </label>
               <div className="flex gap-4 items-center bg-surfaceHighlight p-3 rounded-xl">
                  <label className="flex items-center gap-2 text-sm text-text cursor-pointer">
                    <input 
                      type="radio" 
                      checked={!config.includeTheory} 
                      onChange={() => updateConfig('includeTheory', false)}
                      className="accent-emerald-500"
                    />
                    MCQ Only
                  </label>
                  <label className="flex items-center gap-2 text-sm text-text cursor-pointer">
                    <input 
                      type="radio" 
                      checked={config.includeTheory} 
                      onChange={() => updateConfig('includeTheory', true)}
                      className="accent-emerald-500"
                    />
                    MCQ + Theory
                  </label>
               </div>
            </div>

            <div>
               <label className="text-sm font-bold text-text mb-2 block flex items-center gap-2">
                 <Settings className="w-4 h-4 text-emerald-500" /> Language
               </label>
               <select 
                 value={config.language}
                 onChange={(e) => updateConfig('language', e.target.value)}
                 className="w-full bg-surfaceHighlight border border-border rounded-xl px-3 py-2.5 text-sm text-text focus:outline-none focus:border-emerald-500"
               >
                 <option value="English">English</option>
                 <option value="Tamil">Tamil</option>
                 <option value="Tanglish">Tanglish</option>
               </select>
            </div>
        </div>

        <button
          onClick={onStart}
          disabled={!config.subject || isLoading}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
        >
          {isLoading ? "Generating Questions..." : "Start Exam"}
        </button>

      </div>
    </div>
  );
};
