/**
 * CENTRALIZED THEME CONFIGURATION
 * 
 * This file contains all color configurations for the POS application.
 * To change the entire application's color scheme, modify the HSL values below.
 * 
 * Current Theme: Yellow, Black & White
 * 
 * HOW TO USE:
 * 1. Modify the HSL values in the COLOR_PALETTE section
 * 2. The changes will apply to src/index.css automatically
 * 3. You can create preset themes and switch between them
 * 
 * HSL FORMAT: "hue saturation% lightness%"
 * - Hue: 0-360 (color wheel position)
 * - Saturation: 0-100% (color intensity)
 * - Lightness: 0-100% (brightness)
 */

export const COLOR_PALETTE = {
  // === PRIMARY COLORS (Yellow) ===
  yellow: {
    DEFAULT: '45 100% 50%',      // Bright yellow - main brand color
    light: '45 100% 60%',        // Lighter yellow for hover states
    dark: '42 100% 40%',         // Darker yellow for active states
  },

  // === NEUTRAL COLORS (Black & White) ===
  black: {
    pure: '0 0% 0%',             // Pure black
    soft: '0 0% 8%',             // Soft black for backgrounds
    lighter: '0 0% 12%',         // Lighter black for cards
    border: '0 0% 20%',          // Border color
  },

  white: {
    pure: '0 0% 100%',           // Pure white
    off: '0 0% 95%',             // Off-white for text
    muted: '0 0% 70%',           // Muted white for secondary text
  },

  // === ACCENT COLORS ===
  green: '142 76% 36%',          // Success states
  red: '0 84% 60%',              // Error/destructive states
  orange: '25 95% 53%',          // Warning states
};

/**
 * THEME MAPPING
 * Maps the color palette to application theme variables
 * These match the CSS variables in src/index.css
 */
export const THEME = {
  // Background colors
  background: COLOR_PALETTE.black.soft,
  foreground: COLOR_PALETTE.white.off,

  // Card colors
  card: COLOR_PALETTE.black.lighter,
  cardForeground: COLOR_PALETTE.white.off,

  // Primary brand colors (Yellow)
  primary: COLOR_PALETTE.yellow.DEFAULT,
  primaryForeground: COLOR_PALETTE.black.pure,

  // Secondary colors (darker backgrounds)
  secondary: COLOR_PALETTE.black.border,
  secondaryForeground: COLOR_PALETTE.white.off,

  // Muted colors (less prominent elements)
  muted: COLOR_PALETTE.black.lighter,
  mutedForeground: COLOR_PALETTE.white.muted,

  // Accent colors (highlights)
  accent: COLOR_PALETTE.yellow.light,
  accentForeground: COLOR_PALETTE.black.pure,

  // Border & input colors
  border: COLOR_PALETTE.black.border,
  input: COLOR_PALETTE.black.border,
  ring: COLOR_PALETTE.yellow.DEFAULT,

  // State colors
  success: COLOR_PALETTE.green,
  successForeground: COLOR_PALETTE.white.pure,
  
  warning: COLOR_PALETTE.orange,
  warningForeground: COLOR_PALETTE.black.pure,
  
  destructive: COLOR_PALETTE.red,
  destructiveForeground: COLOR_PALETTE.white.pure,

  // Popover colors
  popover: COLOR_PALETTE.black.lighter,
  popoverForeground: COLOR_PALETTE.white.off,

  // Sidebar colors
  sidebar: {
    background: COLOR_PALETTE.black.soft,
    foreground: COLOR_PALETTE.white.off,
    primary: COLOR_PALETTE.yellow.DEFAULT,
    primaryForeground: COLOR_PALETTE.black.pure,
    accent: COLOR_PALETTE.black.border,
    accentForeground: COLOR_PALETTE.white.off,
    border: COLOR_PALETTE.black.border,
    ring: COLOR_PALETTE.yellow.DEFAULT,
  },
};

/**
 * PRESET THEMES
 * Quick theme presets you can switch between
 * Uncomment and use these for different color schemes
 */

// Blue Theme Preset (Commented - uncomment to use)
// export const BLUE_THEME = {
//   primary: '217 91% 60%',      // Blue
//   accent: '200 98% 39%',       // Cyan
//   success: '142 76% 36%',      // Green
// };

// Red Theme Preset (Commented - uncomment to use)
// export const RED_THEME = {
//   primary: '0 84% 60%',        // Red
//   accent: '15 86% 58%',        // Orange-red
//   success: '142 76% 36%',      // Green
// };

// Green Theme Preset (Commented - uncomment to use)
// export const GREEN_THEME = {
//   primary: '142 76% 36%',      // Green
//   accent: '160 84% 39%',       // Teal
//   success: '142 76% 36%',      // Green
// };

/**
 * USAGE INSTRUCTIONS:
 * 
 * 1. TO CHANGE COLORS:
 *    - Edit values in COLOR_PALETTE section above
 *    - Save this file
 *    - Run: npm run dev (if not already running)
 *    - The app will update automatically
 * 
 * 2. TO USE A PRESET THEME:
 *    - Uncomment a preset theme above
 *    - Replace values in COLOR_PALETTE with preset values
 *    - Save and restart dev server
 * 
 * 3. TO CREATE CUSTOM THEME:
 *    - Use a color picker to get HSL values
 *    - Update COLOR_PALETTE values
 *    - Test in the application
 * 
 * 4. HSL COLOR GUIDE:
 *    Yellow: 45-60 hue
 *    Orange: 25-40 hue
 *    Red: 0-15 hue
 *    Green: 120-150 hue
 *    Blue: 200-240 hue
 *    Purple: 270-300 hue
 */

export default THEME;
