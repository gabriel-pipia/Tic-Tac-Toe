import { BlurView, BlurViewProps } from 'expo-blur';
import { KeyboardAvoidingView, Platform, ScrollView, ScrollViewProps, View, ViewProps } from 'react-native';
import { type Edge, SafeAreaView, SafeAreaViewProps } from 'react-native-safe-area-context';

import { useTheme } from '@/context/ThemeContext';

export type ThemedViewProps = ViewProps & ScrollViewProps & BlurViewProps & SafeAreaViewProps & {
  themed?: boolean;
  scroll?: boolean;
  blur?: boolean;
  keyboardAvoiding?: boolean;
  safe?: boolean;
  edges?: readonly Edge[];
  keyboardOffset?: number;
};

export function ThemedView({
  style,
  themed,
  scroll,
  blur,
  keyboardAvoiding,
  safe,
  edges,
  keyboardOffset,
  className,
  intensity,
  tint,
  children,
  ...otherProps
}: ThemedViewProps) {
  const {colors} = useTheme()
  
  // Only apply background color if 'themed' is explicitly true
  const baseStyle = themed ? [{ backgroundColor: colors.background }, style] : style;

  let content = (
    <View style={baseStyle} className={className} {...otherProps}>
      {children}
    </View>
  );

  if (scroll) {
    content = (
      <ScrollView
        style={baseStyle}
        className={className}
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
        className={className}
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
      <SafeAreaView style={[{ flex: 1 }, themed && { backgroundColor: colors.background }]} edges={edges} className={className}>
        {content}
      </SafeAreaView>
    );
  }

  return content;
}
