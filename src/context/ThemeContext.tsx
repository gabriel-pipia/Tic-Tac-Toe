import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform, useColorScheme } from 'react-native';

import { Colors } from '@/types/theme';

type Theme = 'light' | 'dark' | 'system';



const lightColors: Colors = {
  background: '#F8FAFC',
  card: '#F1F3F8',
  border: '#C5C9D4',
  text: '#0F172A',
  subtext: '#64748B',
  separator: '#C5C9D4',
  iconBg: '#F1F5F9',
  inputBg: '#F1F5F9',
  inputBorder: '#C5C9D4',
  sheetBg: '#FFFFFF',
  primary: '#6366F1',
  secondary: '#A855F7',
  accent: '#6366F1',
  primaryGradient: ['#6366F1', '#3758d4'],
  error: '#EF4444',
  success: '#22C55E',
  white: '#FFFFFF',
  black: '#000000',
  themedWhite: '#FFFFFF',
  themedBlack: '#000000',
  info: '#3B82F6', // Blue
  warning: '#EAB308', // Yellow
  purple: '#C084FC', // Purple
};

const darkColors: Colors = {
  background: '#0F172A',
  card: '#181E30',
  border: 'rgba(255, 255, 255, 0.05)',
  text: '#FFFFFF',
  subtext: '#94A3B8',
  separator: 'rgba(255, 255, 255, 0.1)',
  iconBg: 'rgba(255, 255, 255, 0.05)',
  inputBg: 'rgba(255, 255, 255, 0.03)',
  inputBorder: 'rgba(255, 255, 255, 0.08)',
  sheetBg: '#1E293B',
  primary: '#6366F1',
  secondary: '#A855F7',
  accent: '#6366F1',
  primaryGradient: ['#6366F1', '#6182ff'],
  error: '#F87171',
  success: '#4ADE80',
  white: '#FFFFFF',
  black: '#000000',
  themedWhite: '#0F172A',
  themedBlack: '#FFFFFF',
  info: '#60A5FA', // Lighter Blue
  warning: '#FACC15', // Lighter Yellow
  purple: '#D8B4FE', // Lighter Purple
};

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  setOverrideTheme: (theme: Theme | null) => void;
  isDark: boolean;
  colors: Colors;
};

const ThemeContext = createContext<ThemeContextType>({} as ThemeContextType);

export const useTheme = () => useContext(ThemeContext);

// Platform-specific storage helper
const storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
    return AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
      return;
    }
    return AsyncStorage.setItem(key, value);
  },
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>('system');
  const systemColorScheme = useColorScheme(); // from react-native now

  const loadTheme = useCallback(async () => {
    const savedTheme = await storage.getItem('theme');
    if (savedTheme) {
      setThemeState(savedTheme as Theme);
    }
  }, []);

  useEffect(() => {
    loadTheme();
  }, [loadTheme]);

  const [overrideTheme, setOverrideThemeState] = useState<Theme | null>(null);

  const setTheme = useCallback(async (newTheme: Theme) => {
    setThemeState(newTheme);
    await storage.setItem('theme', newTheme);
  }, []);

  const setOverrideTheme = useCallback((tempTheme: Theme | null) => {
      setOverrideThemeState(tempTheme);
  }, []);

  // Compute isDark immediately based on state
  const isDark = useMemo(() => {
      if (overrideTheme) return overrideTheme === 'dark';
      if (theme !== 'system') return theme === 'dark';
      return systemColorScheme === 'dark';
  }, [overrideTheme, theme, systemColorScheme]);
  const colors = useMemo(() => isDark ? darkColors : lightColors, [isDark]);

  return (
    <ThemeContext.Provider value={{
      theme,
      setTheme,
      setOverrideTheme,
      isDark,
      colors
    }}>
      {children}
    </ThemeContext.Provider>
  );
};
