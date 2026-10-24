import React, { useId } from 'react';

interface DeleteIconProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * DeleteIcon Component
 * 
 * Delete/trash icon SVG for profile card actions.
 */
export const DeleteIcon: React.FC<DeleteIconProps> = ({
  className = '',
  style,
}) => {
  const maskId = useId();
  const fillColor = style?.color || 'rgba(0, 0, 0, 0.64)';
  
  return (
    <svg 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <mask id={maskId} style={{maskType: 'alpha'}} maskUnits="userSpaceOnUse" x="2" y="2" width="20" height="20">
        <rect x="2" y="2" width="20" height="20" fill="#D9D9D9"/>
      </mask>
      <g mask={`url(#${maskId})`}>
        <path 
          d="M8.5 19C8.0875 19 7.73438 18.8531 7.44062 18.5594C7.14687 18.2656 7 17.9125 7 17.5V7.5H6V6H10V5H14V6H18V7.5H17V17.491C17 17.9137 16.8531 18.2708 16.5594 18.5625C16.2656 18.8542 15.9125 19 15.5 19H8.5ZM15.5 7.5H8.5V17.5H15.5V7.5ZM10 16H11.5V9H10V16ZM12.5 16H14V9H12.5V16Z" 
          fill={fillColor}
        />
      </g>
    </svg>
  );
};

export default DeleteIcon;

