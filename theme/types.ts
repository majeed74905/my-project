
export type ThemeName = 'light' | 'dark' | 'aurora' | 'glass' | 'midnight' | 'solarizedDark' | 'royal' | 'pastel';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceHighlight: string;
  textMain: string;
  textSub: string;
  primary: string;
  primaryDark: string;
  accent: string;
  border: string;
}

export interface ThemeConfig {
  name: ThemeName;
  label: string;
  description: string;
  colors: ThemeColors;
  gradientOverlay?: string; // Optional CSS gradient for body::before
}
