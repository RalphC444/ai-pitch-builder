import React, { useId } from 'react';

interface OpenProfileDetailsIconProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * OpenProfileDetailsIcon Component
 * 
 * Open profile details icon SVG for profile card actions.
 */
export const OpenProfileDetailsIcon: React.FC<OpenProfileDetailsIconProps> = ({
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
      <mask id={maskId} style={{maskType: 'alpha'}} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
        <rect width="24" height="24" fill="#D9D9D9"/>
      </mask>
      <g mask={`url(#${maskId})`}>
        <path 
          d="M4.20039 19.8002C3.70539 19.8002 3.28164 19.6294 2.92914 19.2877C2.57664 18.946 2.40039 18.5169 2.40039 18.0002V6.0252C2.40039 5.52336 2.57664 5.0937 2.92914 4.7362C3.28164 4.37886 3.70539 4.2002 4.20039 4.2002H19.8004C20.2954 4.2002 20.7191 4.37886 21.0716 4.7362C21.4241 5.0937 21.6004 5.52336 21.6004 6.0252V18.0002C21.6004 18.5169 21.4241 18.946 21.0716 19.2877C20.7191 19.6294 20.2954 19.8002 19.8004 19.8002H4.20039ZM17.4004 8.8002H19.8004V6.0002H17.4004V8.8002ZM17.4004 13.4002H19.8004V10.6002H17.4004V13.4002ZM4.20039 18.0002H15.6004V6.0002H4.20039V18.0002ZM17.4004 18.0002H19.8004V15.2002H17.4004V18.0002Z" 
          fill={fillColor}
        />
      </g>
    </svg>
  );
};

export default OpenProfileDetailsIcon;






