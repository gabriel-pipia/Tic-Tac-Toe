import { ThemedText } from '@/components/ui/Text';
import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, { Keyframe, ZoomOut } from 'react-native-reanimated';

interface ReactionDisplayProps {
    emoji: string | null;
}

const PopIn = new Keyframe({
    from: {
        transform: [{ scale: 0 }, { translateY: 0 }, { rotate: '0deg' }],
        opacity: 0,
    },
    20: {
         transform: [{ scale: 1.5 }, { translateY: -20 }, { rotate: '-15deg' }],
         opacity: 1,
    },
    40: {
         transform: [{ scale: 0.8 }, { translateY: 10 }, { rotate: '15deg' }],
    },
    60: {
         transform: [{ scale: 1.2 }, { translateY: -5 }, { rotate: '-5deg' }],
    },
    80: {
         transform: [{ scale: 0.95 }, { translateY: 2 }, { rotate: '5deg' }],
    },
    to: {
        transform: [{ scale: 1 }, { translateY: 0 }, { rotate: '0deg' }],
        opacity: 1,
    },
});

export default function ReactionDisplay({ emoji }: ReactionDisplayProps) {
    if (!emoji) return null;

    return (
        <Animated.View 
            entering={PopIn.duration(500)} 
            exiting={ZoomOut.duration(300)} 
            style={styles.container}
        >
            <ThemedText style={{ fontSize: 80, lineHeight: 100, textAlign: 'center', width: 120, height: 120 }}>{emoji}</ThemedText>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        right: 0,
        left: 0, 
        aspectRatio: 1/1,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        overflow: 'visible',
        pointerEvents: 'none', // Allow clicks to pass through if needed
    }
});
