import React from 'react';

interface RewriteIconProps {
  className?: string;
  color?: string;
  size?: number;
}

export const RewriteIcon: React.FC<RewriteIconProps> = ({
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
      <mask id="mask0_rewrite" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20">
        <rect width="20" height="20" fill="#D9D9D9"/>
      </mask>
      <g mask="url(#mask0_rewrite)">
        <path d="M5.5 16H6.5625L14.375 8.1875L13.3125 7.125L5.5 14.9375V16ZM4 17.5V14.3125L14.375 3.9375C14.5278 3.78472 14.6933 3.67361 14.8716 3.60417C15.0499 3.53472 15.2374 3.5 15.4341 3.5C15.6308 3.5 15.8194 3.53472 16 3.60417C16.1806 3.67361 16.3472 3.78472 16.5 3.9375L17.5625 5C17.7153 5.15278 17.8264 5.31944 17.8958 5.5C17.9653 5.68056 18 5.86487 18 6.05296C18 6.25357 17.9651 6.44478 17.8954 6.62658C17.8256 6.8084 17.7147 6.97454 17.5625 7.125L7.1875 17.5H4ZM13.8344 7.66556L13.3125 7.125L14.375 8.1875L13.8344 7.66556Z" fill={color}/>
        <path d="M6 2.5C6 4.70914 4.20914 6.5 2 6.5C4.20914 6.5 6 8.29086 6 10.5C6 8.29086 7.79086 6.5 10 6.5C7.79086 6.5 6 4.70914 6 2.5Z" fill={color}/>
      </g>
    </svg>
  );
};

export default RewriteIcon;






