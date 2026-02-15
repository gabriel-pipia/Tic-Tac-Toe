
import { useTheme } from '@/context/ThemeContext';
import React from 'react';
import { RefreshControl as RNRefreshControl, RefreshControlProps } from 'react-native';

/**
 * A themed RefreshControl component that automatically applies the correct
 * colors based on the current theme (light/dark).
 */
export default function RefreshControl(props: RefreshControlProps) {
  const { colors } = useTheme();

  return (
    <RNRefreshControl
      // iOS
      tintColor={colors.accent}
      titleColor={colors.subtext}
      
      // Android
      colors={[colors.white]}
      progressBackgroundColor={colors.accent} // Consistent with sheetBg or card
      
      // Common props
      {...props}
    />
  );
}
