
import SplashScreen from '@/components/ui/SplashScreen';
import { AuthProvider } from '@/context/AuthContext';
import { GameProvider } from '@/context/GameContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { UIProvider } from '@/context/UIProvider';
import { DarkTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

function InitialLayout() {
  const { colors, isDark } = useTheme();

  const navigationTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: colors.background,
      card: colors.background,
      border: colors.border,
    },
  };

  return (
    <NavThemeProvider value={navigationTheme}>
      <GameProvider>
        <Stack screenOptions={{ 
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: 'slide_from_bottom',
        }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="game/[id]"/>
            <Stack.Screen name="index"/>
        </Stack>
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </GameProvider>
    </NavThemeProvider>
  );
}

export default function RootLayout() {
  const [splashFinished, setSplashFinished] = React.useState(false);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#0F172A' }}>
      <ThemeProvider>
        <AuthProvider>
          <UIProvider>
            {!splashFinished ? (
                <SplashScreen onFinish={() => setSplashFinished(true)} />
            ) : (
                <InitialLayout />
            )}
          </UIProvider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
