import { useTheme } from '@/context/ThemeContext';
import { Layout } from '@/lib/constants/Layout';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, Keyboard, Modal, Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
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
  scrollable?: boolean;
  overlay?: React.ReactNode;
};

export default function BottomSheet({ visible, onClose, children, height = 'auto', scrollable = false, overlay }: BottomSheetProps) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isLargeScreen = windowWidth > Layout.MAX_CONTENT_WIDTH + 48;
  const { colors } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const context = useSharedValue({ y: 0 });
  const scrollOffset = useSharedValue(0);
  const keyboardOffset = useSharedValue(0);

  // Resolve height to absolute pixels
  const isAutoHeight = height === 'auto';
  const resolvedHeight = (() => {
    if (isAutoHeight) return undefined;
    if (typeof height === 'string' && height.endsWith('%')) {
      return windowHeight * (parseFloat(height) / 100);
    }
    return height as number;
  })();

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
      setIsVisible(true);
      translateY.value = SCREEN_HEIGHT;
      scrollOffset.value = 0;
      requestAnimationFrame(() => {
          openSheet();
      });
    } else if (!visible && prevVisible.current) {
      if (isVisible) {
         closeSheet();
      }
    }
    prevVisible.current = visible;
  }, [visible, isVisible, openSheet, closeSheet, translateY, scrollOffset]);

  // Initial mount check
  useEffect(() => {
      if (visible && !isVisible) {
          setIsVisible(true);
          translateY.value = SCREEN_HEIGHT;
          requestAnimationFrame(() => openSheet());
          prevVisible.current = true;
      }
  }, [visible, isVisible, openSheet, translateY]);

  // Keyboard handling — listen for keyboard show/hide and animate bottom offset
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      keyboardOffset.value = withTiming(e.endCoordinates.height, { duration: e.duration || 250 });
    });

    const hideSub = Keyboard.addListener(hideEvent, (e) => {
      keyboardOffset.value = withTiming(0, { duration: (e && e.duration) || 250 });
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [keyboardOffset]);

  // Track scroll position for scrollable mode
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollOffset.value = event.contentOffset.y;
    },
  });

  // Native gesture for the ScrollView — allows simultaneous handling
  const nativeScrollGesture = Gesture.Native();

  const panGesture = Gesture.Pan()
    .onStart(() => {
      context.value = { y: translateY.value };
    })
    .onUpdate((event) => {
      // In scrollable mode: only drag sheet when scroll is at the top AND dragging down
      // In non-scrollable mode: always allow dragging down
      const canDrag = scrollable
        ? (scrollOffset.value <= 0 && event.translationY > 0) || translateY.value > 0
        : event.translationY > 0 || translateY.value > 0;

      if (canDrag) {
        translateY.value = Math.max(event.translationY + context.value.y, 0);
      }
    })
    .onEnd(() => {
      if (translateY.value > SCREEN_HEIGHT / 5) {
        closeSheet();
      } else {
        openSheet();
      }
    });

  // In scrollable mode, make pan and scroll work together
  if (scrollable) {
    panGesture.simultaneousWithExternalGesture(nativeScrollGesture);
  } else {
    // Non-scrollable: simple offset-based activation
    panGesture.activeOffsetY(10);
    panGesture.failOffsetY(-10);
  }

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

  const rKeyboardStyle = useAnimatedStyle(() => {
    return {
      marginBottom: keyboardOffset.value,
    };
  });

  if (!isVisible) return null;

  // Build the sheet size style
  const sheetSizeStyle = resolvedHeight
    ? { height: resolvedHeight }
    : { maxHeight: windowHeight * 0.9 };

  const contentView = scrollable ? (
    <GestureDetector gesture={nativeScrollGesture}>
      <Animated.ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        style={[
          styles.contentContainer,
          resolvedHeight ? { flex: 1 } : null,
        ]}
      >
        {children}
      </Animated.ScrollView>
    </GestureDetector>
  ) : (
    <View 
      style={[
        styles.contentContainer,
        resolvedHeight ? { flex: 1 } : null,
      ]} 
      onStartShouldSetResponder={() => true}
    >
      {children}
    </View>
  );

  return (
    <Modal transparent visible={isVisible} onRequestClose={() => closeSheet()} animationType="none" statusBarTranslucent>
        <GestureHandlerRootView style={{ flex: 1 }}>
                <View style={styles.fullScreen} pointerEvents="box-none">
                    {/* Backdrop */}
                    <Pressable
                      style={styles.backdrop}
                      onPress={() => closeSheet()}
                    >
                        <Animated.View 
                            style={[
                                styles.backdrop,
                                { backgroundColor: 'rgba(0,0,0,0.6)' },
                                rBackdropStyle
                            ]} 
                        />
                    </Pressable>
                    
                    {/* Sheet sizing wrapper */}
                    <Animated.View 
                      style={[
                        isLargeScreen 
                          ? styles.sheetWrapperDesktop 
                          : styles.sheetWrapperMobile,
                        sheetSizeStyle,
                        rKeyboardStyle,
                      ]}
                      pointerEvents="box-none"
                    >
                      <GestureDetector gesture={panGesture}>
                          <Animated.View 
                              style={[
                                  styles.bottomSheet,
                                  rBottomSheetStyle,
                                  { 
                                      backgroundColor: colors.background,
                                      width: isLargeScreen ? Layout.MAX_CONTENT_WIDTH : '100%',
                                      borderRadius: isLargeScreen ? 32 : 0,
                                      borderTopLeftRadius: 32,
                                      borderTopRightRadius: 32,
                                      paddingBottom: isLargeScreen ? 12 : 32,
                                      alignSelf: 'center',
                                  },
                                  resolvedHeight ? { flex: 1 } : null,
                              ]}
                          >
                              {/* Handle */}
                              <View style={styles.handleContainer}>
                                  {!isLargeScreen && (
                                      <View 
                                          style={[styles.handle, { backgroundColor: colors.separator }]}
                                      />
                                  )}
                              </View>

                              {/* Content */}
                              {contentView}
                          </Animated.View>
                      </GestureDetector>
                    </Animated.View>
                </View>
            {/* Overlay (e.g. toasts) — rendered inside the Modal so it appears above the sheet */}
            {overlay}
        </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
    fullScreen: {
        flex: 1,
    },
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    sheetWrapperMobile: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    sheetWrapperDesktop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bottomSheet: {
        overflow: 'hidden',
    },
    handleContainer: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 12,
        paddingBottom: 8,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 9999,
    },
    contentContainer: {
        width: '100%',
    }
});
