import React from 'react';
import { colorTokens, ColorToken, semanticColors } from './colorTokens';

interface ColorSwatchProps {
  token?: string;
  color?: string;
  name?: string;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * ColorSwatch Component
 * 
 * Displays a color swatch from the Nexus Design System.
 * Can be used for documentation, design system reference, or as a visual color indicator.
 * 
 * @example
 * <ColorSwatch token="blue-600" showDetails />
 * <ColorSwatch color="#0068bc" name="Primary Blue" />
 */
export const ColorSwatch: React.FC<ColorSwatchProps> = ({
  token,
  color,
  name,
  showDetails = false,
  size = 'md',
  className = '',
}) => {
  let displayColor: string;
  let displayName: string;
  let tokenInfo: ColorToken | undefined;

  if (token) {
    tokenInfo = colorTokens[token];
    displayColor = tokenInfo?.value || '#000000';
    displayName = tokenInfo?.name || token;
  } else if (color) {
    displayColor = color;
    displayName = name || color;
  } else {
    return null;
  }

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <div className={`flex flex-col items-start gap-2 ${className}`}>
      <div
        className={`${sizeClasses[size]} rounded border border-grey-scale-200`}
        style={{ backgroundColor: displayColor }}
        aria-label={`Color swatch: ${displayName}`}
      />
      {showDetails && (
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-grey-scale-700">{displayName}</span>
          {tokenInfo && (
            <>
              <span className="text-xs text-grey-scale-600 font-mono">{displayColor}</span>
              {tokenInfo.usage && (
                <span className="text-xs text-cool-grey-700">{tokenInfo.usage}</span>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * ColorSwatchGrid Component
 * 
 * Displays a grid of color swatches for design system documentation.
 */
interface ColorSwatchGridProps {
  scale?: string;
  showDetails?: boolean;
  className?: string;
}

export const ColorSwatchGrid: React.FC<ColorSwatchGridProps> = ({
  scale,
  showDetails = true,
  className = '',
}) => {
  const tokensToShow = scale
    ? Object.entries(colorTokens).filter(([_, token]) => token.scale === scale)
    : Object.entries(colorTokens);

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 ${className}`}>
      {tokensToShow.map(([key, token]) => (
        <ColorSwatch
          key={key}
          token={key}
          showDetails={showDetails}
          size="lg"
        />
      ))}
    </div>
  );
};

/**
 * SemanticColorSwatch Component
 * 
 * Displays semantic color mappings for common UI patterns.
 */
interface SemanticColorSwatchProps {
  category: keyof typeof semanticColors;
  showDetails?: boolean;
  className?: string;
}

export const SemanticColorSwatch: React.FC<SemanticColorSwatchProps> = ({
  category,
  showDetails = true,
  className = '',
}) => {
  const categoryColors = semanticColors[category];

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <h3 className="text-base font-semibold text-grey-scale-700 capitalize">{category}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {Object.entries(categoryColors as Record<string, string>).map(([key, value]) => (
          <ColorSwatch
            key={key}
            color={value}
            name={key}
            showDetails={showDetails}
            size="md"
          />
        ))}
      </div>
    </div>
  );
};






