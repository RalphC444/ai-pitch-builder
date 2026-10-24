import React from 'react';

interface UnvettedBadgeProps {
  className?: string;
}

/**
 * UnvettedBadge Component
 * 
 * Badge indicating that an advisor has not been vetted yet.
 * Uses orange color scheme from Nexus Design System.
 * Matches Figma design exactly.
 * 
 * @example
 * <UnvettedBadge />
 */
export const UnvettedBadge: React.FC<UnvettedBadgeProps> = ({
  className = '',
}) => {
  return (
    <div 
      className={`flex items-center justify-end rounded-md ${className}`}
      style={{
        height: '24px',
        paddingLeft: '6px',
        paddingRight: '6px',
        paddingTop: '7px',
        paddingBottom: '7px',
        backgroundColor: '#ffebd8', // orange-50
        borderRadius: '6px',
      }}
      role="status"
      aria-label="Unvetted advisor"
    >
      <span
        style={{
          fontFamily: "'Poppins', sans-serif",
          fontSize: '14px',
          lineHeight: '20px',
          fontWeight: 600, // Demi Bold
          color: '#ff820e', // orange-500
        }}
      >
        Unvetted
      </span>
    </div>
  );
};

export default UnvettedBadge;

