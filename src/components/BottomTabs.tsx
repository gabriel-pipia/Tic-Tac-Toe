import { Layout } from '@/constants/Layout';
import { useTheme } from '@/context/ThemeContext';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Gamepad2, ScanLine, User, X } from 'lucide-react-native';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { ThemedView } from './View';

function AnimatedTabBackground({ isFocused, colors }: any) {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withSpring(isFocused ? 1 : 0, { damping: 20, stiffness: 150 }),
      transform: [
        { scale: withSpring(isFocused ? 1 : 0.8, { damping: 15, stiffness: 120 }) }
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
        { scale: withSpring(isFocused ? 1.1 : 1, { damping: 10, stiffness: 100 }) },
        { rotate: shouldRotate ? withSpring(isFocused ? '90deg' : '0deg', { damping: 15, stiffness: 200 }) : '0deg' }
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

        <View className="flex-row items-stretch justify-between w-full h-full gap-4">
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

              const onLongPress = () => {
                navigation.emit({
                  type: 'tabLongPress',
                  target: route.key,
                });
              };

              // Icon Logic
              let IconComponent = Gamepad2;
              if (route.name === 'scan') IconComponent = isFocused ? X : ScanLine;
              if (route.name === 'profile') IconComponent = User;
              
              const size = route.name === 'scan' ? 32 : 30;
              const color = isFocused ? colors.accent : colors.subtext;
              const strokeWidth = isFocused ? 3 : 2;

              if (route.name === 'scan') {
                return (
                    <TouchableOpacity
                      activeOpacity={0.9}
                            key={route.key}
                            accessibilityRole="button"
                            accessibilityState={isFocused ? { selected: true } : {}}
                            accessibilityLabel={options.tabBarAccessibilityLabel}
                            testID={(options as any).tabBarTestID}
                            onPress={onPress}
                            onLongPress={onLongPress}
                            style={{
                              flex: 1,
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: Layout.borderRadius.full,
                              backgroundColor: colors.accent,
                              position: 'relative',
                              overflow: 'hidden'
                            }}
                        >
                    <AnimatedTabIcon 
                      IconComponent={IconComponent} 
                      isFocused={isFocused} 
                      size={36} 
                      color={colors.white} 
                      strokeWidth={3} 
                      shouldRotate={true}
                    />
                        </TouchableOpacity>
                  )
              }

              return (
                <TouchableOpacity
                  activeOpacity={0.9}
                  key={route.key}
                  accessibilityRole="button"
                  accessibilityState={isFocused ? { selected: true } : {}}
                  accessibilityLabel={options.tabBarAccessibilityLabel}
                  testID={(options as any).tabBarTestID}
                  onPress={onPress}
                  onLongPress={onLongPress}
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: Layout.borderRadius.full,
                    position: 'relative'
                  }}
                >
                  <AnimatedTabBackground isFocused={isFocused} colors={colors} />
                  <AnimatedTabIcon 
                    IconComponent={IconComponent} 
                    isFocused={isFocused} 
                    size={size} 
                    color={color} 
                    strokeWidth={strokeWidth} 
                    shouldRotate={false}
                  />
                </TouchableOpacity>
              );
            })}
        </View>
    </ThemedView>
  );
}
