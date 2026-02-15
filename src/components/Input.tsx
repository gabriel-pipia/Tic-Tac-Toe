
import { useTheme } from '@/context/ThemeContext';
import React from 'react';
import { TextInput, TextInputProps, View } from 'react-native';
import { ThemedText } from './Text';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerClassName?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export default function Input({ 
  label, 
  error, 
  containerClassName, 
  className,
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
    <View className={`w-full ${containerClassName || ''}`}>
      {label && (
        <ThemedText colorType='text' size="sm" weight='semibold' className='ml-2 mb-2'>{label}</ThemedText>
      )}
      <View className="relative justify-center">
        {leftIcon && (
            <View className="absolute left-4 z-10">
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
            <View className="absolute right-4 z-10">
                {React.cloneElement(rightIcon as React.ReactElement<any>, {
                    color: isFocused ? colors.accent : (rightIcon as any).props.color || colors.subtext
                })}
            </View>
        )}
      </View>
      {error && (
        <ThemedText type="error" className="text-sm mt-1 ml-1 font-medium" style={{ color: colors.error }}>{error}</ThemedText>
      )}
    </View>
  );
}
