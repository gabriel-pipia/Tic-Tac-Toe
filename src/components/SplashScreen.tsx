import { ThemedText } from '@/components/Text';
import { useTheme } from '@/context/ThemeContext';
import { Image } from 'expo-image';
import * as ExpoSplashScreen from 'expo-splash-screen';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInUp, ZoomIn, runOnJS } from 'react-native-reanimated';

// Prevent auto hide
ExpoSplashScreen.preventAutoHideAsync();

interface SplashScreenProps {
  onFinish?: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const { colors } = useTheme();
  const [appIsReady, setAppIsReady] = useState(false);
  const [animationFinished, setAnimationFinished] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

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
    <View style={[styles.container, { backgroundColor: colors.background }]} onLayout={onLayoutRootView}>
      <Animated.View 
        entering={ZoomIn.duration(1000).springify().damping(12).mass(1)} 
        style={styles.logoContainer}
      >
        <Image
           source={require('../../assets/images/icon.png')}
           style={styles.logo}
           contentFit="contain"
        />
         <Animated.View entering={FadeInUp.delay(600).duration(800).springify().damping(12)}>
            <ThemedText type="title" size="3xl" weight="black" style={{ marginTop: 20 }}>TIC TAC TOE</ThemedText>
         </Animated.View>
         <Animated.View entering={FadeInUp.delay(900).duration(800).springify().damping(12)}>
            <ThemedText type="subtitle" size="lg" colorType="accent" align="center">Remastered</ThemedText>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999, 
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
});
