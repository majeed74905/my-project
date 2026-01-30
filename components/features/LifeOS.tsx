
import React, { useState } from 'react';
import { Heart, Activity, Calendar, Users, Smile, Frown, Meh, Sun, Moon } from 'lucide-react';
import { GlassCard } from '../shared/UIComponents';

export const LifeOS: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'mood' | 'wellness' | 'relationships'>('mood');

  return (
    <div className="h-full p-6 md:p-8 animate-fade-in overflow-y-auto max-w-5xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
         <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent mb-2">
               LifeOS
            </h2>
            <p className="text-text-sub">Holistic tracking for mind, body, and connections.</p>
         </div>
         <div className="flex bg-surfaceHighlight p-1 rounded-xl">
            <button onClick={() => setActiveTab('mood')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'mood' ? 'bg-surface shadow text-pink-500' : 'text-text-sub'}`}>Mood</button>
            <button onClick={() => setActiveTab('wellness')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'wellness' ? 'bg-surface shadow text-green-500' : 'text-text-sub'}`}>Wellness</button>
            <button onClick={() => setActiveTab('relationships')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'relationships' ? 'bg-surface shadow text-blue-500' : 'text-text-sub'}`}>Relationships</button>
         </div>
      </div>

      {activeTab === 'mood' && (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard className="p-6">
               <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Smile className="w-5 h-5 text-yellow-500" /> Daily Check-in</h3>
               <p className="text-sm text-text-sub mb-6">How are you feeling right now?</p>
               <div className="flex justify-between gap-2">
                  <button className="flex-1 p-4 rounded-xl bg-surfaceHighlight hover:bg-green-500/10 hover:border-green-500/50 border border-transparent transition-all flex flex-col items-center gap-2">
                     <Smile className="w-8 h-8 text-green-500" />
                     <span className="text-xs font-bold">Great</span>
                  </button>
                  <button className="flex-1 p-4 rounded-xl bg-surfaceHighlight hover:bg-yellow-500/10 hover:border-yellow-500/50 border border-transparent transition-all flex flex-col items-center gap-2">
                     <Meh className="w-8 h-8 text-yellow-500" />
                     <span className="text-xs font-bold">Okay</span>
                  </button>
                  <button className="flex-1 p-4 rounded-xl bg-surfaceHighlight hover:bg-red-500/10 hover:border-red-500/50 border border-transparent transition-all flex flex-col items-center gap-2">
                     <Frown className="w-8 h-8 text-red-500" />
                     <span className="text-xs font-bold">Low</span>
                  </button>
               </div>
            </GlassCard>

            <GlassCard className="p-6">
               <h3 className="font-bold text-lg mb-4">Zara's Insight</h3>
               <div className="bg-surfaceHighlight/50 p-4 rounded-xl border-l-4 border-pink-500">
                  <p className="text-sm italic text-text-sub">"I've noticed you're a bit more energetic in the mornings this week. Try scheduling your creative tasks before noon to maximize this flow state."</p>
               </div>
               <div className="mt-4 flex gap-2">
                  <span className="px-2 py-1 rounded bg-surface border border-border text-[10px] text-text-sub">Pattern Detected</span>
                  <span className="px-2 py-1 rounded bg-surface border border-border text-[10px] text-text-sub">Energy High</span>
               </div>
            </GlassCard>
         </div>
      )}

      {activeTab === 'wellness' && (
         <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <GlassCard className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                     <Activity className="w-6 h-6" />
                  </div>
                  <div>
                     <p className="text-xs text-text-sub uppercase font-bold">Steps</p>
                     <p className="text-2xl font-bold">8,432</p>
                  </div>
               </GlassCard>
               <GlassCard className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                     <Moon className="w-6 h-6" />
                  </div>
                  <div>
                     <p className="text-xs text-text-sub uppercase font-bold">Sleep</p>
                     <p className="text-2xl font-bold">7h 12m</p>
                  </div>
               </GlassCard>
               <GlassCard className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
                     <Sun className="w-6 h-6" />
                  </div>
                  <div>
                     <p className="text-xs text-text-sub uppercase font-bold">Mindfulness</p>
                     <p className="text-2xl font-bold">15m</p>
                  </div>
               </GlassCard>
            </div>
            
            <GlassCard className="p-6">
               <h3 className="font-bold text-lg mb-4">Habit Tracker</h3>
               <div className="space-y-3">
                  {['Drink 2L Water', 'Read 30 mins', 'Meditation', 'No Sugar'].map(habit => (
                     <div key={habit} className="flex items-center justify-between p-3 bg-surfaceHighlight rounded-xl">
                        <span className="text-sm font-medium">{habit}</span>
                        <div className="flex gap-1">
                           {[M, T, W, T, F, S, S].map((d, i) => (
                              <div key={i} className={`w-6 h-6 rounded flex items-center justify-center text-[10px] ${i < 4 ? 'bg-green-500 text-white' : 'bg-surface border border-border text-text-sub'}`}>
                                 {d}
                              </div>
                           ))}
                        </div>
                     </div>
                  ))}
               </div>
            </GlassCard>
         </div>
      )}

      {activeTab === 'relationships' && (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <GlassCard className="p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-blue-500" /> Connection Circle</h3>
                <div className="space-y-4">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center">A</div>
                      <div className="flex-1">
                         <p className="text-sm font-bold">Alex</p>
                         <div className="w-full bg-surfaceHighlight h-1.5 rounded-full mt-1 overflow-hidden">
                            <div className="bg-green-500 h-full w-[80%]" />
                         </div>
                      </div>
                      <span className="text-xs text-green-500 font-bold">Strong</span>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center">S</div>
                      <div className="flex-1">
                         <p className="text-sm font-bold">Sarah</p>
                         <div className="w-full bg-surfaceHighlight h-1.5 rounded-full mt-1 overflow-hidden">
                            <div className="bg-yellow-500 h-full w-[50%]" />
                         </div>
                      </div>
                      <span className="text-xs text-yellow-500 font-bold">Catch up</span>
                   </div>
                </div>
             </GlassCard>

             <GlassCard className="p-6">
                <h3 className="font-bold text-lg mb-4">Communication Tips</h3>
                <ul className="space-y-3">
                   <li className="text-sm text-text-sub bg-surfaceHighlight p-3 rounded-lg border-l-2 border-blue-500">
                      "Remember to ask open-ended questions when talking to Alex today."
                   </li>
                   <li className="text-sm text-text-sub bg-surfaceHighlight p-3 rounded-lg border-l-2 border-blue-500">
                      "It's been a while since you called Mom. A quick check-in would be nice."
                   </li>
                </ul>
             </GlassCard>
         </div>
      )}
    </div>
  );
};

const M = "M", T = "T", W = "W", F = "F", S = "S";
