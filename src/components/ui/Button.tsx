
import { useTheme } from '@/context/ThemeContext';
import React from 'react';
import { StyleProp, TextStyle, TouchableOpacity, TouchableOpacityProps, ViewStyle } from 'react-native';
import { ThemedText } from './Text';
import { ThemedView } from './View';

interface ButtonProps extends TouchableOpacityProps {
  title?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'white';
  size?: 'sm' | 'md' | 'lg';
  type?: 'text' | 'icon';
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  children?: React.ReactNode;
  weight?: 'normal' | 'medium' | 'bold' | 'black';
  loading?: boolean;
}

export default function Button({ 
  title, 
  variant = 'primary', 
  type = 'text',
  size = 'md', 
  icon,
  style,
  textStyle,
  disabled,
  children,
  weight = 'bold', 
  loading = false,
  ...props 
}: ButtonProps) {
  const { colors, isDark } = useTheme();
  
  // Size styles (padding)
  const sizePadding = {
    sm: { px: 12, py: 8 },
    md: { px: 20, py: 16 },
    lg: { px: 32, py: 20 },
  };

  const currentPadding = sizePadding[size];

  // Dynamic Styles based on variant and theme
  let backgroundColor = colors.accent;
  let borderColor = isDark ? '#7c3aed' : '#7c3aed'; // Depth color
  let textColor = colors.text;
  let borderWidth = 0;
  let borderBottomWidth = 6;

  switch (variant) {
    case 'primary':
      backgroundColor = colors.accent;
      borderColor = isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)';
      textColor = colors.white;
      break;
    case 'secondary':
      backgroundColor = colors.card;
      borderColor = colors.border;
      textColor = colors.text;
      borderWidth = 1;
      borderBottomWidth = 4;
      break;
    case 'white':
      backgroundColor = colors.white;
      borderColor = colors.border;
      textColor = colors.black;
      borderBottomWidth = 4;
      break;
    case 'danger':
      backgroundColor = colors.error;
      borderColor = 'rgba(0,0,0,0.2)';
      textColor = colors.white;
      borderBottomWidth = 4;
      break;
    case 'outline':
      backgroundColor = 'transparent';
      textColor = colors.accent;
      borderWidth = 2;
      borderColor = colors.accent;
      borderBottomWidth = 0;
      break;
    case 'ghost':
      backgroundColor = 'transparent';
      textColor = colors.text;
      borderBottomWidth = 0;
      break;
  }

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 16,
          backgroundColor,
          borderWidth,
          borderColor,
          borderBottomWidth: disabled ? 0 : borderBottomWidth,
          paddingHorizontal: currentPadding.px,
          paddingVertical: currentPadding.py,
          opacity: disabled ? 0.5 : 1,
        },
        style as any
      ]}
      {...props}
    >
      {children ? children : (
        <ThemedView style={{ flexDirection: 'row', alignItems: 'center' }}>
            {icon && <ThemedView style={{ marginRight: type === 'text' ? 12 : 0 }}>{icon}</ThemedView>}
            <ThemedText
          style={[
            { color: textColor, fontWeight: weight },
            size === 'lg' && { fontSize: 24 },
            size === 'md' && { fontSize: 18 },
            size === 'sm' && { fontSize: 14 },
            textStyle
          ]}
      >
        {title}
      </ThemedText>
        </ThemedView>
      )}
    </TouchableOpacity>
  );
}
