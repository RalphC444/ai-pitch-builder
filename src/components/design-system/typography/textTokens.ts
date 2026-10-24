/**
 * Nexus Design System Typography Tokens
 * 
 * All typography values are extracted from the Nexus Design System
 * and should be used consistently across the application.
 */

export type FontWeight = 'normal' | 'medium' | 'semibold' | 'bold';
export type FontSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
export type LineHeight = 'tight' | 'normal' | 'relaxed' | 'loose';

export interface TextToken {
  name: string;
  fontSize: string;
  lineHeight: string;
  fontWeight?: FontWeight;
  fontFamily?: string;
  usage?: string;
}

/**
 * Typography tokens organized by usage
 */
export const textTokens: Record<string, TextToken> = {
  // Button Typography
  'button-default': {
    name: 'Button Default',
    fontSize: '14px',
    lineHeight: '48px', // From Figma: Typography/Buttons/line-height
    fontWeight: 'normal',
    usage: 'Default button text',
  },
  'button-ghost-primary': {
    name: 'Button Ghost Primary',
    fontSize: '14px',
    lineHeight: 'normal',
    fontWeight: 'normal',
    usage: 'Ghost button primary variant',
  },
  'button-icon-text': {
    name: 'Button Icon and Text',
    fontSize: '14px',
    lineHeight: 'normal',
    fontWeight: 'normal',
    usage: 'Buttons with icon and text',
  },
  'button-dropdown': {
    name: 'Button Dropdown',
    fontSize: '14px',
    lineHeight: 'normal',
    fontWeight: 'normal',
    usage: 'Dropdown button text',
  },

  // Body Text
  'body-xs': {
    name: 'Body Extra Small',
    fontSize: '12px',
    lineHeight: '16px', // From Figma: Type/Scale/Line Height/xs
    fontWeight: 'normal',
    usage: 'Small body text, captions',
  },
  'body-sm': {
    name: 'Body Small',
    fontSize: '14px', // From Figma: Type/Scale/Font Size/sm
    lineHeight: '20px',
    fontWeight: 'normal',
    usage: 'Small body text',
  },
  'body-base': {
    name: 'Body Base',
    fontSize: '16px',
    lineHeight: '24px',
    fontWeight: 'normal',
    usage: 'Default body text',
  },
  'body-lg': {
    name: 'Body Large',
    fontSize: '18px',
    lineHeight: '28px',
    fontWeight: 'normal',
    usage: 'Large body text',
  },

  // Headings
  'heading-sm': {
    name: 'Heading Small',
    fontSize: '18px',
    lineHeight: '28px',
    fontWeight: 'semibold',
    usage: 'Small headings',
  },
  'heading-base': {
    name: 'Heading Base',
    fontSize: '20px',
    lineHeight: '30px',
    fontWeight: 'semibold',
    usage: 'Default headings',
  },
  'heading-lg': {
    name: 'Heading Large',
    fontSize: '24px',
    lineHeight: '32px',
    fontWeight: 'bold',
    usage: 'Large headings',
  },
  'heading-xl': {
    name: 'Heading Extra Large',
    fontSize: '32px',
    lineHeight: '40px',
    fontWeight: 'bold',
    usage: 'Extra large headings',
  },
};

/**
 * Font weight mappings
 */
export const fontWeights: Record<FontWeight, number> = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
};

/**
 * Semantic text style mappings for common UI patterns
 */
export const semanticTextStyles = {
  // Button Text
  button: {
    default: textTokens['button-default'],
    ghost: textTokens['button-ghost-primary'],
    iconText: textTokens['button-icon-text'],
    dropdown: textTokens['button-dropdown'],
  },
  
  // Body Text
  body: {
    xs: textTokens['body-xs'],
    sm: textTokens['body-sm'],
    base: textTokens['body-base'],
    lg: textTokens['body-lg'],
  },
  
  // Headings
  heading: {
    sm: textTokens['heading-sm'],
    base: textTokens['heading-base'],
    lg: textTokens['heading-lg'],
    xl: textTokens['heading-xl'],
  },
} as const;

/**
 * Helper function to get text token by name
 */
export function getTextToken(tokenName: string): TextToken | undefined {
  return textTokens[tokenName];
}

/**
 * Helper function to get semantic text style
 */
export function getSemanticTextStyle(category: keyof typeof semanticTextStyles, key: string): TextToken | undefined {
  const categoryStyles = semanticTextStyles[category];
  return (categoryStyles as Record<string, TextToken>)[key];
}






