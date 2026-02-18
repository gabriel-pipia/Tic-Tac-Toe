import { BlurViewProps } from 'expo-blur';
import { ScrollViewProps, TextProps, ViewProps } from 'react-native';
import { Edge, SafeAreaViewProps } from 'react-native-safe-area-context';

export type Colors = {
  background: string;
  card: string;
  border: string;
  text: string;
  subtext: string;
  separator: string;
  iconBg: string;
  inputBg: string;
  inputBorder: string;
  sheetBg: string;
  primary: string;
  secondary: string;
  accent: string;
  primaryGradient: [string, string];
  error: string;
  success: string;
  white: string;
  black: string;
  themedWhite: string;
  themedBlack: string;
  info: string;
  warning: string;
  purple: string;
};

export type ThemedViewProps = ViewProps & ScrollViewProps & BlurViewProps & SafeAreaViewProps & {
  themed?: boolean;
  scroll?: boolean;
  blur?: boolean;
  keyboardAvoiding?: boolean;
  safe?: boolean;
  edges?: readonly Edge[];
  keyboardOffset?: number;
};

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 'caption' | 'error' | 'label';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold' | 'black';
  size?: number | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';
  align?: 'left' | 'center' | 'right';
  colorType?: 'text' | 'subtext' | 'error' | 'success' | 'accent' | 'primary' | 'white' | 'black' | 'themedWhite' | 'themedBlack';
  uppercase?: boolean;
};
