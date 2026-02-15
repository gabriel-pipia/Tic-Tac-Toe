import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'nativewind';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

type Theme = 'light' | 'dark' | 'system';

export type Colors = {
  background: string;
  card: string;
  border: string;
  text: string;
  subtext: string;
  separator: string;
  iconBg: string;
  inputBg: string;
  inputBorder: string;
  sheetBg: string;
  primary: string;
  secondary: string;
  accent: string;
  primaryGradient: [string, string];
  error: string;
  success: string;
  white: string;
  black: string;
  themedWhite: string;
  themedBlack: string;
  info: string;
  warning: string;
  purple: string;
};

const lightColors: Colors = {
  background: '#F8FAFC',
  card: 'rgba(255, 255, 255, 0.5)',
  border: '#E2E8F0',
  text: '#0F172A',
  subtext: '#64748B',
  separator: '#E2E8F0',
  iconBg: '#F1F5F9',
  inputBg: '#F1F5F9',
  inputBorder: '#E2E8F0',
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
  card: 'rgba(15, 23, 42, 0.7)',
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
  const { colorScheme, setColorScheme } = useColorScheme();
  const [theme, setThemeState] = useState<Theme>('system');

  const loadTheme = useCallback(async () => {
    const savedTheme = await storage.getItem('theme');
    if (savedTheme) {
      setThemeState(savedTheme as Theme);
      if (savedTheme !== 'system') {
        setColorScheme(savedTheme as 'light' | 'dark');
      } else {
        setColorScheme('system');
      }
    }
  }, [setColorScheme]);

  useEffect(() => {
    loadTheme();
  }, [loadTheme]);

  const setTheme = useCallback(async (newTheme: Theme) => {
    setThemeState(newTheme);
    await storage.setItem('theme', newTheme);
    if (newTheme === 'system') {
      setColorScheme('system');
    } else {
      setColorScheme(newTheme);
    }
  }, [setColorScheme]);

  const isDark = colorScheme === 'dark';
  const colors = useMemo(() => isDark ? darkColors : lightColors, [isDark]);

  return (
    <ThemeContext.Provider value={{
      theme,
      setTheme,
      isDark,
      colors
    }}>
      {children}
    </ThemeContext.Provider>
  );
};
