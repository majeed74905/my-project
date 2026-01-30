
import { useState, useEffect } from 'react';
import { ViewMode, SystemConfig } from '../types';
import { DEFAULT_SYSTEM_CONFIG } from '../constants/appConstants';

export const useAppMemory = () => {
  const [lastView, setLastView] = useState<ViewMode>('chat');
  const [systemConfig, setSystemConfig] = useState<SystemConfig>(DEFAULT_SYSTEM_CONFIG);

  useEffect(() => {
    // Load
    const storedView = localStorage.getItem('zara-last-mode') as ViewMode;
    if (storedView) setLastView(storedView);

    const storedConfig = localStorage.getItem('zara-system-config');
    if (storedConfig) {
      try {
        setSystemConfig({ ...DEFAULT_SYSTEM_CONFIG, ...JSON.parse(storedConfig) });
      } catch (e) {
        console.error("Config parse error", e);
      }
    }
  }, []);

  const updateView = (view: ViewMode) => {
    setLastView(view);
    localStorage.setItem('zara-last-mode', view);
  };

  const updateSystemConfig = (newConfig: Partial<SystemConfig>) => {
    const merged = { ...systemConfig, ...newConfig };
    setSystemConfig(merged);
    localStorage.setItem('zara-system-config', JSON.stringify(merged));
  };

  return { lastView, updateView, systemConfig, updateSystemConfig };
};
