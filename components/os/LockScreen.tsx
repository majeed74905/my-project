
import React, { useState, useEffect } from 'react';
import { Lock, ArrowRight, Fingerprint, Sparkles } from 'lucide-react';

interface LockScreenProps {
  onUnlock: () => void;
  user?: { name: string; avatar?: string };
}

export const LockScreen: React.FC<LockScreenProps> = ({ onUnlock, user }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleUnlock = (e?: React.FormEvent) => {
    e?.preventDefault();
    // Simulate auth check
    if (pin.length >= 4 || !pin) { // Allow empty for demo ease, or enforce 1234
       onUnlock();
    } else {
       setError(true);
       setTimeout(() => setError(false), 500);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center text-white overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-black opacity-80" />
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-overlay" />
      
      {/* Date & Time */}
      <div className="relative z-10 flex flex-col items-center mb-16 animate-fade-in">
         <h1 className="text-8xl font-thin tracking-tighter mb-2">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
         </h1>
         <p className="text-xl font-medium tracking-widest uppercase opacity-80">
            {currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
         </p>
      </div>

      {/* Auth Box */}
      <div className="relative z-10 w-full max-w-sm">
         <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-1 mb-4 shadow-lg shadow-purple-500/30">
               <div className="w-full h-full rounded-full bg-black/50 flex items-center justify-center overflow-hidden">
                  {user?.avatar ? (
                     <img src={user.avatar} alt="User" className="w-full h-full object-cover" />
                  ) : (
                     <Sparkles className="w-8 h-8 text-white" />
                  )}
               </div>
            </div>
            
            <h2 className="text-xl font-bold mb-1">Welcome Back</h2>
            <p className="text-sm text-white/50 mb-6">{user?.name || "Zara OS User"}</p>

            <form onSubmit={handleUnlock} className="w-full relative">
               <input 
                 type="password" 
                 value={pin}
                 onChange={e => setPin(e.target.value)}
                 placeholder="Enter Passcode"
                 className={`w-full bg-black/30 border ${error ? 'border-red-500 animate-shake' : 'border-white/10'} rounded-xl px-4 py-3 text-center text-lg tracking-[0.5em] focus:outline-none focus:border-purple-500 transition-all placeholder:tracking-normal placeholder:text-sm`}
                 autoFocus
               />
               <button 
                 type="submit"
                 className="absolute right-2 top-2 p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
               >
                 <ArrowRight className="w-4 h-4" />
               </button>
            </form>

            <button onClick={() => onUnlock()} className="mt-6 flex items-center gap-2 text-xs text-white/40 hover:text-white transition-colors">
               <Fingerprint className="w-8 h-8" />
               <span className="sr-only">Touch ID</span>
            </button>
         </div>
         
         <p className="text-center text-xs text-white/20 mt-8">
            Zara AI OS v3.0 • Secure Environment
         </p>
      </div>
    </div>
  );
};
