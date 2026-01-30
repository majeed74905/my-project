
import React from 'react';
import { useTheme } from '../theme/ThemeContext';
import { Check } from 'lucide-react';

export const ThemeSwitcher: React.FC = () => {
  const { currentThemeName, setTheme, availableThemes } = useTheme();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {availableThemes.map((theme) => {
        const isActive = currentThemeName === theme.name;
        
        return (
          <button
            key={theme.name}
            onClick={() => setTheme(theme.name)}
            className={`relative flex items-center gap-3 p-3 rounded-xl border transition-all text-left group ${
              isActive 
                ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                : 'border-border bg-surface hover:border-primary/50'
            }`}
          >
            {/* Color Preview Swatch */}
            <div className="flex-shrink-0 w-10 h-10 rounded-lg shadow-sm overflow-hidden grid grid-cols-2 relative border border-border">
              <div style={{ backgroundColor: theme.colors.background }} className="col-span-2 h-1/2" />
              <div style={{ backgroundColor: theme.colors.primary }} className="h-1/2" />
              <div style={{ backgroundColor: theme.colors.surface }} className="h-1/2" />
              
              {isActive && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
                  <Check className="w-4 h-4 text-white drop-shadow-md" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                 <h4 className={`text-sm font-semibold truncate ${isActive ? 'text-primary' : 'text-text'}`}>
                   {theme.label}
                 </h4>
              </div>
              <p className="text-[10px] text-text-sub truncate">
                {theme.description}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
};
