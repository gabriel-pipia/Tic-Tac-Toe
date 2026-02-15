import { useTheme } from '@/context/ThemeContext';
import { BlurView } from 'expo-blur';
import { AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    Easing,
    Layout,
    runOnJS,
    SlideInUp,
    SlideOutUp,
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastConfig {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
    action?: {
        label: string;
        onPress: () => void;
    };
}

interface ToastProps {
    config: ToastConfig;
    onDismiss: (id: string) => void;
}



export default function Toast({ config, onDismiss }: ToastProps) {
    const { colors } = useTheme();
    
    // Auto dismiss
    useEffect(() => {
        if (config.duration === 0) return; // 0 = infinite
        const timer = setTimeout(() => {
            onDismiss(config.id);
        }, config.duration || 4000);
        return () => clearTimeout(timer);
    }, [config.id, config.duration, onDismiss]);

    // Icons
    const getIcon = () => {
        switch (config.type) {
            case 'success': return <CheckCircle size={24} color="#22c55e" />;
            case 'error': return <AlertCircle size={24} color="#ef4444" />;
            case 'warning': return <AlertTriangle size={24} color="#f59e0b" />;
            case 'info': return <Info size={24} color="#3b82f6" />;
        }
    };

    const getBorderColor = () => {
        switch (config.type) {
            case 'success': return '#22c55e';
            case 'error': return '#ef4444';
            case 'warning': return '#f59e0b';
            case 'info': return '#3b82f6';
        }
    };

    // Gestures
    const translateY = useSharedValue(0);
    const context = useSharedValue({ y: 0 });

    const pan = Gesture.Pan()
        .onStart(() => {
            context.value = { y: translateY.value };
        })
        .onUpdate((event) => {
            // Allow swiping up to dismiss
            if (event.translationY < 0) {
                translateY.value = event.translationY;
            } else {
                // Resistance when pulling down
                translateY.value = event.translationY * 0.2;
            }
        })
        .onEnd((event) => {
            if (event.translationY < -20) {
                runOnJS(onDismiss)(config.id);
            } else {
                translateY.value = withSpring(0);
            }
        });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    return (
        <GestureDetector gesture={pan}>
            <Animated.View 
                entering={SlideInUp.duration(500).easing(Easing.out(Easing.cubic))} 
                exiting={SlideOutUp.duration(400).easing(Easing.in(Easing.cubic))}
                layout={Layout.duration(500).easing(Easing.out(Easing.cubic))}
                style={[
                    styles.container, 
                    { 
                        backgroundColor: colors.background, // Fallback
                        borderColor: getBorderColor(),
                    },
                    animatedStyle
                ]}
            >
                {Platform.OS === 'ios' ? (
                    <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
                ) : (
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.sheetBg, opacity: 0.95 }]} />
                )}
                
                <View style={styles.contentContainer}>
                    <View style={styles.iconContainer}>
                        {getIcon()}
                    </View>
                    
                    <View style={styles.textContainer}>
                        <Text style={[styles.title, { color: colors.text }]}>{config.title}</Text>
                        {config.message && (
                            <Text style={[styles.message, { color: colors.subtext }]}>{config.message}</Text>
                        )}
                    </View>

                    {config.action && (
                         <Text 
                            onPress={config.action.onPress}
                            style={[styles.action, { color: colors.primary }]}
                         >
                            {config.action.label}
                         </Text>
                    )}
                </View>
                
                {/* Progress bar could go here */}
            </Animated.View>
        </GestureDetector>
    );
}

const styles = StyleSheet.create({
    container: {
        alignSelf: 'center',
        width: '90%',
        maxWidth: 400,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 16,
        overflow: 'hidden',
        borderLeftWidth: 4,
        zIndex: 9999,
        minHeight: 60,
        marginBottom: 8,
    },
    contentContainer: {
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 2,
    },
    message: {
        fontSize: 14,
        opacity: 0.9,
    },
    action: {
        fontWeight: 'bold',
        fontSize: 14,
        marginLeft: 8,
    }
});
