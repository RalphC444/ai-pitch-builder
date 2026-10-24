/**
 * Nexus Design System Color Tokens
 * 
 * All color values are extracted from the Nexus Design System
 * and should be used consistently across the application.
 */

export type ColorScale = 'cool-grey' | 'grey-scale' | 'blue' | 'purple' | 'lilac' | 'orange' | 'white' | 'crm-gray';

export interface ColorToken {
  name: string;
  value: string;
  scale: ColorScale;
  shade?: number;
  usage?: string;
}

/**
 * Color tokens organized by scale
 */
export const colorTokens: Record<string, ColorToken> = {
  // Cool Grey Scale
  'cool-grey-100': {
    name: 'Cool Grey 100',
    value: '#f0f4f8',
    scale: 'cool-grey',
    shade: 100,
    usage: 'Light backgrounds, subtle borders',
  },
  'cool-grey-700': {
    name: 'Cool Grey 700',
    value: '#8b8d98',
    scale: 'cool-grey',
    shade: 700,
    usage: 'Secondary text, disabled states',
  },
  'cool-grey-1000': {
    name: 'Cool Grey 1000',
    value: '#1c2024',
    scale: 'cool-grey',
    shade: 1000,
    usage: 'Primary text, high contrast',
  },

  // Grey Scale
  'grey-scale-200': {
    name: 'Grey Scale 200',
    value: '#ebebeb',
    scale: 'grey-scale',
    shade: 200,
    usage: 'Borders, dividers',
  },
  'grey-scale-600': {
    name: 'Grey Scale 600',
    value: '#5c5c5c',
    scale: 'grey-scale',
    shade: 600,
    usage: 'Secondary text',
  },
  'grey-scale-700': {
    name: 'Grey Scale 700',
    value: '#333333',
    scale: 'grey-scale',
    shade: 700,
    usage: 'Primary text, headings',
  },

  // Blue Scale
  'blue-400': {
    name: 'Blue 400',
    value: '#339bef',
    scale: 'blue',
    shade: 400,
    usage: 'Links, interactive elements',
  },
  'blue-600': {
    name: 'Blue 600',
    value: '#0068bc',
    scale: 'blue',
    shade: 600,
    usage: 'Primary buttons, active states, brand color',
  },

  // Purple Scale
  'purple-25': {
    name: 'Purple 25',
    value: '#f6f1ff',
    scale: 'purple',
    shade: 25,
    usage: 'Light backgrounds, subtle highlights',
  },
  'purple-200': {
    name: 'Purple 200',
    value: '#d3bbff',
    scale: 'purple',
    shade: 200,
    usage: 'Accent colors, highlights',
  },
  'purple-600': {
    name: 'Purple 600',
    value: '#7445cc',
    scale: 'purple',
    shade: 600,
    usage: 'Purple accent, secondary actions',
  },

  // Lilac Scale
  'lilac-300': {
    name: 'Lilac 300',
    value: '#8d98ff',
    scale: 'lilac',
    shade: 300,
    usage: 'Accent colors, highlights',
  },

  // Orange Scale
  'orange-50': {
    name: 'Orange 50',
    value: '#ffebd8',
    scale: 'orange',
    shade: 50,
    usage: 'Light backgrounds, warnings',
  },
  'orange-500': {
    name: 'Orange 500',
    value: '#ff820e',
    scale: 'orange',
    shade: 500,
    usage: 'Warning states, alerts',
  },

  // White
  'white': {
    name: 'White',
    value: '#ffffff',
    scale: 'white',
    usage: 'Backgrounds, text on dark backgrounds',
  },

  // CRM Gray
  'crm-gray-100': {
    name: 'CRM Gray 100',
    value: '#F0F4F8',
    scale: 'crm-gray',
    shade: 100,
    usage: 'Light backgrounds, cards',
  },
};

/**
 * Semantic color mappings for common UI patterns
 */
export const semanticColors = {
  // Text Colors
  text: {
    primary: colorTokens['grey-scale-700'].value,
    secondary: colorTokens['grey-scale-600'].value,
    disabled: colorTokens['cool-grey-700'].value,
    inverse: colorTokens['white'].value,
  },
  
  // Background Colors
  background: {
    default: colorTokens['white'].value,
    subtle: colorTokens['cool-grey-100'].value,
    crm: colorTokens['crm-gray-100'].value,
  },
  
  // Interactive Colors
  interactive: {
    primary: colorTokens['blue-600'].value,
    primaryHover: colorTokens['blue-400'].value,
    active: colorTokens['blue-600'].value,
    activeBackground: '#0082eb14', // From Figma: Surfaces/Buttons/Icon and Text/Active
  },
  
  // Border Colors
  border: {
    default: colorTokens['grey-scale-200'].value,
    subtle: colorTokens['cool-grey-100'].value,
  },
  
  // Status Colors
  status: {
    warning: colorTokens['orange-500'].value,
    warningBackground: colorTokens['orange-50'].value,
  },
  
  // Icon Colors
  icon: {
    default: '#000000a3', // From Figma: Icons/Default
    active: colorTokens['blue-600'].value,
  },
} as const;

/**
 * Helper function to get color value by token name
 */
export function getColorToken(tokenName: string): string | undefined {
  return colorTokens[tokenName]?.value;
}

/**
 * Helper function to get semantic color
 */
export function getSemanticColor(category: keyof typeof semanticColors, key: string): string | undefined {
  const categoryColors = semanticColors[category];
  return (categoryColors as Record<string, string>)[key];
}






