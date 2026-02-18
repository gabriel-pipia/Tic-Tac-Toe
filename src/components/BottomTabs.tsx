
import { ThemedView } from '@/components/ui/View';
import { useTheme } from '@/context/ThemeContext';
import { Layout } from '@/lib/constants/Layout';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Gamepad2, ScanLine, User, X } from 'lucide-react-native';
import { StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { Easing, useAnimatedStyle, withTiming } from 'react-native-reanimated';

const ANIM_DURATION = 150;
const ANIM_EASING = Easing.bezier(0.33, 1, 0.68, 1); // Premium ease-out expo-like curve
const ICON_SPRING_EASING = Easing.out(Easing.back(1.5));

function AnimatedTabBackground({ isFocused, colors }: any) {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isFocused ? 1 : 0, { duration: ANIM_DURATION, easing: ANIM_EASING }),
      transform: [
        { scale: withTiming(isFocused ? 1 : 0.8, { duration: ANIM_DURATION, easing: ANIM_EASING }) }
      ]
    };
  });

  return (
    <Animated.View 
      style={[
        StyleSheet.absoluteFill,
        { 
          backgroundColor: `${colors.accent}2A`,
          borderRadius: Layout.borderRadius.full,
          zIndex: -1
        },
        animatedStyle
      ]} 
    />
  );
}

function AnimatedTabIcon({ IconComponent, isFocused, size, color, strokeWidth, shouldRotate }: any) {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: withTiming(isFocused ? 1.15 : 1, { duration: ANIM_DURATION, easing: ICON_SPRING_EASING }) },
        { rotate: shouldRotate ? withTiming(isFocused ? '90deg' : '0deg', { duration: ANIM_DURATION, easing: ICON_SPRING_EASING }) : '0deg' }
      ],
    };
  });

  return (
    <Animated.View style={animatedStyle}>
      <IconComponent size={size} color={color} strokeWidth={strokeWidth} />
    </Animated.View>
  );
}

export default function BottomTabs({ state, descriptors, navigation }: BottomTabBarProps) {
  const {  colors } = useTheme();

  return (
    <ThemedView 
      themed
      style={{
        position: 'absolute',
        bottom: Layout.tabBar.bottomOffset,
        left: '50%',
        transform: [{ translateX: "-50%" }],
        width: Layout.tabBar.width,
        maxWidth: Layout.MAX_CONTENT_WIDTH,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        padding: Layout.spacing.sm,
        borderRadius: Layout.borderRadius.full,
        height: Layout.tabBar.height,
        overflow: 'hidden',
        borderColor: colors.border,
        backgroundColor: colors.background
      }}
    >

        <ThemedView style={styles.tabContainer}>
            {state.routes.map((route, index) => {
              const { options } = descriptors[route.key];
              const isFocused = state.index === index;

              const onPress = () => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });

                if (isFocused && route.name === 'scan') {
                  navigation.navigate('index' as any);
                  return;
                }

                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name, route.params);
                }
              };

              // Map route names to icons
              let IconComponent = Gamepad2;
              let size = 26;
              let strokeWidth = 2.5;
              let shouldRotate = false;
              let customColor = isFocused ? colors.accent : colors.subtext;

              if (route.name === 'index') IconComponent = Gamepad2;
              else if (route.name === 'scan') {
                  IconComponent = isFocused ? X : ScanLine;
                  size = 28;
                  shouldRotate = true;
                  customColor = isFocused ? colors.error : colors.subtext; // Red X when open
              }
              else if (route.name === 'profile') IconComponent = User;

              return (
                <TouchableOpacity
                  key={index}
                  accessibilityRole="button"
                  accessibilityState={isFocused ? { selected: true } : {}}
                  accessibilityLabel={options.tabBarAccessibilityLabel}
                  onPress={onPress}
                  style={styles.tabButton}
                >
                  
                  <AnimatedTabBackground isFocused={isFocused} colors={colors} />
                  
                  <AnimatedTabIcon 
                      IconComponent={IconComponent}
                      isFocused={isFocused}
                      size={size}
                      color={customColor}
                      strokeWidth={strokeWidth}
                      shouldRotate={shouldRotate}
                  />

                </TouchableOpacity>
              );
            })}
        </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    width: '100%',
    height: '100%',
    gap: 16,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderRadius: 9999,
  },
});
