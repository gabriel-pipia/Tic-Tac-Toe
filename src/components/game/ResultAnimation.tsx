import { ThemedText } from '@/components/ui/Text';
import { ThemedView } from '@/components/ui/View';
import { useTheme } from '@/context/ThemeContext';
import { Layout } from '@/lib/constants/Layout';
import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeInDown, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withSpring, withTiming } from 'react-native-reanimated';

type ResultType = 'win' | 'loss' | 'draw';

const { width, height } = Dimensions.get('window');

const ConfettiParticle = ({ delay, x }: { delay: number, x: number }) => {
    const y = useSharedValue(-50);
    const rot = useSharedValue(0);
    const randomColor = React.useMemo(() => ['#f87171', '#fbbf24', '#34d399', '#60a5fa', '#818cf8', '#f472b6'][Math.floor(Math.random() * 6)], []);

    useEffect(() => {
        y.value = withDelay(delay, withTiming(height + 100, { duration: 2500, easing: Easing.linear }));
        rot.value = withRepeat(withTiming(360, { duration: 800 + Math.random() * 500 }), -1);
    }, [y, rot, delay, x]);

    const style = useAnimatedStyle(() => ({
        transform: [{ translateY: y.value }, { rotate: `${rot.value}deg` }, { rotateX: `${rot.value}deg` }],
        left: x,
        top: 0
    }));
    
    return <Animated.View style={[styles.particle, style, { backgroundColor: randomColor }]} />;
};

const Confetti = () => {
    const particles = React.useMemo(() => Array.from({ length: 40 }).map((_, i) => ({
        id: i,
        x: Math.random() * width,
        delay: Math.random() * 2000
    })), []);

    return (
        <ThemedView style={StyleSheet.absoluteFill} pointerEvents="none">
            {particles.map(p => <ConfettiParticle key={p.id} x={p.x} delay={p.delay} />)}
        </ThemedView>
    );
};

const ResultText = ({ type }: { type: ResultType }) => {
    let text = '';

    if (type === 'win') {
        text = 'VICTORY!';
    } else if (type === 'loss') {
        text = 'DEFEAT';
    } else {
        text = 'DRAW!';
    }

    return (
        <Animated.View entering={FadeInDown.delay(500)} style={styles.textContainer}>
            <ThemedText type="title" colorType='text' size="4xl" weight='bold'>
                {text}
            </ThemedText>
        </Animated.View>
    );
};

const BadgeContainer = ({ children }: { children: React.ReactNode }) => (
    <View style={styles.centerOverlay} pointerEvents="none">
        {children}
    </View>
);

const WinBadge = ({ colors }: { colors: any }) => {
    const scale = useSharedValue(0);

    useEffect(() => {
        scale.value = withSpring(1, { damping: 12, stiffness: 90 });
    }, [scale]);

    const style = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }]
    }));

    return (
        <BadgeContainer>
            <Animated.View style={[styles.glow, { backgroundColor: colors.primary }, style]} />
            <Animated.View style={[styles.badge, { backgroundColor: colors.background }, style]}>
                <ThemedText style={{ fontSize: 80, lineHeight: 90, textAlign: 'center' }}>🎉</ThemedText>
            </Animated.View>
        </BadgeContainer>
    );
};

const LossAnimation = ({ colors }: { colors: any }) => {
    const rot = useSharedValue(0);
    const scale = useSharedValue(0);

    useEffect(() => {
        scale.value = withSpring(1);
        rot.value = withSequence(
            withTiming(-10, { duration: 100 }),
            withRepeat(withTiming(10, { duration: 100 }), 5, true),
            withTiming(0, { duration: 100 })
        );
    }, [scale, rot]);

    const style = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rot.value}deg` }, { scale: scale.value }]
    }));

    return (
        <BadgeContainer>
            <Animated.View style={[styles.glow, { backgroundColor: colors.primary }, style]} />
             <Animated.View style={[styles.badge, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }, style]}>
                <ThemedText style={{ fontSize: 80, lineHeight: 90, textAlign: 'center' }}>😢</ThemedText>
             </Animated.View>
        </BadgeContainer>
    );
};

const DrawAnimation = ({ colors }: { colors: any }) => {
    const scale = useSharedValue(0);

    useEffect(() => {
        scale.value = withSpring(1);
    }, [scale]);

    const style = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }]
    }));

    return (
        <BadgeContainer>
            <Animated.View style={[styles.glow, { backgroundColor: colors.primary }, style]} />
            <Animated.View style={[styles.badge, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }, style]}>
                 <ThemedText style={{ fontSize: 80, lineHeight: 90, textAlign: 'center' }}>🤝</ThemedText>
            </Animated.View>
        </BadgeContainer>
    );
};

export default function ResultAnimation({ type }: { type: ResultType }) {
  const { colors } = useTheme();

  return (
      <ThemedView style={styles.container} pointerEvents="none">
        {type === 'win' && <Confetti />}
        
        {/* Helper view to center badges since they use absolute layouts */}
        <View style={StyleSheet.absoluteFill}>
            {type === 'win' && <WinBadge colors={colors} />}
            {type === 'loss' && <LossAnimation colors={colors} />}
            {type === 'draw' && <DrawAnimation colors={colors} />}
        </View>

        <ResultText type={type} />
      </ThemedView>
  );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
    },
    textContainer: {
        marginTop: 280,
        zIndex: 20,
    },
    centerOverlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
    },
    glow: {
        position: 'absolute',
        width: Layout.CONTAINER_WIDTH_PERCENT,
        maxWidth: Layout.MAX_CONTENT_WIDTH,
        borderRadius: Layout.borderRadius.full,
        aspectRatio: 1,
        opacity: 0.5,
    },
    badge: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        borderRadius: 9999,
        aspectRatio: 1,
    },
    particle: {
        position: 'absolute',
        width: 8,
        height: 8,
        borderRadius: 4,
    }
});
