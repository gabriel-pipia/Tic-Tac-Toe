import Button from '@/components/ui/Button';
import FloatingShape from '@/components/ui/FloatingShape';
import { ThemedText } from '@/components/ui/Text';
import { ThemedView } from '@/components/ui/View';
import { useTheme } from '@/context/ThemeContext';
import { Layout } from '@/lib/constants/Layout';
import { useRouter } from 'expo-router';
import { Ghost } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown, SensorType, useAnimatedSensor } from 'react-native-reanimated';

export default function NotFoundScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  
  // Use gravity sensor for parallax effect on background elements
  const sensor = useAnimatedSensor(SensorType.GRAVITY, { interval: 20 });

  // Calculate dynamic positions based on current window dimensions
  const shapes = useMemo(() => [
    {
        Emoji: "❌",
        size: 120,
        color: colors.subtext,
        initialX: width * 0.15,
        initialY: height * 0.25,
        depth: 2,
        direction: -1,
        duration: 25000,
        opacity: 0.1
    },
    {
        Emoji: "⭕",
        size: 100,
        color: colors.accent,
        initialX: width * 0.7,
        initialY: height * 0.6,
        depth: 3,
        direction: 1,
        duration: 30000,
        opacity: 0.1,
        strokeWidth: 2.5
    },
    {
        Emoji: "👻",
        size: 80,
        initialX: width * 0.2,
        initialY: height * 0.7,
        depth: 1.5,
        direction: 1,
        duration: 20000,
        opacity: 0.2
    },
    {
        Emoji: "🛸",
        size: 100,
        initialX: width * 0.8,
        initialY: height * 0.8,
        depth: 2.5,
        direction: -1,
        duration: 28000,
        opacity: 0.3
    },
    {
        Emoji: "👩‍🚀",
        size: 60,
        initialX: width * 0.5,
        initialY: height * 0.1,
        depth: 4,
        direction: 1,
        duration: 35000,
        opacity: 0.4
    },
    {
        Emoji: "🪐",
        size: 120,
        initialX: width * 0.1,
        initialY: height * 0.9,
        depth: 1,
        direction: -1,
        duration: 40000,
        opacity: 0.2
    },
    {
        Emoji: "💫",
        size: 70,
        initialX: width * 0.9,
        initialY: height * 0.4,
        depth: 3,
        direction: 1,
        duration: 22000,
        opacity: 0.3
    }
  ], [width, height, colors]);

  return (
    <>
      <ThemedView style={styles.container} safe>
        
        {/* Background Floating Shapes */}
        {shapes.map((shape, index) => (
            <FloatingShape 
                key={index}
                initialX={shape.initialX} 
                initialY={shape.initialY} 
                depth={shape.depth} 
                sensor={sensor} 
                direction={shape.direction}
                duration={shape.duration}
                opacity={shape.opacity}
            >
                {shape.Emoji ? (
                    <ThemedText style={{ fontSize: shape.size }}>{shape.Emoji}</ThemedText>
                ) : (
                    // @ts-ignore
                    <shape.Icon 
                        size={shape.size} 
                        color={shape.color} 
                        strokeWidth={shape.strokeWidth}
                    />
                )}
            </FloatingShape>
        ))}

        {/* Main Content */}
        <Animated.View 
            entering={FadeInDown.delay(300).springify()} 
            style={[styles.contentContainer, { backgroundColor: colors.card + 'CC' }]}
        >
            <View style={styles.iconContainer}>
                 <ThemedText style={{ fontSize: 100, lineHeight: 110, textAlign: 'center' }}>🤔</ThemedText>
            </View>
            
            <ThemedText type="title" align="center" colorType='text' size='3xl'>404 Out of Bounds!</ThemedText>
            
            <ThemedText align="center" colorType='subtext' size='lg'>
              This square is already taken... by the void. The page you&apos;re looking for doesn&apos;t exist on this board.
            </ThemedText>
            
            <Button 
                title="Return to Base" 
                onPress={() => router.replace('/')} 
                variant="primary"
                size="lg"
                style={{ minWidth: "100%"}}
                icon={<Ghost size={24} color={colors.white} />} 
            />
        </Animated.View>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  contentContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: "auto",
    padding: Layout.spacing.lg,
    width: Layout.CONTAINER_WIDTH_PERCENT,
    maxWidth: Layout.MAX_CONTENT_WIDTH,
    borderRadius: Layout.borderRadius.xxl,
    backdropFilter: 'blur(10px)',
    gap: Layout.spacing.lg,
  },
  iconContainer: {
    marginBottom: 24,
    position: 'relative',
  },
});
