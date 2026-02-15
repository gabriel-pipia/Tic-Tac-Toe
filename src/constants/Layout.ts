import { DimensionValue, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const Layout = {
  window: {
    width,
    height,
  },
  isSmallDevice: width < 375,
  /**
   * Maximum width for the main content container to prevent it from
   * stretching too wide on tablets or web.
   */
  MAX_CONTENT_WIDTH: 440,
  CONTAINER_WIDTH_PERCENT: '90%' as DimensionValue,
  
  /**
   * Standard spacing values to maintain consistency.
   */
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  /**
   * Standard border radius values.
   */
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    full: 9999,
  },

  /**
   * Navigation and Tab Bar specific layout.
   */
  tabBar: {
    height: 70,
    bottomOffset: 24,
    width: '90%' as DimensionValue,
  },

  /**
   * Common component specific dimensions.
   */
  components: {
    logoSize: 96,
    iconSize: {
      sm: 16,
      md: 24,
      lg: 32,
      xl: 48,
    },
    scanFrameSize: "90%",
  }
};
