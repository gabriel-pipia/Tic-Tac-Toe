import { useTheme } from '@/context/ThemeContext';
import { StyleSheet, Text } from 'react-native';

import { ThemedTextProps } from '@/types/theme';

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  weight,
  size,
  align,
  colorType,
  uppercase,
  children,
  ...rest
}: ThemedTextProps) {
  const { colors, isDark } = useTheme();
  
  // Use color from props if provided, otherwise from theme
  const themeColor = lightColor || darkColor 
    ? (isDark ? (darkColor || lightColor) : (lightColor || darkColor))
    : colors[colorType || (type === 'error' ? 'error' : 'text')] as string;

  // Map weight to fontWeight
  const fontWeightMap = {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    black: '900',
  } as const;

  // Map size aliases to numbers
  const sizeMap = {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
    '6xl': 60,
  } as const;

  const fontSize = typeof size === 'string' ? sizeMap[size] : size;
  // Map types to base styles or classes
  let typeStyle: any = styles.default;
  if (type === 'title') typeStyle = styles.title;
  if (type === 'defaultSemiBold') typeStyle = styles.defaultSemiBold;
  if (type === 'subtitle') typeStyle = styles.subtitle;
  if (type === 'link') typeStyle = styles.link;
  if (type === 'caption') typeStyle = styles.caption;
  if (type === 'label') typeStyle = styles.label;

  const customStyle = {
    color: themeColor,
    fontWeight: weight ? fontWeightMap[weight] : undefined,
    fontSize: fontSize,
    textAlign: align,
    textTransform: uppercase ? 'uppercase' as const : undefined,
  };

  return (
    <Text
      style={[typeStyle, customStyle, style]}
      accessibilityRole={type === 'title' ? 'header' : type === 'link' ? 'link' : 'text'}
        {...rest}
      >
        {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 28,
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.7
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  }
});
