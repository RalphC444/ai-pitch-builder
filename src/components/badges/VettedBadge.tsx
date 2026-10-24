import React from 'react';

interface VettedBadgeProps {
  className?: string;
}

/**
 * VettedBadge Component
 * 
 * Badge indicating that an advisor has been vetted.
 * Uses purple color scheme from Nexus Design System.
 * Matches Figma design exactly.
 * 
 * @example
 * <VettedBadge />
 */
export const VettedBadge: React.FC<VettedBadgeProps> = ({
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
        backgroundColor: '#f6f1ff', // purple-25
        borderRadius: '6px',
      }}
      role="status"
      aria-label="Vetted advisor"
    >
      <span
        style={{
          fontFamily: "'Poppins', sans-serif",
          fontSize: '14px',
          lineHeight: '20px',
          fontWeight: 600, // Demi Bold
          color: '#7445cc', // purple-600
        }}
      >
        Vetted
      </span>
    </div>
  );
};

export default VettedBadge;

