import React, { useState, useEffect } from 'react';
import { BarChart3, Clock, MessageSquare, TrendingUp, Calendar, Trophy } from 'lucide-react';
import { DailyStats } from '../types';

export const AnalyticsDashboard: React.FC = () => {
  const [stats, setStats] = useState<DailyStats[]>([]);

  useEffect(() => {
    // Mock data generation or load from localStorage
    const stored = localStorage.getItem('zara_analytics');
    if (stored) {
       setStats(JSON.parse(stored));
    } else {
       // Initialize with some dummy data for visualization if empty
       const today = new Date();
       const dummy: DailyStats[] = [];
       for(let i=6; i>=0; i--) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          dummy.push({
             date: d.toISOString().split('T')[0],
             messagesSent: Math.floor(Math.random() * 50) + 10,
             minutesSpent: Math.floor(Math.random() * 60) + 15,
             examsTaken: Math.floor(Math.random() * 2)
          });
       }
       setStats(dummy);
    }
  }, []);

  const totalTime = stats.reduce((acc, curr) => acc + curr.minutesSpent, 0);
  const totalMsgs = stats.reduce((acc, curr) => acc + curr.messagesSent, 0);
  const streak = stats.length > 0 ? 3 : 0; // Simplified streak logic

  return (
    <div className="h-full max-w-6xl mx-auto p-4 md:p-8 animate-fade-in overflow-y-auto">
       <div className="mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent mb-2">
            Your Progress
          </h2>
          <p className="text-text-sub">Track your learning journey and productivity.</p>
       </div>

       {/* Key Metrics */}
       <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="glass-panel p-5 rounded-2xl">
             <div className="flex justify-between items-start mb-2">
                <Clock className="w-5 h-5 text-blue-500" />
                <span className="text-xs font-bold text-green-500">+12%</span>
             </div>
             <p className="text-2xl font-bold">{Math.floor(totalTime / 60)}h {totalTime % 60}m</p>
             <p className="text-xs text-text-sub">Total Study Time</p>
          </div>
          
          <div className="glass-panel p-5 rounded-2xl">
             <div className="flex justify-between items-start mb-2">
                <MessageSquare className="w-5 h-5 text-purple-500" />
             </div>
             <p className="text-2xl font-bold">{totalMsgs}</p>
             <p className="text-xs text-text-sub">Interactions</p>
          </div>

          <div className="glass-panel p-5 rounded-2xl">
             <div className="flex justify-between items-start mb-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
             </div>
             <p className="text-2xl font-bold">{streak} Days</p>
             <p className="text-xs text-text-sub">Current Streak</p>
          </div>

          <div className="glass-panel p-5 rounded-2xl">
             <div className="flex justify-between items-start mb-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
             </div>
             <p className="text-2xl font-bold">Level 4</p>
             <p className="text-xs text-text-sub">Scholar Rank</p>
          </div>
       </div>

       {/* Charts Area */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-panel p-6 rounded-2xl">
             <h3 className="font-bold mb-6 flex items-center gap-2">
               <BarChart3 className="w-5 h-5 text-primary" /> Weekly Activity
             </h3>
             <div className="flex items-end justify-between h-48 gap-2">
                {stats.map((day, i) => (
                   <div key={i} className="flex flex-col items-center flex-1 group">
                      <div className="w-full bg-surfaceHighlight rounded-t-lg relative overflow-hidden transition-all hover:bg-primary/20" style={{ height: '100%' }}>
                         <div 
                           className="absolute bottom-0 left-0 w-full bg-primary transition-all duration-1000 group-hover:bg-primary-dark" 
                           style={{ height: `${Math.min((day.minutesSpent / 120) * 100, 100)}%` }} 
                         />
                         {/* Tooltip */}
                         <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {day.minutesSpent} mins
                         </div>
                      </div>
                      <span className="text-[10px] text-text-sub mt-2 truncate w-full text-center">
                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                      </span>
                   </div>
                ))}
             </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl flex flex-col justify-center">
             <h3 className="font-bold mb-4 flex items-center gap-2">
               <Calendar className="w-5 h-5 text-accent" /> Upcoming Goals
             </h3>
             <div className="space-y-4">
                <div className="flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-red-500" />
                   <span className="flex-1 text-sm">Complete "Data Structures" Unit</span>
                   <span className="text-xs text-text-sub">Due Tomorrow</span>
                </div>
                <div className="flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-yellow-500" />
                   <span className="flex-1 text-sm">Review Flashcards (20 pending)</span>
                   <span className="text-xs text-text-sub">Daily</span>
                </div>
                <div className="flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-green-500" />
                   <span className="flex-1 text-sm">Take Mock Exam 3</span>
                   <span className="text-xs text-text-sub">Weekend</span>
                </div>
             </div>
             
             <button className="mt-6 w-full py-3 rounded-xl border border-border hover:bg-surfaceHighlight transition-colors text-sm font-medium">
                Edit Study Plan
             </button>
          </div>
       </div>
    </div>
  );
};
