
import { ThemeConfig, ThemeName } from './types';

export const THEMES: Record<ThemeName, ThemeConfig> = {
  dark: {
    name: 'dark',
    label: 'Violet Dark',
    description: 'Deep purple workspace.',
    colors: {
      background: '#0B0214', // Very deep violet/black
      surface: '#17082A', // Dark violet surface
      surfaceHighlight: '#261042', // Lighter violet highlight
      textMain: '#F3E8FF', // Lavender white
      textSub: '#A78BFA', // Muted violet
      primary: '#8B5CF6', // Violet 500
      primaryDark: '#7C3AED',
      accent: '#D946EF', // Fuchsia
      border: 'rgba(139, 92, 246, 0.15)', // Violet border
    },
    gradientOverlay: 'radial-gradient(circle at 10% 20%, rgba(139, 92, 246, 0.08) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(217, 70, 239, 0.08) 0%, transparent 40%)'
  },
  light: {
    name: 'light',
    label: 'Violet Light',
    description: 'Clean lavender aesthetics.',
    colors: {
      background: '#F5F3FF', // Violet 50
      surface: '#FFFFFF',
      surfaceHighlight: '#EDE9FE', // Violet 100
      textMain: '#2E1065', // Violet 950
      textSub: '#5B21B6', // Violet 800
      primary: '#7C3AED', // Violet 600
      primaryDark: '#6D28D9',
      accent: '#C026D3', // Fuchsia
      border: 'rgba(124, 58, 237, 0.15)',
    },
    gradientOverlay: 'radial-gradient(circle at 10% 20%, rgba(139, 92, 246, 0.05) 0%, transparent 40%)'
  },
  aurora: {
    name: 'aurora',
    label: 'Aurora',
    description: 'Deep space blue with vibrant gradients.',
    colors: {
      background: '#0F172A',
      surface: '#1E293B',
      surfaceHighlight: '#334155',
      textMain: '#F8FAFC',
      textSub: '#94A3B8',
      primary: '#818CF8',
      primaryDark: '#6366F1',
      accent: '#2DD4BF',
      border: 'rgba(148, 163, 184, 0.2)',
    },
    gradientOverlay: 'conic-gradient(from 0deg at 50% 50%, rgba(129, 140, 248, 0.05) 0deg, rgba(45, 212, 191, 0.05) 180deg, rgba(129, 140, 248, 0.05) 360deg)'
  },
  glass: {
    name: 'glass',
    label: 'Glassmorphism',
    description: 'Frosted, airy, modern aesthetics.',
    colors: {
      background: '#E0F2FE',
      surface: 'rgba(255, 255, 255, 0.65)',
      surfaceHighlight: 'rgba(255, 255, 255, 0.8)',
      textMain: '#0C4A6E',
      textSub: '#0369A1',
      primary: '#0EA5E9',
      primaryDark: '#0284C7',
      accent: '#F472B6',
      border: 'rgba(255, 255, 255, 0.5)',
    },
    gradientOverlay: 'linear-gradient(120deg, #e0c3fc 0%, #8ec5fc 100%)'
  },
  midnight: {
    name: 'midnight',
    label: 'Midnight',
    description: 'Ultra-dark navy for late night focus.',
    colors: {
      background: '#020617',
      surface: '#0F172A',
      surfaceHighlight: '#1E293B',
      textMain: '#E2E8F0',
      textSub: '#64748B',
      primary: '#38BDF8',
      primaryDark: '#0284C7',
      accent: '#FB7185',
      border: 'rgba(30, 41, 59, 0.5)',
    },
    gradientOverlay: 'none'
  },
  solarizedDark: {
    name: 'solarizedDark',
    label: 'Solarized',
    description: 'Optimized for code and high readability.',
    colors: {
      background: '#002b36',
      surface: '#073642',
      surfaceHighlight: '#586e75',
      textMain: '#fdf6e3',
      textSub: '#839496',
      primary: '#2aa198',
      primaryDark: '#268bd2',
      accent: '#d33682',
      border: 'rgba(88, 110, 117, 0.3)',
    },
    gradientOverlay: 'none'
  },
  royal: {
    name: 'royal',
    label: 'Royal',
    description: 'Luxurious deep purple and gold.',
    colors: {
      background: '#1a0b2e',
      surface: '#2d1b4e',
      surfaceHighlight: '#43237a',
      textMain: '#fae8ff',
      textSub: '#d8b4fe',
      primary: '#fbbf24',
      primaryDark: '#d97706',
      accent: '#f472b6',
      border: 'rgba(251, 191, 36, 0.15)',
    },
    gradientOverlay: 'radial-gradient(circle at top right, rgba(251, 191, 36, 0.1), transparent 50%)'
  },
  pastel: {
    name: 'pastel',
    label: 'Pastel',
    description: 'Soft, calming colors.',
    colors: {
      background: '#fdf2f8',
      surface: '#fff1f2',
      surfaceHighlight: '#ffe4e6',
      textMain: '#881337',
      textSub: '#9f1239',
      primary: '#f43f5e',
      primaryDark: '#e11d48',
      accent: '#14b8a6',
      border: 'rgba(244, 63, 94, 0.1)',
    },
    gradientOverlay: 'linear-gradient(to right, #ffdde1, #ee9ca7)'
  }
};
