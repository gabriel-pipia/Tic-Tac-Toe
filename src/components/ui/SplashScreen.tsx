import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Layout } from '@/lib/constants/Layout';
import * as ExpoSplashScreen from 'expo-splash-screen';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown, ZoomIn, runOnJS } from 'react-native-reanimated';
import Logo from './Logo';
import { ThemedText } from './Text';
import { ThemedView } from './View';

// Prevent auto hide
ExpoSplashScreen.preventAutoHideAsync();

interface SplashScreenProps {
  onFinish?: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const { loading } = useAuth();
  const { colors } = useTheme();
  // appIsReady controls when we hide the NATIVE splash and show this JS splash
  const [appIsReady, setAppIsReady] = useState(false);
  // animationFinished controls when we unmount the JS splash
  const [animationFinished, setAnimationFinished] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // We can load fonts or other assets here if needed
        // For now just set ready immediately to show JS splash
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  // Ensure minimum display time for animations to complete naturally
  useEffect(() => {
      const timer = setTimeout(() => {
          setMinTimeElapsed(true);
      }, 2000); // Wait 2s for animations
      return () => clearTimeout(timer);
  }, []);

  // When app is ready (dependencies loaded) AND min time elapsed, finish
  useEffect(() => {
    if (!loading && minTimeElapsed && !animationFinished) {
        // Trigger exit
        // We can add an exit animation here if needed, or just callback
        // For now, let's delay slightly to be smooth
        const exitTimer = setTimeout(() => {
             setAnimationFinished(true);
             if (onFinish) {
                 runOnJS(onFinish)();
             }
        }, 500);
        return () => clearTimeout(exitTimer);
    }
  }, [loading, minTimeElapsed, animationFinished, onFinish]);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await ExpoSplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }
  
  if (animationFinished) {
      return null;
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]} onLayout={onLayoutRootView}>
      <Animated.View entering={ZoomIn.delay(200)} style={styles.logoSection}>
                          <ThemedView style={styles.logoContainer}>
                            <Logo variant="filled" size={100} />
                        </ThemedView>
                         <Animated.View entering={FadeInDown.delay(600).springify().easing(Easing.inOut(Easing.ease))} style={styles.logoTextContainer}>
                            <ThemedText type='title' size='3xl' weight='bold' colorType='text' align='center' style={{ width: "auto" }}>Tic Tac Toe</ThemedText>
                         <Animated.View entering={FadeInDown.delay(900).springify().easing(Easing.inOut(Easing.ease))} style={[styles.logoProText, { backgroundColor: colors.accent }]}>
                            <ThemedText type='subtitle' size='lg' weight='bold' colorType='white' align='center'>Pro Edition</ThemedText>
                         </Animated.View>
                         </Animated.View>
                      </Animated.View>

      {/* Invisible closer to trigger exit after a delay */}
      <Animated.View 
        entering={FadeIn.delay(2500).withCallback((finished) => {
            if (finished) {
                runOnJS(setAnimationFinished)(true);
                if (onFinish) runOnJS(onFinish)();
            }
        })}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999, 
  },
   logoSection: {
          marginBottom: 48,
          alignItems: 'center',
      },
      logoContainer: {
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: Layout.spacing.lg,
  },
      logoTextContainer: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    logoText: {
        alignItems: 'center',
        justifyContent: 'center',
  },
    logoProText: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
        paddingVertical: 2,
        borderRadius: 10,
    },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
});
