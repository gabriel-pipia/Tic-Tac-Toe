import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'nativewind';
import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
};

const ThemeContext = createContext<ThemeContextType>({} as ThemeContextType);

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { colorScheme, setColorScheme } = useColorScheme();
  const [theme, setThemeState] = useState<Theme>('system');

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    const savedTheme = await AsyncStorage.getItem('theme');
    if (savedTheme) {
      setThemeState(savedTheme as Theme);
      if (savedTheme !== 'system') {
        setColorScheme(savedTheme as 'light' | 'dark');
      } else {
        setColorScheme('system');
      }
    }
  };

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    await AsyncStorage.setItem('theme', newTheme);
    if (newTheme === 'system') {
      setColorScheme('system');
    } else {
      setColorScheme(newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      setTheme,
      isDark: colorScheme === 'dark'
    }}>
      {children}
    </ThemeContext.Provider>
  );
};
