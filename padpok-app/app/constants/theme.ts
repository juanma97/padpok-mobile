// Paleta de colores principal y extendida
export const COLORS = {
  primary: '#1e3a8a', // Azul principal
  secondary: '#5b21b6', // Púrpura
  accent: '#0ea5e9', // Azul cielo
  background: '#f8fafc', // Fondo general
  white: '#ffffff',
  black: '#000000',
  gray: '#9ca3af',
  lightGray: '#e5e7eb',
  error: '#ef4444',
  success: '#10b981',
  warning: '#f59e0b',
  // Nuevos colores para UI premium
  dark: '#111827', // Para textos oscuros
  light: '#f3f4f6', // Para fondos claros
  border: '#e5e7eb', // Para bordes y separadores
  overlay: 'rgba(30,58,138,0.85)', // Para overlays y modales
  shadow: 'rgba(0,0,0,0.12)', // Para sombras
};

// Tamaños de fuente y espaciados
export const SIZES = {
  xs: 10,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  huge: 40,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

// Fuentes premium (asegúrate de tenerlas en tu proyecto o usa alternativas del sistema)
export const FONTS = {
  regular: 'Poppins', // O 'System' si no tienes Poppins
  medium: 'Poppins-Medium',
  bold: 'Poppins-Bold',
  // Alternativas para Apple-like
  appleRegular: 'SF Pro Display',
  appleMedium: 'SF Pro Display Medium',
  appleBold: 'SF Pro Display Bold',
};

// Ejemplo de uso en un componente:
// import { COLORS, FONTS, SIZES, SPACING } from '@app/constants/theme';
// style={{ color: COLORS.primary, fontFamily: FONTS.bold, fontSize: SIZES.xl }}

// Asegurar que estas constantes sean consistentes con tailwind.config.js 