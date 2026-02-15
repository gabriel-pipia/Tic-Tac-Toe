import { Layout } from '@/constants/Layout';
import { useTheme } from '@/context/ThemeContext';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, KeyboardAvoidingView, Modal, Platform, Pressable, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
    Extrapolation,
    interpolate,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from 'react-native-reanimated';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  height?: number | string;
};

export default function BottomSheet({ visible, onClose, children, height = 'auto' }: BottomSheetProps) {
  const { width: windowWidth } = useWindowDimensions();
  const isLargeScreen = windowWidth > Layout.MAX_CONTENT_WIDTH + 48;
  const { colors } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const context = useSharedValue({ y: 0 });
  
  // Track previous visibility to detect changes
  const prevVisible = useRef(visible);

  const closeSheet = useCallback(() => {
    'worklet';
    translateY.value = withTiming(SCREEN_HEIGHT, { duration: 300 }, (finished: boolean | undefined) => {
      if (finished) {
        runOnJS(setIsVisible)(false);
        runOnJS(onClose)();
      }
    });
  }, [onClose, translateY]);

  const openSheet = useCallback(() => {
    'worklet';
    translateY.value = withSpring(0, { damping: 60, stiffness: 200 });
  }, [translateY]);

  // Effect to handle visibility changes
  useEffect(() => {
    if (visible && !prevVisible.current) {
      // Opening
      setIsVisible(true);
      translateY.value = SCREEN_HEIGHT;
      requestAnimationFrame(() => {
          openSheet();
      });
    } else if (!visible && prevVisible.current) {
      // Closing
      // If we are already visible, animate out
      if (isVisible) {
         closeSheet();
      }
    }
    prevVisible.current = visible;
  }, [visible, isVisible, openSheet, closeSheet, translateY]);

  // Initial mount check
  useEffect(() => {
      if (visible && !isVisible) {
          setIsVisible(true);
          translateY.value = SCREEN_HEIGHT;
          requestAnimationFrame(() => openSheet());
          prevVisible.current = true;
      }
  }, [visible, isVisible, openSheet, translateY]);
  
  const gesture = Gesture.Pan()
    .onStart(() => {
      context.value = { y: translateY.value };
    })
    .onUpdate((event) => {
      translateY.value = Math.max(event.translationY + context.value.y, 0);
    })
    .onEnd(() => {
      if (translateY.value > SCREEN_HEIGHT / 5) {
        closeSheet();
      } else {
        openSheet();
      }
    });

  const rBottomSheetStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const rBackdropStyle = useAnimatedStyle(() => {
      const opacity = interpolate(
          translateY.value,
          [0, SCREEN_HEIGHT * 0.6], 
          [1, 0],
          Extrapolation.CLAMP
      );
      return {
          opacity: opacity,
      };
  });

  if (!isVisible) return null;

  return (
    <Modal transparent visible={isVisible} onRequestClose={() => closeSheet()} animationType="none" statusBarTranslucent>
        <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View 
                    style={{ 
                        flex: 1, 
                        justifyContent: isLargeScreen ? 'center' : 'flex-end',
                        alignItems: 'center'
                    }} 
                    pointerEvents="box-none"
                > 
            <Pressable
              style={[
                {
                  position: 'absolute',
                  inset: 0,
                }]}
              onPress={() => closeSheet()}>
                        <Animated.View 
                            style={[
                                {
                                    position: 'absolute',
                                    inset: 0,
                                    backgroundColor: 'rgba(0,0,0,0.6)',
                                },
                                rBackdropStyle
                            ]} 
                        />
                    </Pressable>
                    
                    <GestureDetector gesture={gesture}>
                        <Animated.View 
                            className="shadow-lg shadow-black/30"
                            style={[
                                rBottomSheetStyle,
                                { 
                                    backgroundColor: colors.background,
                                    width: isLargeScreen ? Layout.MAX_CONTENT_WIDTH : '100%',
                                    borderRadius: isLargeScreen ? 32 : 0,
                                    borderTopLeftRadius: 32,
                                    borderTopRightRadius: 32,
                                    overflow: 'hidden',
                                    paddingBottom: isLargeScreen ? 12 : 32,
                                },
                                height !== 'auto' ? { height: height as any } : { maxHeight: '90%' }
                            ]}
                        >
                            {/* Handle / Header */}
                            <View className="w-full items-center justify-center pt-4 pb-0">
                                
                                {!isLargeScreen && (
                                    <View 
                                        className="w-[40px] h-[4px] rounded-full" 
                                        style={{ backgroundColor: colors.separator }}
                                    />
                                )}
                                
                            </View>

                            <View className="w-full" onStartShouldSetResponder={() => true}>
                                {children}
                            </View>
                        </Animated.View>
                    </GestureDetector>
                </View>
            </KeyboardAvoidingView>
        </GestureHandlerRootView>
    </Modal>
  );
}
