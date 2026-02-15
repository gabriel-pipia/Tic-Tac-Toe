
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { GameProvider } from '@/context/GameContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { UIProvider } from '@/context/UIContext';
import { DarkTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import SplashScreen from '../components/SplashScreen';
import '../global.css';

function InitialLayout() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { colors } = useTheme();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';

    if (!session && !inAuthGroup && !inOnboarding) {
      router.replace('/onboarding');
    } else if (session && (inAuthGroup || inOnboarding)) {
      router.replace('/(tabs)');
    }
  }, [session, loading, segments, router]);

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
      <Stack screenOptions={{ 
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_bottom',
      }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="game/[id]"/>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="index"/>
        <Stack.Screen name="onboarding/index"/>
      </Stack>
    </NavThemeProvider>
  );
}

export default function RootLayout() {
  const [splashFinished, setSplashFinished] = React.useState(false);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#0F172A' }}>
      <ThemeProvider>
        <UIProvider>
          <AuthProvider>
            <GameProvider>
              {!splashFinished && (
                 <SplashScreen onFinish={() => setSplashFinished(true)} />
              )}
              <InitialLayout />
              <StatusBar style="light" />
            </GameProvider>
          </AuthProvider>
        </UIProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
