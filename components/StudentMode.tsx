
import React, { useState } from 'react';
/* Added Sparkles to lucide-react imports */
import { BookOpen, HelpCircle, FileText, CheckCircle, Loader2, Upload, File, Trash2, X, FileSearch, Sparkles } from 'lucide-react';
import { generateStudentContent } from '../services/gemini';
import { useStudyMaterial } from '../hooks/useStudyMaterial';
import ReactMarkdown from 'react-markdown';

export const StudentMode: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [activeTab, setActiveTab] = useState<'summary' | 'mcq' | '5mark' | '20mark' | 'simple'>('summary');
  
  const [mcqCount, setMcqCount] = useState(5);
  const [mcqDifficulty, setMcqDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');

  const { studyMaterial, attachments, updateMaterial, loadFromFile, removeAttachment, clearMaterial } = useStudyMaterial();
  const [showMaterialInput, setShowMaterialInput] = useState(false);

  const handleGenerate = async () => {
    if (!topic && !studyMaterial && attachments.length === 0) return;
    setLoading(true);
    try {
      const config = {
        topic: topic || (attachments.length > 0 ? attachments[0].file.name : "Uploaded Context"),
        mode: activeTab,
        mcqConfig: {
          count: mcqCount,
          difficulty: mcqDifficulty
        },
        studyMaterial: studyMaterial,
        attachments: attachments
      };
      
      const content = await generateStudentContent(config);
      setResult(content);
    } catch (e) {
      setResult("Error generating content. Please try again.");
    }
    setLoading(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      /* Fixed line 47: cast Array.from result to File[] to satisfy loadFromFile signature */
      const files = Array.from(e.target.files) as File[];
      files.forEach(file => {
        loadFromFile(file).catch(err => alert(err.message));
      });
    }
  };

  const tabs = [
    { id: 'summary', label: 'Summary', icon: FileText },
    { id: 'simple', label: 'Explain Simple', icon: HelpCircle },
    { id: 'mcq', label: 'MCQs', icon: CheckCircle },
    { id: '5mark', label: 'Short Q&A', icon: BookOpen },
    { id: '20mark', label: 'Essay', icon: FileText },
  ];

  const hasContext = studyMaterial || attachments.length > 0;

  return (
    <div className="h-full flex flex-col max-w-5xl mx-auto p-4 md:p-8 animate-fade-in">
      <div className="mb-6 flex-shrink-0">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
          Student Companion
        </h2>
        <p className="text-text-sub">Generate study materials, notes, and quizzes instantly from any file.</p>
      </div>

      {/* Main Layout Grid - Constrained height with flexible scrolling */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0 overflow-y-auto lg:overflow-hidden custom-scrollbar pr-1">
        
        {/* Left Column: Controls - Independent Scroll on Desktop */}
        <div className="lg:col-span-1 space-y-4 lg:h-full lg:overflow-y-auto custom-scrollbar lg:pr-2">
          
          <div className="glass-panel p-4 rounded-2xl">
            <div className="flex justify-between items-center mb-4">
              <label className="text-sm font-bold text-text uppercase tracking-widest flex items-center gap-2">
                 <FileSearch className="w-4 h-4 text-primary" /> Study Context
              </label>
              {hasContext && (
                <button onClick={clearMaterial} className="text-red-400 hover:bg-red-500/10 p-1 rounded-lg transition-colors" title="Clear all context">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {/* Attachment List */}
            {attachments.length > 0 && (
               <div className="space-y-2 mb-4">
                  {attachments.map((att) => (
                     <div key={att.id} className="flex items-center justify-between p-2.5 bg-surfaceHighlight border border-border rounded-xl">
                        <div className="flex items-center gap-2 overflow-hidden">
                           <FileText className={`w-4 h-4 flex-shrink-0 ${att.mimeType === 'application/pdf' ? 'text-red-400' : 'text-blue-400'}`} />
                           <span className="text-[11px] font-bold truncate pr-2">{att.file.name}</span>
                        </div>
                        <button onClick={() => removeAttachment(att.id)} className="text-text-sub hover:text-red-500">
                           <X className="w-3.5 h-3.5" />
                        </button>
                     </div>
                  ))}
               </div>
            )}

            {!hasContext && (
               <p className="text-xs text-text-sub mb-4 leading-relaxed">Upload PDFs, Images, or Text to generate questions based on specific content.</p>
            )}

            <div className="flex flex-col gap-2">
               <div className="relative w-full">
                 <input 
                   type="file" 
                   multiple
                   accept=".pdf,image/*,.txt,.md,.json" 
                   onChange={handleFileUpload} 
                   className="absolute inset-0 opacity-0 cursor-pointer z-10"
                 />
                 <button className="w-full bg-primary/10 border border-primary/20 text-primary font-bold text-xs py-2.5 rounded-xl hover:bg-primary/20 flex justify-center items-center gap-2 transition-all">
                    <Upload className="w-4 h-4" /> Upload Study Files
                 </button>
               </div>
               
               <button 
                 onClick={() => setShowMaterialInput(!showMaterialInput)}
                 className="w-full bg-surfaceHighlight border border-border text-text-sub text-[10px] uppercase font-black py-1.5 rounded-lg hover:bg-surface transition-all"
               >
                 {showMaterialInput ? 'Hide Text Area' : 'Paste Raw Text'}
               </button>
            </div>

            {showMaterialInput && (
              <textarea 
                value={studyMaterial}
                onChange={(e) => updateMaterial(e.target.value)}
                placeholder="Paste your notes here..."
                className="w-full mt-3 bg-background border border-border rounded-xl p-3 text-xs h-32 resize-none focus:border-primary focus:outline-none custom-scrollbar"
              />
            )}
          </div>

          <div className="glass-panel p-4 rounded-2xl">
             <label className="text-sm font-bold text-text mb-2 block">Topic / Subject</label>
             <input 
              type="text" 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={hasContext ? "Optional (using context)" : "e.g. Quantum Physics"}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary shadow-inner transition-all"
            />
          </div>

          <div className="glass-panel p-4 rounded-2xl space-y-4">
             <div className="flex flex-wrap gap-2">
               {tabs.map((tab) => (
                 <button
                   key={tab.id}
                   onClick={() => setActiveTab(tab.id as any)}
                   className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all flex-grow justify-center ${
                     activeTab === tab.id 
                       ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                       : 'bg-surfaceHighlight text-text-sub hover:bg-surface border border-transparent'
                   }`}
                 >
                   <tab.icon className="w-3.5 h-3.5" />
                   {tab.label}
                 </button>
               ))}
             </div>

             {activeTab === 'mcq' && (
               <div className="bg-surfaceHighlight/50 p-3 rounded-xl border border-border space-y-3 animate-fade-in">
                  <div>
                    <label className="text-xs font-medium text-text-sub block mb-1 uppercase tracking-tighter">Questions</label>
                    <input 
                      type="number" 
                      min={1} 
                      max={30}
                      value={mcqCount}
                      onChange={(e) => setMcqCount(parseInt(e.target.value))}
                      className="w-full bg-background border border-border rounded-lg px-2 py-1.5 text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-text-sub block mb-1 uppercase tracking-tighter">Level</label>
                    <div className="flex gap-1">
                      {['Easy', 'Medium', 'Hard'].map(d => (
                         <button
                           key={d}
                           onClick={() => setMcqDifficulty(d as any)}
                           className={`flex-1 text-[10px] font-bold py-1.5 rounded-md border transition-all ${
                             mcqDifficulty === d 
                               ? 'bg-primary/20 border-primary text-primary' 
                               : 'bg-background border-border text-text-sub'
                           }`}
                         >
                           {d}
                         </button>
                      ))}
                    </div>
                  </div>
               </div>
             )}

             <button
              onClick={handleGenerate}
              disabled={loading || (!topic && !hasContext)}
              className="w-full bg-gradient-to-r from-primary to-accent text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl shadow-primary/10 hover:shadow-primary/30 active:scale-95"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Generate Expert Materials
            </button>
          </div>

        </div>

        {/* Right Column: Content Display - Fixed layout on desktop */}
        <div className="lg:col-span-2 lg:h-full flex flex-col min-h-[500px] lg:min-h-0">
           <div className="glass-panel rounded-[2rem] p-6 md:p-10 flex-1 overflow-y-auto markdown-body relative custom-scrollbar bg-black/5">
              {result ? (
                 <ReactMarkdown>{result}</ReactMarkdown>
              ) : (
                 <div className="absolute inset-0 flex flex-col items-center justify-center text-text-sub/20">
                    <div className="relative mb-6">
                       <BookOpen className="w-20 h-20 opacity-30" />
                       <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-primary animate-pulse" />
                    </div>
                    <p className="text-xl font-black uppercase tracking-widest text-center">Tutor Ready</p>
                    <p className="text-sm max-w-xs text-center mt-2 opacity-60">Upload PDFs, study notes, or images of diagrams to generate expert-level materials.</p>
                 </div>
              )}
              {loading && (
                 <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center rounded-[2rem]">
                    <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                    <span className="text-xs font-black text-primary uppercase tracking-[0.3em] animate-pulse">Analyzing Sources...</span>
                 </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};
