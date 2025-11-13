/**
 * types.ts - Theme Type Definitions
 *
 * This file defines TypeScript types for our theme system.
 * Types help catch errors and provide autocomplete in your IDE.
 *
 * WHAT ARE TYPESCRIPT TYPES?
 * ===========================
 * Types describe what kind of data a variable can hold.
 * They're like labels that tell TypeScript (and you!) what to expect.
 *
 * Example:
 * ```typescript
 * let age: number = 25;        // age must be a number
 * let name: string = "Alice";  // name must be a string
 * age = "Bob";                 // ❌ Error! Can't assign string to number
 * ```
 *
 * WHY TYPE OUR THEME?
 * ===================
 * 1. **Autocomplete**: Your IDE suggests available colors/sizes
 * 2. **Error Prevention**: TypeScript catches typos before runtime
 * 3. **Documentation**: Types document what values are valid
 * 4. **Refactoring**: Safe to rename/restructure theme values
 *
 * TYPES VS INTERFACES:
 * ====================
 * Both define object shapes, but have subtle differences:
 * - type: Can't be extended, good for unions/intersections
 * - interface: Can be extended, good for object shapes
 *
 * For theme, we use both depending on the use case!
 */

import { ViewStyle, TextStyle } from 'react-native';

/**
 * COLOR TYPES
 * ===========
 * Types for our color system
 */

/**
 * Brand colors type
 * These are the main colors that define your brand
 */
export type BrandColors = {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;
};

/**
 * Background colors type
 * Surface and background colors
 */
export type BackgroundColors = {
  background: string;
  surface: string;
  surfaceAlt: string;
};

/**
 * Text colors type
 * All text color variations
 */
export type TextColors = {
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textOnPrimary: string;
  textOnSecondary: string;
};

/**
 * Complete color palette type
 * Combines all color categories
 */
export type ColorPalette = BrandColors &
  BackgroundColors &
  TextColors & {
    // Border colors
    border: string;
    borderLight: string;
    divider: string;

    // State colors
    success: string;
    successLight: string;
    successDark: string;
    error: string;
    errorLight: string;
    errorDark: string;
    warning: string;
    warningLight: string;
    warningDark: string;
    info: string;
    infoLight: string;
    infoDark: string;

    // Interactive colors
    overlay: string;
    overlayLight: string;
    disabled: string;
    disabledBackground: string;
    ripple: string;

    // Transparent variants
    primaryTransparent: string;
    secondaryTransparent: string;
  };

/**
 * SPACING TYPES
 * =============
 * Types for spacing values
 */

/**
 * Spacing scale type
 * All available spacing values
 */
export type SpacingScale = {
  xxs: number;
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  xxxl: number;
};

/**
 * Layout spacing type
 * Common layout spacing patterns
 */
export type LayoutSpacing = {
  screenHorizontal: number;
  screenVertical: number;
  sectionGap: number;
  sectionPadding: number;
  cardPadding: number;
  cardMargin: number;
  cardGap: number;
  listItemPadding: number;
  listItemGap: number;
  buttonPaddingHorizontal: number;
  buttonPaddingVertical: number;
  buttonGap: number;
  inputPadding: number;
  formFieldGap: number;
  labelGap: number;
  headerPadding: number;
  footerPadding: number;
};

/**
 * TYPOGRAPHY TYPES
 * ================
 * Types for text styles
 */

/**
 * Font family type
 * Available font families
 */
export type FontFamily = {
  regular: string;
  medium: string;
  bold: string;
  mono: string;
};

/**
 * Font weight type
 * Available font weights
 */
export type FontWeight = {
  normal: TextStyle['fontWeight'];
  medium: TextStyle['fontWeight'];
  semibold: TextStyle['fontWeight'];
  bold: TextStyle['fontWeight'];
};

/**
 * Font size scale type
 * All available font sizes
 */
export type FontSizeScale = {
  xxs: number;
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  xxxl: number;
  huge: number;
  display: number;
};

/**
 * Text style object type
 * Complete text style with all properties
 */
export type TextStyleObject = TextStyle;

/**
 * Heading styles type
 * All heading variations
 */
export type HeadingStyles = {
  h1: TextStyleObject;
  h2: TextStyleObject;
  h3: TextStyleObject;
  h4: TextStyleObject;
};

/**
 * Body styles type
 * All body text variations
 */
export type BodyStyles = {
  large: TextStyleObject;
  regular: TextStyleObject;
  small: TextStyleObject;
  medium: TextStyleObject;
  bold: TextStyleObject;
};

/**
 * Special text styles type
 * Special purpose text styles
 */
export type SpecialTextStyles = {
  caption: TextStyleObject;
  overline: TextStyleObject;
  button: TextStyleObject;
  link: TextStyleObject;
  label: TextStyleObject;
  helper: TextStyleObject;
  code: TextStyleObject;
};

/**
 * RADIUS TYPES
 * ============
 * Types for border radius values
 */

/**
 * Radius scale type
 * All available radius values
 */
export type RadiusScale = {
  none: number;
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  round: number;
  full: string;
};

/**
 * Component radius type
 * Radius values for specific components
 */
export type ComponentRadius = {
  button: {
    small: number;
    default: number;
    large: number;
    pill: number;
  };
  card: {
    default: number;
    large: number;
  };
  input: {
    default: number;
    rounded: number;
  };
  modal: {
    default: number;
    sheet: number;
  };
  image: {
    default: number;
    thumbnail: number;
    avatar: string;
  };
  badge: {
    default: number;
    pill: number;
  };
  alert: {
    default: number;
    toast: number;
  };
};

/**
 * SHADOW TYPES
 * ============
 * Types for shadow/elevation styles
 */

/**
 * Shadow style type
 * A complete shadow style object
 */
export type ShadowStyle = ViewStyle;

/**
 * Component shadows type
 * Shadows for specific components
 */
export type ComponentShadows = {
  card: {
    default: ShadowStyle;
    elevated: ShadowStyle;
    featured: ShadowStyle;
  };
  button: {
    default: ShadowStyle;
    primary: ShadowStyle;
    fab: ShadowStyle;
  };
  modal: {
    default: ShadowStyle;
    fullscreen: ShadowStyle;
    sheet: ShadowStyle;
  };
  navigation: {
    header: ShadowStyle;
    tab: ShadowStyle;
    drawer: ShadowStyle;
  };
  dropdown: {
    menu: ShadowStyle;
    picker: ShadowStyle;
  };
  alert: {
    toast: ShadowStyle;
    snackbar: ShadowStyle;
    banner: ShadowStyle;
  };
};

/**
 * ANIMATION TYPES
 * ===============
 * Types for animation values
 */

/**
 * Duration scale type
 * All available animation durations
 */
export type DurationScale = {
  instant: number;
  fastest: number;
  fast: number;
  normal: number;
  moderate: number;
  slow: number;
  slowest: number;
  extraSlow: number;
};

/**
 * Easing type
 * Available easing curves
 */
export type EasingCurves = {
  linear: string;
  ease: string;
  easeIn: string;
  easeOut: string;
  easeInOut: string;
};

/**
 * Spring configuration type
 * Configuration for spring animations
 */
export type SpringConfig = {
  bounciness: number;
  speed: number;
};

/**
 * ICON TYPES
 * ==========
 * Types for icon sizes
 */

/**
 * Icon size scale type
 * All available icon sizes
 */
export type IconSizeScale = {
  xxs: number;
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  xxxl: number;
  huge: number;
};

/**
 * Touch target sizes type
 * Minimum touch target sizes
 */
export type TouchTargetSizes = {
  minimum: number;
  comfortable: number;
  large: number;
};

/**
 * THEME TYPE
 * ==========
 * The complete theme object type
 * This is the main type that describes your entire theme!
 */
export type Theme = {
  colors: ColorPalette;
  spacing: SpacingScale;
  layout: LayoutSpacing;
  typography: {
    fontFamily: FontFamily;
    fontWeight: FontWeight;
    fontSize: FontSizeScale;
    headings: HeadingStyles;
    body: BodyStyles;
    special: SpecialTextStyles;
  };
  radius: RadiusScale;
  componentRadius: ComponentRadius;
  shadows: {
    none: ShadowStyle;
    xs: ShadowStyle;
    sm: ShadowStyle;
    md: ShadowStyle;
    lg: ShadowStyle;
    xl: ShadowStyle;
    xxl: ShadowStyle;
    max: ShadowStyle;
    component: ComponentShadows;
  };
  animations: {
    duration: DurationScale;
    easing: EasingCurves;
  };
  icons: {
    size: IconSizeScale;
    touchTarget: TouchTargetSizes;
  };
};

/**
 * HOW TO USE THESE TYPES:
 * ========================
 *
 * 1. Type component props:
 * ```typescript
 * type ButtonProps = {
 *   color: keyof ColorPalette;  // Must be a color from palette
 *   size: keyof IconSizeScale;  // Must be a size from scale
 * };
 * ```
 *
 * 2. Type function parameters:
 * ```typescript
 * function getSpacing(size: keyof SpacingScale): number {
 *   return spacing[size];
 * }
 * ```
 *
 * 3. Type custom components:
 * ```typescript
 * type CustomTextProps = {
 *   variant: keyof HeadingStyles | keyof BodyStyles;
 * };
 * ```
 *
 * 4. Type theme extensions:
 * ```typescript
 * type ExtendedTheme = Theme & {
 *   customValues: {
 *     specialColor: string;
 *   };
 * };
 * ```
 */

/**
 * HELPER TYPES
 * ============
 * Utility types for common patterns
 */

/**
 * Extract keys from an object type
 * Useful for creating union types from object keys
 */
export type KeysOf<T> = keyof T;

/**
 * Extract values from an object type
 * Useful for creating union types from object values
 */
export type ValuesOf<T> = T[keyof T];

/**
 * Make all properties optional
 * Already exists as Partial<T> but shown for learning
 */
export type Optional<T> = {
  [K in keyof T]?: T[K];
};

/**
 * Make all properties required
 * Already exists as Required<T> but shown for learning
 */
export type Required<T> = {
  [K in keyof T]-?: T[K];
};

/**
 * EXAMPLES OF TYPE USAGE:
 * ========================
 *
 * 1. Component with typed props:
 * ```typescript
 * type CardProps = {
 *   shadow: keyof ComponentShadows['card'];
 *   radius: keyof ComponentRadius['card'];
 * };
 *
 * const Card: React.FC<CardProps> = ({ shadow, radius }) => {
 *   // TypeScript knows shadow can be 'default' | 'elevated' | 'featured'
 *   // TypeScript knows radius can be 'default' | 'large'
 * };
 * ```
 *
 * 2. Utility function with types:
 * ```typescript
 * function getFontSize(size: keyof FontSizeScale): number {
 *   return fontSize[size];
 * }
 *
 * getFontSize('md');      // ✅ Valid
 * getFontSize('medium');  // ❌ Error - not in FontSizeScale
 * ```
 *
 * 3. Custom hook with typed returns:
 * ```typescript
 * function useThemeColor(colorName: keyof ColorPalette): string {
 *   return colors[colorName];
 * }
 *
 * const color = useThemeColor('primary');  // ✅ TypeScript knows it's a string
 * ```
 */

/**
 * LEARN MORE ABOUT TYPESCRIPT:
 * =============================
 * - TypeScript Handbook: https://www.typescriptlang.org/docs/handbook/
 * - Type vs Interface: https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#differences-between-type-aliases-and-interfaces
 * - Utility Types: https://www.typescriptlang.org/docs/handbook/utility-types.html
 */
