
import React from 'react';
import { Zap, Trophy, Target, Star, ChevronRight } from 'lucide-react';
import { GlassCard } from '../shared/UIComponents';

export const SkillOS: React.FC = () => {
  return (
    <div className="h-full p-6 md:p-8 animate-fade-in overflow-y-auto max-w-5xl mx-auto">
       <div className="mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-2">
             SkillOS
          </h2>
          <p className="text-text-sub">Gamified mastery and progression system.</p>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <GlassCard className="p-6 flex items-center gap-4">
             <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500 border-2 border-yellow-500/20">
                <span className="text-2xl font-black">12</span>
             </div>
             <div>
                <p className="text-xs text-text-sub uppercase font-bold">Current Level</p>
                <p className="text-xl font-bold">Apprentice</p>
                <div className="w-32 h-1.5 bg-surfaceHighlight rounded-full mt-2 overflow-hidden">
                   <div className="h-full bg-yellow-500 w-[65%]" />
                </div>
                <p className="text-[10px] text-text-sub mt-1">650 / 1000 XP</p>
             </div>
          </GlassCard>

          <GlassCard className="p-6 col-span-2">
             <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Target className="w-5 h-5 text-red-500" /> Active Quests</h3>
             <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-surfaceHighlight rounded-xl">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-surface flex items-center justify-center text-lg">⚛️</div>
                      <div>
                         <p className="text-sm font-bold">React Mastery</p>
                         <p className="text-xs text-text-sub">Complete 3 Advanced Hooks Drills</p>
                      </div>
                   </div>
                   <span className="text-xs font-bold text-yellow-500">+50 XP</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-surfaceHighlight rounded-xl">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-surface flex items-center justify-center text-lg">🐍</div>
                      <div>
                         <p className="text-sm font-bold">Python Automation</p>
                         <p className="text-xs text-text-sub">Write a file organizer script</p>
                      </div>
                   </div>
                   <span className="text-xs font-bold text-yellow-500">+100 XP</span>
                </div>
             </div>
          </GlassCard>
       </div>

       <h3 className="text-xl font-bold mb-4">Skill Trees</h3>
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {['Web Development', 'Data Science', 'UI Design', 'Communication', 'Finance'].map(skill => (
             <GlassCard key={skill} className="p-5 hover:border-primary/50 cursor-pointer group">
                <div className="flex justify-between items-start mb-4">
                   <h4 className="font-bold text-text">{skill}</h4>
                   <ChevronRight className="w-4 h-4 text-text-sub group-hover:translate-x-1 transition-transform" />
                </div>
                <div className="flex gap-1 mb-2">
                   {[1, 2, 3, 4, 5].map(star => (
                      <Star key={star} className={`w-4 h-4 ${star <= 3 ? 'text-yellow-500 fill-yellow-500' : 'text-surfaceHighlight fill-surfaceHighlight'}`} />
                   ))}
                </div>
                <p className="text-xs text-text-sub">Level 3 • Intermediate</p>
             </GlassCard>
          ))}
       </div>
    </div>
  );
};
