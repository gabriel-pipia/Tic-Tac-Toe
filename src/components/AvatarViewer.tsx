import Button from '@/components/ui/Button';
import { useTheme } from '@/context/ThemeContext';
import { Layout } from '@/lib/constants/Layout';
import { X } from 'lucide-react-native';
import React from 'react';
import { Image, Modal, StatusBar, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    SlideInDown,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from 'react-native-reanimated';

interface AvatarViewerProps {
    visible: boolean;
    url: string | null;
    onClose: () => void;
}

export default function AvatarViewer({ visible, url, onClose }: AvatarViewerProps) {
    const translateY = useSharedValue(0);
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);
    const {colors} = useTheme()

    React.useEffect(() => {
        if (visible) {
            translateY.value = 0;
            scale.value = 1;
            opacity.value = 1;
        }
    }, [visible, translateY, scale, opacity]);

    const handleClose = () => {
        'worklet';
        // Animate out downwards (default close behavior)
        translateY.value = withTiming(Layout.window.height, { duration: 250 }, () => {
            runOnJS(onClose)();
        });
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: translateY.value },
            { scale: scale.value }
        ]
    }));

    const bgStyle = useAnimatedStyle(() => ({
        opacity: opacity.value
    }));

    const tap = Gesture.Tap().onEnd(() => {
        handleClose();
    });

    const pan = Gesture.Pan()
        .onChange((event) => {
            translateY.value = event.translationY;
            
            // Interactive scale and opacity
            // We use standard window height for reference
            const dragProgress = Math.abs(event.translationY) / (Layout.window.height);
            scale.value = 1 - (dragProgress * 0.2); // max scale down to 0.8
            opacity.value = 1 - (dragProgress * 0.5); // min opacity 0.5
        })
        .onEnd((event) => {
             // Velocity check or distance check
            if (Math.abs(event.translationY) > 100 || Math.abs(event.velocityY) > 800) {
                 const isSwipingUp = event.translationY < 0;
                 const targetY = isSwipingUp ? -Layout.window.height : Layout.window.height;
                 
                 translateY.value = withTiming(targetY, { duration: 250 }, () => {
                     runOnJS(onClose)();
                 });
            } else {
                translateY.value = withSpring(0);
                scale.value = withSpring(1);
                opacity.value = withSpring(1);
            }
        });

    if (!url) return null;

    // We wrapper handleClose in a non-worklet for the props that need it (onPress, onRequestClose)
    const onManualClose = () => {
        translateY.value = withTiming(Layout.window.height, { duration: 250 }, () => {
            runOnJS(onClose)();
        });
    };

    return (
        <Modal 
            visible={visible} 
            transparent={true} 
            animationType="fade" 
            onRequestClose={onManualClose} 
            statusBarTranslucent 
            presentationStyle="overFullScreen"
            hardwareAccelerated
        >
            <StatusBar hidden />
            <GestureHandlerRootView style={{ flex: 1 }}>
                <View style={styles.container}>
                    {/* Blurred Background with Fade Animation */}
                    <Animated.View style={[StyleSheet.absoluteFill, bgStyle]}>
                         <Image source={{ uri: url }} style={[StyleSheet.absoluteFill, { opacity: 0.8 }]} blurRadius={50} />
                         <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)' }]} />
                    </Animated.View>

                    {/* Tap background to close */}
                    <GestureDetector gesture={tap}>
                        <View style={StyleSheet.absoluteFill} />
                    </GestureDetector>

                    {/* Main Image with Pan Gesture */}
                    <GestureDetector gesture={pan}>
                         <Animated.View 
                            entering={SlideInDown.springify()} 
                            // Removed SlidOutDown to avoid conflict with manual gesture exit
                            style={styles.imageWrapper}
                         >
                            <Animated.View style={[styles.innerContainer, animatedStyle]}>
                                <Image source={{ uri: url }} style={styles.image} resizeMode="contain" />
                            </Animated.View>
                        </Animated.View>
                    </GestureDetector>

                    <Button onPress={onManualClose} icon={<X size={24} color={colors.text} />} type='icon' variant='secondary' size='sm' style={styles.closeButton}/>
                </View>
            </GestureHandlerRootView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
    },
    imageWrapper: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    innerContainer: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    image: {
        width: Layout.window.width,
        height: Layout.window.height * 0.8,
    },
    closeButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 50,
    },
});
