
import { useEffect } from 'react';
import { ViewMode } from '../types';
import { ThemeName } from '../theme/types';
import { MODE_THEME_MAPPING } from '../constants/appConstants';

export const useModeThemeSync = (
  currentView: ViewMode, 
  isEmotional: boolean, 
  isEnabled: boolean, 
  setTheme: (t: ThemeName) => void
) => {
  useEffect(() => {
    if (!isEnabled) return;
    
    // Override theme for Emotional Support Mode
    if (currentView === 'chat' && isEmotional) {
      setTheme('royal');
      return;
    }

    const targetTheme = MODE_THEME_MAPPING[currentView];
    if (targetTheme) {
      setTheme(targetTheme);
    }
  }, [currentView, isEmotional, isEnabled, setTheme]);
};