
import { useTheme } from '@/context/ThemeContext';
import React from 'react';
import { StyleSheet, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { ThemedText } from './Text';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export default function Input({ 
  label, 
  error, 
  containerStyle, 
  leftIcon,
  rightIcon,
  onFocus,
  onBlur,
  ...props 
}: InputProps) {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = React.useState(false);
  
  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const activeColor = error ? colors.error : (isFocused ? colors.accent : colors.inputBorder);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <ThemedText colorType='text' size="sm" weight='semibold' style={styles.label}>{label}</ThemedText>
      )}
      <View style={styles.inputWrapper}>
        {leftIcon && (
            <View style={styles.leftIcon}>
                {React.cloneElement(leftIcon as React.ReactElement<any>, {
                    color: isFocused ? colors.accent : (leftIcon as any).props.color || colors.subtext
                })}
            </View>
        )}
        <TextInput 
          placeholderTextColor={colors.subtext}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={{
            backgroundColor: colors.inputBg,
            color: colors.text,
            borderColor: activeColor,
            borderBottomWidth: 4,
            paddingVertical: 16,
            paddingLeft: leftIcon ? 48 : 16,
            paddingRight: rightIcon ? 48 : 16,
            borderRadius: 16,
            fontSize: 18,
            fontWeight: '500',
          }}
          {...props}
        />
         {rightIcon && (
            <View style={styles.rightIcon}>
                {React.cloneElement(rightIcon as React.ReactElement<any>, {
                    color: isFocused ? colors.accent : (rightIcon as any).props.color || colors.subtext
                })}
            </View>
        )}
      </View>
      {error && (
        <ThemedText type="error" style={[styles.error, { color: colors.error }]}>{error}</ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    marginLeft: 8,
    marginBottom: 8,
  },
  inputWrapper: {
    justifyContent: 'center',
    position: 'relative',
  },
  leftIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
  },
  rightIcon: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
  },
  error: {
    marginTop: 4,
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
});
