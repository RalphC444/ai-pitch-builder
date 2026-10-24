import React from 'react';
import { textTokens, TextToken, semanticTextStyles, fontWeights, FontWeight } from './textTokens';

interface TextStylesProps {
  token?: string;
  fontSize?: string;
  lineHeight?: string;
  fontWeight?: FontWeight;
  fontFamily?: string;
  children: React.ReactNode;
  className?: string;
  as?: 'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

/**
 * TextStyles Component
 * 
 * Applies Nexus Design System typography tokens to text content.
 * Can use predefined tokens or custom values.
 * 
 * @example
 * <TextStyles token="body-base">This is body text</TextStyles>
 * <TextStyles token="heading-lg">This is a heading</TextStyles>
 * <TextStyles fontSize="14px" lineHeight="20px" fontWeight="normal">Custom text</TextStyles>
 */
export const TextStyles: React.FC<TextStylesProps> = ({
  token,
  fontSize,
  lineHeight,
  fontWeight,
  fontFamily,
  children,
  className = '',
  as = 'p',
}) => {
  let style: React.CSSProperties = {};
  let tokenInfo: TextToken | undefined;

  if (token) {
    tokenInfo = textTokens[token];
    if (tokenInfo) {
      style = {
        fontSize: tokenInfo.fontSize,
        lineHeight: tokenInfo.lineHeight,
        fontWeight: tokenInfo.fontWeight ? fontWeights[tokenInfo.fontWeight] : undefined,
        fontFamily: tokenInfo.fontFamily,
      };
    }
  } else {
    style = {
      fontSize: fontSize,
      lineHeight: lineHeight,
      fontWeight: fontWeight ? fontWeights[fontWeight] : undefined,
      fontFamily: fontFamily,
    };
  }

  const Component = as;

  return (
    <Component
      style={style}
      className={className}
    >
      {children}
    </Component>
  );
};

/**
 * TextStylesDemo Component
 * 
 * Displays all text tokens for design system documentation.
 */
interface TextStylesDemoProps {
  category?: keyof typeof semanticTextStyles;
  className?: string;
}

export const TextStylesDemo: React.FC<TextStylesDemoProps> = ({
  category,
  className = '',
}) => {
  const tokensToShow = category
    ? Object.entries(semanticTextStyles[category] as Record<string, TextToken>)
    : Object.entries(textTokens);

  return (
    <div className={`flex flex-col gap-6 ${className}`}>
      {tokensToShow.map(([key, token]) => (
        <div key={key} className="flex flex-col gap-2">
          <TextStyles
            token={key}
            className="text-grey-scale-700"
          >
            {token.name}
          </TextStyles>
          <div className="text-xs text-cool-grey-700 font-mono">
            {token.fontSize} / {token.lineHeight}
            {token.fontWeight && ` / ${token.fontWeight}`}
          </div>
          <TextStyles token={key} className="text-grey-scale-600">
            The quick brown fox jumps over the lazy dog. 1234567890
          </TextStyles>
        </div>
      ))}
    </div>
  );
};

/**
 * Predefined text style components for common use cases
 */
export const BodyText: React.FC<Omit<TextStylesProps, 'token'> & { variant?: 'xs' | 'sm' | 'base' | 'lg' }> = ({
  variant = 'base',
  children,
  className = '',
  ...props
}) => {
  const tokenMap = {
    xs: 'body-xs',
    sm: 'body-sm',
    base: 'body-base',
    lg: 'body-lg',
  };

  return (
    <TextStyles
      token={tokenMap[variant]}
      className={className}
      {...props}
    >
      {children}
    </TextStyles>
  );
};

export const Heading: React.FC<Omit<TextStylesProps, 'token'> & { variant?: 'sm' | 'base' | 'lg' | 'xl' }> = ({
  variant = 'base',
  children,
  className = '',
  as,
  ...props
}) => {
  const tokenMap = {
    sm: 'heading-sm',
    base: 'heading-base',
    lg: 'heading-lg',
    xl: 'heading-xl',
  };

  const defaultAs = variant === 'xl' ? 'h1' : variant === 'lg' ? 'h2' : variant === 'base' ? 'h3' : 'h4';

  return (
    <TextStyles
      token={tokenMap[variant]}
      className={className}
      as={as || defaultAs}
      {...props}
    >
      {children}
    </TextStyles>
  );
};

export const ButtonText: React.FC<Omit<TextStylesProps, 'token'> & { variant?: 'default' | 'ghost' | 'iconText' | 'dropdown' }> = ({
  variant = 'default',
  children,
  className = '',
  ...props
}) => {
  const tokenMap = {
    default: 'button-default',
    ghost: 'button-ghost-primary',
    iconText: 'button-icon-text',
    dropdown: 'button-dropdown',
  };

  return (
    <TextStyles
      token={tokenMap[variant]}
      className={className}
      {...props}
    >
      {children}
    </TextStyles>
  );
};






