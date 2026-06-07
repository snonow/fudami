/**
 * Fudami Visual Identity - Based on GRAPHICS.md
 */

const PALETTE = {
  // Light Mode Base
  hankoRed: '#E83929',
  hankoRedLight: '#FCEAE9',
  hankoRedDark: '#B3291D',

  matchaGreen: '#00A968',
  matchaGreenLight: '#D9F2E6',
  matchaGreenDark: '#00754A',

  aizomeIndigo: '#1D2F6F',
  aizomeIndigoLight: '#DCE2F1',
  aizomeIndigoDark: '#121D45',

  washiPaper: '#F9F7F1',
  washiPaperLight: '#FFFFFF',
  washiPaperDark: '#E6E1D6',

  sumiInk: '#2C2A29',
  sumiInkLight: '#6B6661',
  sumiInkDark: '#11100F',

  // Dark Mode Adjustments
  charcoal: '#121212',
  charcoalLight: '#1E1E1E',
  offWhite: '#EAEAEA',
  mutedGrey: '#A0A0A0',

  softHankoRed: '#FF6B6B',
  softMatchaGreen: '#2ECA7F',
  softAizomeIndigo: '#6D8DED',
};

export const Colors = {
  // Primary semantic colors (Default: Dark Mode)
  background: PALETTE.charcoal,
  surface: PALETTE.charcoalLight,
  surfaceLight: '#2A2A2A',
  
  primary: PALETTE.softHankoRed,
  secondary: PALETTE.softAizomeIndigo,
  success: PALETTE.softMatchaGreen,
  
  text: PALETTE.offWhite,
  textMuted: PALETTE.mutedGrey,
  
  // Legacy aliases (kept for compatibility during transition)
  navy: PALETTE.charcoal,
  teal: PALETTE.softHankoRed, // Redirecting main brand color to Hanko Red
  skyBlue: PALETTE.softAizomeIndigo,
  white: PALETTE.offWhite,

  // Exported for specific use cases
  palette: PALETTE,

  // Mode specific mappings
  dark: {
    background: PALETTE.charcoal,
    surface: PALETTE.charcoalLight,
    text: PALETTE.offWhite,
    primary: PALETTE.softHankoRed,
    secondary: PALETTE.softAizomeIndigo,
    success: PALETTE.softMatchaGreen,
  },
  light: {
    background: PALETTE.washiPaper,
    surface: PALETTE.washiPaperLight,
    text: PALETTE.sumiInk,
    primary: PALETTE.hankoRed,
    secondary: PALETTE.aizomeIndigo,
    success: PALETTE.matchaGreen,
  }
};
