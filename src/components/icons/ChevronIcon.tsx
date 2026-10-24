import React, { useId } from 'react';

interface ChevronIconProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * ChevronIcon Component
 * 
 * Chevron/dropdown arrow icon SVG from Figma design.
 */
export const ChevronIcon: React.FC<ChevronIconProps> = ({
  className = '',
  style,
}) => {
  const maskId = useId();
  const fillColor = style?.color || 'rgba(0, 0, 0, 0.64)';
  
  return (
    <svg 
      width="20" 
      height="20" 
      viewBox="0 0 20 20" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <mask id={maskId} style={{maskType: 'alpha'}} maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20">
        <rect width="20" height="20" fill="#D9D9D9"/>
      </mask>
      <g mask={`url(#${maskId})`}>
        <path 
          d="M10 12L6 8H14L10 12Z" 
          fill={fillColor}
        />
      </g>
    </svg>
  );
};

export default ChevronIcon;

