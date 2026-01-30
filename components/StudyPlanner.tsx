import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, Clock, Loader2, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { generateStudyPlan } from '../services/gemini';
import { StudyPlan } from '../types';

export const StudyPlanner: React.FC = () => {
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState('');
  const [hours, setHours] = useState(2);

  useEffect(() => {
    const stored = localStorage.getItem('zara_study_plans');
    if (stored) setPlans(JSON.parse(stored));
  }, []);

  const savePlans = (newPlans: StudyPlan[]) => {
    setPlans(newPlans);
    localStorage.setItem('zara_study_plans', JSON.stringify(newPlans));
  };

  const handleGenerate = async () => {
    if (!topic) return;
    setLoading(true);
    try {
      const plan = await generateStudyPlan(topic, hours);
      savePlans([plan, ...plans]);
      setTopic('');
    } catch (e: any) {
      alert(e.message);
    }
    setLoading(false);
  };

  const toggleTask = (planId: string, dayIndex: number, taskIndex: number) => {
    const updated = plans.map(p => {
      if (p.id !== planId) return p;
      const newSchedule = [...p.weeklySchedule];
      const task = newSchedule[dayIndex].tasks[taskIndex];
      task.completed = !task.completed;
      return { ...p, weeklySchedule: newSchedule };
    });
    savePlans(updated);
  };

  const deletePlan = (id: string) => {
    if (confirm("Delete this study plan?")) {
      savePlans(plans.filter(p => p.id !== id));
    }
  };

  return (
    <div className="h-full max-w-6xl mx-auto p-4 md:p-8 animate-fade-in overflow-y-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent mb-2">
          AI Study Planner
        </h2>
        <p className="text-text-sub">Auto-generate a structured weekly schedule for any topic.</p>
      </div>

      {/* Generator */}
      <div className="glass-panel p-6 rounded-2xl mb-8 flex flex-col md:flex-row gap-4 items-end">
         <div className="flex-1 w-full">
            <label className="text-xs font-bold text-text-sub uppercase mb-1 block">Topic / Goal</label>
            <input 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Master React Hooks"
              className="w-full bg-background border border-border rounded-xl p-3 text-sm focus:border-primary focus:outline-none"
            />
         </div>
         <div className="w-full md:w-32">
            <label className="text-xs font-bold text-text-sub uppercase mb-1 block">Hours / Day</label>
            <input 
              type="number"
              min={1}
              max={12}
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="w-full bg-background border border-border rounded-xl p-3 text-sm focus:border-primary focus:outline-none"
            />
         </div>
         <button 
           onClick={handleGenerate}
           disabled={loading || !topic}
           className="w-full md:w-auto bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
         >
           {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
           Create Plan
         </button>
      </div>

      {/* Plans List */}
      <div className="space-y-8">
         {plans.length === 0 && (
            <div className="text-center py-12 text-text-sub/40 border-2 border-dashed border-border rounded-2xl">
               <Calendar className="w-12 h-12 mx-auto mb-2" />
               <p>No active study plans.</p>
            </div>
         )}
         
         {plans.map(plan => (
            <div key={plan.id} className="glass-panel rounded-2xl overflow-hidden border border-border">
               <div className="p-4 bg-surfaceHighlight border-b border-border flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold text-text">{plan.topic}</h3>
                    <p className="text-xs text-text-sub">Started {new Date(plan.startDate).toLocaleDateString()}</p>
                  </div>
                  <button onClick={() => deletePlan(plan.id)} className="text-text-sub hover:text-red-500 p-2">
                     <Trash2 className="w-5 h-5" />
                  </button>
               </div>
               
               <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {plan.weeklySchedule.map((day, dIdx) => (
                     <div key={dIdx} className="bg-surface border border-border rounded-xl p-4 hover:border-primary/30 transition-colors">
                        <h4 className="font-bold text-sm text-primary mb-3 uppercase tracking-wide">{day.day}</h4>
                        <div className="space-y-2">
                           {day.tasks.map((task, tIdx) => (
                              <div 
                                key={tIdx} 
                                onClick={() => toggleTask(plan.id, dIdx, tIdx)}
                                className={`flex items-start gap-2 cursor-pointer group p-2 rounded-lg transition-colors ${task.completed ? 'bg-green-500/5' : 'hover:bg-surfaceHighlight'}`}
                              >
                                 <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${task.completed ? 'bg-green-500 border-green-500' : 'border-text-sub group-hover:border-primary'}`}>
                                    {task.completed && <CheckCircle className="w-3 h-3 text-white" />}
                                 </div>
                                 <div className="flex-1">
                                    <p className={`text-sm ${task.completed ? 'text-text-sub line-through' : 'text-text'}`}>{task.description}</p>
                                    <span className="text-[10px] text-text-sub flex items-center gap-1 mt-1">
                                       <Clock className="w-3 h-3" /> {task.durationMinutes}m
                                    </span>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         ))}
      </div>
    </div>
  );
};