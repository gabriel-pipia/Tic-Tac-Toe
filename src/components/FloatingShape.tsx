import React, { useEffect } from "react";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSpring, withTiming } from "react-native-reanimated";

interface FloatingShapeProps {
    children: React.ReactNode;
    delay?: number;
    initialX: number;
    initialY: number;
    depth?: number;
    sensor: any;
    initialRotation?: number;
    direction?: number;
    duration?: number;
    opacity?: number;
    sensorMultiplier?: number;
}

export default function FloatingShape({ 
    children, 
    delay = 0, 
    initialX, 
    initialY, 
    depth = 1, 
    sensor, 
    initialRotation = 0, 
    direction = 1, 
    duration = 30000, 
    opacity = 0.1,
    sensorMultiplier = 5
}: FloatingShapeProps) {
    const rotate = useSharedValue(initialRotation);

    useEffect(() => {
        rotate.value = withDelay(delay, withRepeat(
            withTiming(initialRotation + (360 * direction), { 
                duration: duration, 
                easing: Easing.inOut(Easing.quad) 
            }),
            -1,
            false 
        ));
    }, [delay, rotate, initialRotation, direction, duration]);

    const style = useAnimatedStyle(() => {
        const { x, y } = sensor.sensor.value;
        const parallaxX = withSpring(x * depth * sensorMultiplier);
        const parallaxY = withSpring(y * depth * sensorMultiplier);

        const scale = Math.max(0.2, 0.5 + Math.abs(depth) * 0.3);

        return {
            transform: [
                { translateX: parallaxX },
                { translateY: parallaxY },
                { rotate: `${rotate.value}deg` },
                { scale: scale }
            ],
            position: 'absolute',
            left: initialX,
            top: initialY,
            opacity: opacity
        };
    });

    return <Animated.View style={style}>{children}</Animated.View>;
};
