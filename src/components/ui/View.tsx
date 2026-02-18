import { BlurView } from 'expo-blur';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/context/ThemeContext';

import { ThemedViewProps } from '@/types/theme';

export function ThemedView({
  style,
  themed,
  scroll,
  blur,
  keyboardAvoiding,
  safe,
  edges,
  keyboardOffset,
  intensity,
  tint,
  children,
  ...otherProps
}: ThemedViewProps) {
  const {colors} = useTheme()
  
  // Only apply background color if 'themed' is explicitly true
  const baseStyle = themed ? [{ backgroundColor: colors.background }, style] : style;

  let content = (
    <View style={baseStyle} {...otherProps}>
      {children}
    </View>
  );

  if (scroll) {
    content = (
      <ScrollView
        style={baseStyle}
        contentContainerStyle={otherProps.contentContainerStyle}
        {...otherProps}
      >
        {children}
      </ScrollView>
    );
  } else if (blur) {
    content = (
      <BlurView
        style={style} 
        intensity={intensity}
        tint={tint}
        experimentalBlurMethod="dimezisBlurView"
        {...otherProps}
      >
        {children}
      </BlurView>
    );
  }

  // Wrappers
  if (keyboardAvoiding) {
    content = (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={keyboardOffset}
        style={{ flex: 1 }} 
      >
        {content}
      </KeyboardAvoidingView>
    );
  }

  if (safe) {
    content = (
      <SafeAreaView style={[{ flex: 1 }, themed && { backgroundColor: colors.background }]} edges={edges}>
        {content}
      </SafeAreaView>
    );
  }

  return content;
}
