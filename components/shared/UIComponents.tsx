
import React from 'react';

export const GlassCard: React.FC<{ children?: React.ReactNode, className?: string, onClick?: () => void }> = ({ children, className = '', onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-surface/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl hover:bg-surface/80 ${className}`}
  >
    {children}
  </div>
);

export const FadeIn: React.FC<{ children: React.ReactNode, delay?: number, className?: string }> = ({ children, delay = 0, className = '' }) => (
  <div 
    className={`animate-fade-in ${className}`}
    style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
  >
    {children}
  </div>
);

export const Badge: React.FC<{ children: React.ReactNode, variant?: 'primary' | 'secondary' | 'accent' | 'outline' }> = ({ children, variant = 'primary' }) => {
  const styles = {
    primary: 'bg-primary/10 text-primary border-primary/20',
    secondary: 'bg-surfaceHighlight text-text-sub border-border',
    accent: 'bg-accent/10 text-accent border-accent/20',
    outline: 'bg-transparent border-border text-text-sub'
  };
  
  return (
    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${styles[variant]}`}>
      {children}
    </span>
  );
};
