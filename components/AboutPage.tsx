
import React from 'react';
import { APP_VERSION } from '../constants/appConstants';
import { GlassCard, Badge } from './shared/UIComponents';
import { Sparkles, Heart, Github, Briefcase, Mail, Phone } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="h-full max-w-4xl mx-auto p-8 animate-fade-in overflow-y-auto">
      <div className="text-center mb-12">
         <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-primary/30 mb-6">
            <Sparkles className="w-10 h-10 text-white fill-white" />
         </div>
         <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-purple-500 bg-clip-text text-transparent mb-2">
            {APP_VERSION}
         </h1>
         <p className="text-text-sub text-lg">The Ultimate Multi-Modal AI Workspace</p>
      </div>

      <div className="mb-8">
         <GlassCard className="p-6">
            <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
               <Heart className="w-5 h-5 text-red-500" /> Credits & Contact
            </h3>
            <p className="text-sm text-text-sub mb-4 leading-relaxed">
               Created with passion by <strong className="text-text">Mohammed Majeed J</strong>.
               Designed to be a comprehensive showcase of modern AI capabilities, bridging the gap between student tools and professional workflows.
            </p>
            <div className="space-y-3">
               <div className="flex gap-4">
                  <a href="https://github.com/majeed74905" target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                     <Github className="w-3 h-3" /> GitHub
                  </a>
                  <a href="https://majeed-portfolio-website.netlify.app/" target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                     <Briefcase className="w-3 h-3" /> Portfolio
                  </a>
               </div>
               <div className="pt-3 border-t border-white/5 space-y-1">
                  <a href="mailto:majeed74905@gmail.com" className="text-xs text-text-sub hover:text-text flex items-center gap-2 transition-colors">
                     <Mail className="w-3 h-3" /> majeed74905@gmail.com
                  </a>
                  <p className="text-xs text-text-sub flex items-center gap-2">
                     <Phone className="w-3 h-3" /> 9361971840
                  </p>
               </div>
            </div>
         </GlassCard>
      </div>

      <GlassCard className="p-8 text-center">
         <h3 className="font-bold text-lg mb-6">Development Roadmap</h3>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="relative">
               <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
               <p className="font-bold text-sm">Phase 1 (Done)</p>
               <p className="text-xs text-text-sub mt-1">Core Chat, Student Mode, Code Mode</p>
            </div>
            <div className="relative">
               <div className="w-3 h-3 bg-primary rounded-full mx-auto mb-2 shadow-[0_0_10px_rgba(139,92,246,0.5)]" />
               <p className="font-bold text-sm">Phase 2 (Live)</p>
               <p className="text-xs text-text-sub mt-1">Voice, Video, Live API, Flashcards</p>
            </div>
            <div className="relative">
               <div className="w-3 h-3 bg-text-sub/50 rounded-full mx-auto mb-2" />
               <p className="font-bold text-sm">Phase 3 (Next)</p>
               <p className="text-xs text-text-sub mt-1">Cloud Sync, Multi-Agent Collaboration</p>
            </div>
         </div>
      </GlassCard>

      <div className="mt-12 text-center text-xs text-text-sub opacity-50">
         &copy; {new Date().getFullYear()} Zara AI Project. All rights reserved.
      </div>
    </div>
  );
};
