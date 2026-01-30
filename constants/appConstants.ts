
import { ThemeName } from '../theme/types';
import { ViewMode } from '../types';

export const APP_VERSION = "Zara AI v3.0 Pro";

// Mapping modes to specific aesthetic themes for automatic switching
export const MODE_THEME_MAPPING: Partial<Record<ViewMode, ThemeName>> = {
  chat: 'dark',
  live: 'aurora',
  workspace: 'royal',
  student: 'pastel',
  exam: 'light',
  code: 'solarizedDark',
  builder: 'midnight',
  github: 'aurora',
  notes: 'glass',
  planner: 'aurora'
};

export const DEFAULT_SYSTEM_CONFIG = {
  autoTheme: true, // Enabled by default to switch themes on mode change
  enableAnimations: true,
  density: 'comfortable' as 'comfortable' | 'compact',
  soundEffects: true
};
