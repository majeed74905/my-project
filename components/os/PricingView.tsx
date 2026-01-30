
import React from 'react';
import { Check, Zap, Brain, Shield, Rocket, Crown } from 'lucide-react';
import { GlassCard } from '../shared/UIComponents';

export const PricingView: React.FC = () => {
  return (
    <div className="h-full p-6 md:p-8 animate-fade-in overflow-y-auto max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-4">
          Upgrade Your Intelligence
        </h2>
        <p className="text-text-sub max-w-xl mx-auto text-lg">
          Choose the plan that fits your ambition. From casual assistant to full AI architect.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        
        {/* FREE */}
        <div className="bg-surface/50 border border-border rounded-3xl p-8 relative">
           <h3 className="text-xl font-bold text-text mb-2">Zara Core</h3>
           <p className="text-text-sub text-sm mb-6">Essential AI assistance for everyday tasks.</p>
           <div className="mb-6">
              <span className="text-4xl font-bold text-text">$0</span>
              <span className="text-text-sub">/mo</span>
           </div>
           <button className="w-full py-3 rounded-xl border border-border bg-surfaceHighlight font-bold text-sm mb-8 hover:bg-surface transition-colors">
              Current Plan
           </button>
           <ul className="space-y-4">
              <li className="flex items-center gap-3 text-sm">
                 <Check className="w-4 h-4 text-green-500" /> Smart Chat (Flash Model)
              </li>
              <li className="flex items-center gap-3 text-sm">
                 <Check className="w-4 h-4 text-green-500" /> Basic Memory
              </li>
              <li className="flex items-center gap-3 text-sm">
                 <Check className="w-4 h-4 text-green-500" /> Student Mode
              </li>
              <li className="flex items-center gap-3 text-sm text-text-sub">
                 <Check className="w-4 h-4 opacity-50" /> Limited Image Gen
              </li>
           </ul>
        </div>

        {/* PRO */}
        <div className="bg-surface border-2 border-primary/50 rounded-3xl p-8 relative shadow-2xl shadow-primary/10 transform md:-translate-y-4">
           <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
              Most Popular
           </div>
           <h3 className="text-xl font-bold text-text mb-2 flex items-center gap-2">
              Zara Pro <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" />
           </h3>
           <p className="text-text-sub text-sm mb-6">Unlock the full power of the LifeOS ecosystem.</p>
           <div className="mb-6">
              <span className="text-4xl font-bold text-text">$19</span>
              <span className="text-text-sub">/mo</span>
           </div>
           <button className="w-full py-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-sm mb-8 transition-all shadow-lg shadow-primary/20">
              Upgrade to Pro
           </button>
           <ul className="space-y-4">
              <li className="flex items-center gap-3 text-sm font-medium">
                 <Check className="w-4 h-4 text-primary" /> Everything in Core
              </li>
              <li className="flex items-center gap-3 text-sm">
                 <Check className="w-4 h-4 text-primary" /> LifeOS & Wellness Tracking
              </li>
              <li className="flex items-center gap-3 text-sm">
                 <Check className="w-4 h-4 text-primary" /> SkillOS Mastery System
              </li>
              <li className="flex items-center gap-3 text-sm">
                 <Check className="w-4 h-4 text-primary" /> Advanced Memory Vault
              </li>
              <li className="flex items-center gap-3 text-sm">
                 <Check className="w-4 h-4 text-primary" /> Voice & Live Mode (Unlimited)
              </li>
           </ul>
        </div>

        {/* ULTRA */}
        <div className="bg-gradient-to-b from-surface/80 to-indigo-900/10 border border-indigo-500/30 rounded-3xl p-8 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10">
              <Crown className="w-24 h-24 text-indigo-500" />
           </div>
           <h3 className="text-xl font-bold text-text mb-2">Zara Ultra</h3>
           <p className="text-text-sub text-sm mb-6">For architects, developers, and power users.</p>
           <div className="mb-6">
              <span className="text-4xl font-bold text-text">$49</span>
              <span className="text-text-sub">/mo</span>
           </div>
           <button className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm mb-8 transition-all shadow-lg shadow-indigo-600/20">
              Go Ultra
           </button>
           <ul className="space-y-4">
              <li className="flex items-center gap-3 text-sm font-medium">
                 <Check className="w-4 h-4 text-indigo-400" /> Everything in Pro
              </li>
              <li className="flex items-center gap-3 text-sm">
                 <Check className="w-4 h-4 text-indigo-400" /> Project Architect Agent
              </li>
              <li className="flex items-center gap-3 text-sm">
                 <Check className="w-4 h-4 text-indigo-400" /> App Builder Mode
              </li>
              <li className="flex items-center gap-3 text-sm">
                 <Check className="w-4 h-4 text-indigo-400" /> 1M Token Context Window
              </li>
              <li className="flex items-center gap-3 text-sm">
                 <Check className="w-4 h-4 text-indigo-400" /> Early Access to Gen-3
              </li>
           </ul>
        </div>

      </div>

      <div className="mt-16 text-center">
         <p className="text-sm text-text-sub mb-4">Trusted by students, developers, and creators worldwide.</p>
         <div className="flex justify-center gap-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Fake Logos for effect */}
            <div className="font-black text-xl tracking-tighter">ACME Corp</div>
            <div className="font-black text-xl tracking-tighter">Globex</div>
            <div className="font-black text-xl tracking-tighter">Soylent</div>
            <div className="font-black text-xl tracking-tighter">Umbrella</div>
         </div>
      </div>
    </div>
  );
};
