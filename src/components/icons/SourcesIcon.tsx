import React from 'react';

interface SourcesIconProps {
  className?: string;
  color?: string;
  size?: number;
}

export const SourcesIcon: React.FC<SourcesIconProps> = ({
  className = '',
  color = 'currentColor',
  size = 20,
}) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 20 20" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <mask id="mask0_sources" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20">
        <rect width="20" height="20" fill="#D9D9D9"/>
      </mask>
      <g mask="url(#mask0_sources)">
        <path fillRule="evenodd" clipRule="evenodd" d="M14.5 2.5C14.9125 2.5 15.2658 2.64668 15.5596 2.94043C15.8533 3.23418 16 3.5875 16 4V8.91602C15.5329 8.71192 15.0286 8.57689 14.5 8.52441V8H3.5V11H9.6709C9.40521 11.4591 9.20949 11.9636 9.10059 12.5H3.5V15H9.22852C9.40014 15.5465 9.66365 16.0523 10 16.5H3.5C3.09722 16.5 2.74685 16.3504 2.44824 16.0518C2.14963 15.7531 2 15.4028 2 15V4C2 3.5875 2.14963 3.23418 2.44824 2.94043C2.7468 2.64685 3.09734 2.5 3.5 2.5H14.5ZM3.5 6.5H14.5V4H3.5V6.5Z" fill={color}/>
        <path d="M14 9.5C14 11.7091 12.2091 13.5 10 13.5C12.2091 13.5 14 15.2909 14 17.5C14 15.2909 15.7909 13.5 18 13.5C15.7909 13.5 14 11.7091 14 9.5Z" fill={color}/>
      </g>
    </svg>
  );
};

export default SourcesIcon;






