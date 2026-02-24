// Centralized Color System for UJAAS - Teal/Cyan/Blue/Yellow Palette
export const colors = {
  // Primary Gradients
  gradients: {
    primary: 'from-teal-600 via-cyan-600 to-blue-500',
    secondary: 'from-teal-600 to-cyan-600',
    tertiary: 'from-cyan-600 to-blue-500',
    accent: 'from-cyan-500 to-blue-500',
    light: 'from-teal-50 via-cyan-50 to-blue-50',
    lightAlt: 'from-teal-50 to-cyan-50',
  },
  
  // Background Colors
  bg: {
    primary: 'bg-teal-600',
    secondary: 'bg-cyan-600',
    tertiary: 'bg-blue-500',
    light: 'bg-teal-50',
    lightSecondary: 'bg-cyan-50',
    lightTertiary: 'bg-blue-50',
    lighter: 'bg-teal-100',
    lighterSecondary: 'bg-cyan-100',
    lighterTertiary: 'bg-blue-100',
  },
  
  // Text Colors
  text: {
    primary: 'text-teal-600',
    secondary: 'text-cyan-600',
    tertiary: 'text-blue-500',
    light: 'text-teal-100',
    lightSecondary: 'text-cyan-100',
  },
  
  // Border Colors
  border: {
    primary: 'border-teal-200',
    secondary: 'border-cyan-200',
    tertiary: 'border-blue-200',
  },
  
  // Hover States
  hover: {
    text: 'hover:text-teal-600',
    textDark: 'hover:text-teal-700',
    gradient: 'hover:from-teal-700 hover:to-cyan-700',
    gradientAlt: 'hover:from-cyan-700 hover:to-blue-600',
  },
  
  // Ring/Focus States
  focus: {
    ring: 'focus:ring-teal-500',
    border: 'focus:border-teal-500',
  }
} as const;
