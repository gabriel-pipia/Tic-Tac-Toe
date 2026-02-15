
import { useTheme } from '@/context/ThemeContext';
import React from 'react';
import { StyleProp, TextStyle, TouchableOpacity, TouchableOpacityProps, View, ViewStyle } from 'react-native';
import { ThemedText } from './Text';

interface ButtonProps extends TouchableOpacityProps {
  title?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'white';
  size?: 'sm' | 'md' | 'lg';
  type?: 'text' | 'icon';
  icon?: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  textClassName?: string;
  children?: React.ReactNode;
}

export default function Button({ 
  title, 
  variant = 'primary', 
  type = 'text',
  size = 'md', 
  icon,
  className,
  style,
  textStyle,
  textClassName,
  disabled,
  children,
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
      backgroundColor = '#FFFFFF';
      borderColor = '#E2E8F0';
      textColor = '#0F172A';
      borderBottomWidth = 4;
      break;
    case 'danger':
      backgroundColor = colors.error;
      borderColor = 'rgba(0,0,0,0.2)';
      textColor = '#FFFFFF';
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
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {icon && <View style={{ marginRight: type === 'text' ? 12 : 0 }}>{icon}</View>}
            <ThemedText 
                style={[
                  {
                    fontSize: 18,
                    fontWeight: 'bold',
                    textAlign: 'center',
                    color: textColor,
                  },
                  textStyle
                ]}
                className={textClassName}
            >
                {title}
            </ThemedText>
        </View>
      )}
    </TouchableOpacity>
  );
}
