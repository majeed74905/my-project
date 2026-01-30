
import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeConfig, ThemeName } from './types';
import { THEMES } from './themes';

interface ThemeContextType {
  currentThemeName: ThemeName;
  currentThemeConfig: ThemeConfig;
  setTheme: (theme: ThemeName) => void;
  availableThemes: ThemeConfig[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'zara_theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentThemeName, setCurrentThemeName] = useState<ThemeName>('dark'); // Default to dark

  useEffect(() => {
    // Load from storage
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeName;
    if (stored && THEMES[stored]) {
      setCurrentThemeName(stored);
    }
  }, []);

  useEffect(() => {
    // Apply theme
    const root = document.documentElement;
    const themeConfig = THEMES[currentThemeName];

    // Remove old theme classes
    root.classList.remove(...Object.keys(THEMES).map(t => `theme-${t}`));
    root.classList.remove('dark'); // Remove legacy dark class if present

    // Add new theme class
    root.classList.add(`theme-${currentThemeName}`);
    
    // Add 'dark' class if the theme is dark-based (for Tailwind dark: modifier compat if needed)
    // We assume 'glass', 'light', 'pastel' are light, rest are dark.
    const isDark = !['light', 'glass', 'pastel'].includes(currentThemeName);
    if (isDark) root.classList.add('dark');

    // Save
    localStorage.setItem(STORAGE_KEY, currentThemeName);

    // Apply specific Body Gradient if exists (Dynamic CSS injection)
    // We update a custom property or specific style block
    if (themeConfig.gradientOverlay) {
        document.body.style.setProperty('--gradient-overlay', themeConfig.gradientOverlay);
    } else {
        document.body.style.setProperty('--gradient-overlay', 'none');
    }

  }, [currentThemeName]);

  const setTheme = (theme: ThemeName) => {
    setCurrentThemeName(theme);
  };

  const availableThemes = Object.values(THEMES);
  const currentThemeConfig = THEMES[currentThemeName];

  return (
    <ThemeContext.Provider value={{ currentThemeName, currentThemeConfig, setTheme, availableThemes }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
