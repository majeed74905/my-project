
import React, { useState, useEffect } from 'react';
import { Code2, Bug, Zap, Book, Loader2, Play, Sparkles, FlaskConical, ShieldCheck } from 'lucide-react';
import { generateCodeAssist } from '../services/gemini';
import { detectLanguage } from '../services/languageDetector';
import ReactMarkdown from 'react-markdown';

export const CodeMode: React.FC = () => {
  const [inputCode, setInputCode] = useState('');
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [activeTask, setActiveTask] = useState<'debug' | 'explain' | 'optimize' | 'generate' | 'test'>('debug');

  useEffect(() => {
    if (inputCode.trim().length > 5) {
      const detected = detectLanguage(inputCode);
      setDetectedLanguage(detected);
    } else {
      setDetectedLanguage(null);
    }
  }, [inputCode]);

  const handleRun = async () => {
    if (!inputCode) return;
    setLoading(true);
    try {
      const langToUse = detectedLanguage || 'the provided';
      const content = await generateCodeAssist(inputCode, activeTask, langToUse);
      setResult(content);
    } catch (e) {
      setResult("Error processing code.");
    }
    setLoading(false);
  };

  const tasks = [
    { id: 'debug', label: 'Debug', icon: Bug },
    { id: 'explain', label: 'Explain', icon: Book },
    { id: 'optimize', label: 'Optimize', icon: Zap },
    { id: 'generate', label: 'Generate', icon: Code2 },
    { id: 'test', label: 'Test Lab', icon: FlaskConical },
  ];

  return (
    <div className="h-full flex flex-col p-4 md:p-8 animate-fade-in max-w-6xl mx-auto">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
            Code Architect
          </h2>
          <p className="text-text-sub">Intelligent analysis, testing, and generation with zero configuration.</p>
        </div>
        
        {detectedLanguage && (
          <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20 animate-fade-in">
            <Sparkles className="w-3 h-3 text-primary" />
            <span className="text-[11px] font-bold text-primary uppercase tracking-widest">
              {detectedLanguage} Detected
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
        <div className="flex flex-col gap-4">
          <div className="glass-panel p-4 rounded-xl flex-1 flex flex-col min-h-[400px]">
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
              {tasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => setActiveTask(task.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    activeTask === task.id 
                      ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                      : 'bg-surfaceHighlight text-text-sub hover:bg-surfaceHighlight/80'
                  }`}
                >
                  <task.icon className="w-3.5 h-3.5" />
                  {task.label}
                </button>
              ))}
            </div>
            
            <textarea
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder={activeTask === 'test' ? "Paste code to generate unit tests and reliability analysis..." : activeTask === 'generate' ? "Describe the logic or paste code to modify..." : "Paste your code here."}
              className="flex-1 bg-background rounded-lg p-4 font-mono text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary/50 text-text border border-border custom-scrollbar"
              spellCheck={false}
            />
            
            <div className="mt-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-green-500 opacity-50" />
                <span className="text-[10px] text-text-sub font-mono opacity-50 uppercase tracking-tighter">
                   Reliability Engine Active
                </span>
              </div>
              <button
                onClick={handleRun}
                disabled={loading || !inputCode}
                className="bg-gradient-to-r from-primary to-primary-dark text-white px-8 py-2.5 rounded-xl font-bold transition-all hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                Run Architect
              </button>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-xl overflow-y-auto min-h-[400px] markdown-body custom-scrollbar relative bg-black/20">
          {result ? (
            <ReactMarkdown>{result}</ReactMarkdown>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-text-sub/30">
              <div className="w-20 h-20 bg-surfaceHighlight rounded-3xl flex items-center justify-center mb-6">
                <FlaskConical className="w-10 h-10 opacity-50" />
              </div>
              <p className="text-lg font-medium">Test & Analysis Output</p>
              <p className="text-sm mt-2 max-w-xs text-center">Results will appear here after analysis. Zara Pro model is used for deep reasoning.</p>
            </div>
          )}
          {loading && (
             <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] flex items-center justify-center z-10">
                <div className="flex flex-col items-center gap-2">
                   <Loader2 className="w-8 h-8 text-primary animate-spin" />
                   <span className="text-xs font-bold text-primary animate-pulse uppercase tracking-widest">Architectural Check...</span>
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};
