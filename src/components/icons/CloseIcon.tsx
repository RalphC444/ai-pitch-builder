import React, { useId } from 'react';

interface CloseIconProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * CloseIcon Component
 * 
 * Close/X icon SVG from Figma design.
 */
export const CloseIcon: React.FC<CloseIconProps> = ({
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
          d="M6.0625 15L5 13.9375L8.9375 10L5 6.0625L6.0625 5L10 8.9375L13.9375 5L15 6.0625L11.0625 10L15 13.9375L13.9375 15L10 11.0625L6.0625 15Z" 
          fill={fillColor}
        />
      </g>
    </svg>
  );
};

export default CloseIcon;






