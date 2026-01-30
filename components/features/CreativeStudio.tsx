
import React, { useState } from 'react';
import { Lightbulb, Cloud, GitBranch, Sparkles, Plus, ArrowRight } from 'lucide-react';
import { GlassCard } from '../shared/UIComponents';

export const CreativeStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ideas' | 'dreams' | 'simulator'>('ideas');

  return (
    <div className="h-full p-6 md:p-8 animate-fade-in overflow-y-auto max-w-5xl mx-auto">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
         <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-500 bg-clip-text text-transparent mb-2">
               Creative Studio
            </h2>
            <p className="text-text-sub">A workspace for imagination, dreams, and future scenarios.</p>
         </div>
         <div className="flex bg-surfaceHighlight p-1 rounded-xl self-start">
            <button onClick={() => setActiveTab('ideas')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'ideas' ? 'bg-surface shadow text-violet-500' : 'text-text-sub'}`}>
               <Lightbulb className="w-4 h-4" /> Idea Factory
            </button>
            <button onClick={() => setActiveTab('dreams')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'dreams' ? 'bg-surface shadow text-blue-400' : 'text-text-sub'}`}>
               <Cloud className="w-4 h-4" /> Dream Universe
            </button>
            <button onClick={() => setActiveTab('simulator')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'simulator' ? 'bg-surface shadow text-emerald-400' : 'text-text-sub'}`}>
               <GitBranch className="w-4 h-4" /> Simulator
            </button>
         </div>
      </div>

      {activeTab === 'ideas' && (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard className="p-6 flex flex-col items-center justify-center text-center min-h-[200px] border-2 border-dashed border-border hover:border-violet-500/50 cursor-pointer group">
               <div className="w-16 h-16 rounded-full bg-surfaceHighlight flex items-center justify-center mb-4 group-hover:bg-violet-500/10 transition-colors">
                  <Plus className="w-8 h-8 text-text-sub group-hover:text-violet-500" />
               </div>
               <h3 className="font-bold text-lg mb-1">Generate New Idea</h3>
               <p className="text-sm text-text-sub">App concepts, blog posts, or business plans.</p>
            </GlassCard>

            <GlassCard className="p-6">
               <h3 className="font-bold text-lg mb-4 text-violet-400">Recent Sparks</h3>
               <div className="space-y-4">
                  <div className="p-4 bg-surfaceHighlight rounded-xl">
                     <h4 className="font-bold text-sm mb-1">Eco-friendly Meal Planner</h4>
                     <p className="text-xs text-text-sub">An app that suggests recipes based on carbon footprint of ingredients.</p>
                  </div>
                  <div className="p-4 bg-surfaceHighlight rounded-xl">
                     <h4 className="font-bold text-sm mb-1">VR Language Learning</h4>
                     <p className="text-xs text-text-sub">Immersive scenarios to practice conversation in virtual cafes.</p>
                  </div>
               </div>
            </GlassCard>
         </div>
      )}

      {activeTab === 'dreams' && (
         <div className="space-y-6">
            <div className="bg-blue-900/20 border border-blue-500/20 p-6 rounded-2xl flex items-start gap-4">
               <Sparkles className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
               <div>
                  <h3 className="font-bold text-lg text-blue-100">Dream Logger</h3>
                  <p className="text-sm text-blue-200/70 mb-4">Record your dreams. Zara will analyze symbols and emotional meaning.</p>
                  <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold">Log New Dream</button>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <GlassCard className="p-6">
                  <span className="text-xs font-bold text-text-sub uppercase mb-2 block">Last Night</span>
                  <p className="text-lg italic text-text mb-4">"I was flying over a neon city, but my wings were made of paper..."</p>
                  <div className="bg-surfaceHighlight p-4 rounded-xl">
                     <h4 className="font-bold text-xs text-primary mb-1 uppercase">Analysis</h4>
                     <p className="text-sm text-text-sub">Flying often represents freedom, while paper wings might suggest fragility or fear that your current success isn't permanent.</p>
                  </div>
               </GlassCard>
            </div>
         </div>
      )}

      {activeTab === 'simulator' && (
         <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
             <div className="max-w-md space-y-6">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                   <GitBranch className="w-10 h-10 text-emerald-500" />
                </div>
                <h3 className="text-2xl font-bold">Future Simulator</h3>
                <p className="text-text-sub">
                   Unsure about a decision? Simulate potential timelines.
                   <br/>"What happens if I quit my job?"
                   <br/>"What happens if I move to a new city?"
                </p>
                
                <div className="relative">
                   <input 
                     placeholder="Enter a scenario to simulate..."
                     className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text focus:border-emerald-500 focus:outline-none pr-12"
                   />
                   <button className="absolute right-2 top-1.5 p-1.5 bg-emerald-500 rounded-lg text-white hover:bg-emerald-600">
                      <ArrowRight className="w-4 h-4" />
                   </button>
                </div>
             </div>
         </div>
      )}
    </div>
  );
};
