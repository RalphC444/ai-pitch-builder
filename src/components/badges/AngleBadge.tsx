import React from 'react';
import { TextStyles } from '../design-system/typography/TextStyles';
import { AngleIcon } from '../icons/AngleIcon';

interface AngleBadgeProps {
  /**
   * Number assigned to this angle (1, 2, 3, etc.)
   * Determines which angle {number}.svg file to use
   */
  number: number;
  /**
   * Text label for the angle badge
   * e.g., "Formers: Detroit Pistons", "Customer Of: Playfly"
   */
  label: string;
  className?: string;
}

/**
 * AngleBadge Component
 * 
 * Badge displaying an angle with a numbered icon.
 * Uses angle {number}.svg file based on the assigned number.
 * 
 * @example
 * <AngleBadge 
 *   number={1}
 *   label="Formers: Detroit Pistons"
 * />
 */
export const AngleBadge: React.FC<AngleBadgeProps> = ({
  number,
  label,
  className = '',
}) => {
  // Truncate label to max 25 characters
  const truncatedLabel = label.length > 25 ? label.substring(0, 22) + '...' : label;
  
  return (
    <div 
      className={`flex items-center rounded-md ${className}`}
      style={{ 
        height: '24px',
        paddingLeft: '6px',
        paddingRight: '6px',
        gap: '4px', // Gap between icon and text (30px - 6px padding - 20px icon = 4px)
        backgroundColor: 'rgba(0, 0, 0, 0.08)', // bg-black/8 - light gray background
      }}
      role="group"
      aria-label={`Angle ${number}: ${label}`}
      title={label} // Show full label on hover
    >
      <div className="flex items-center justify-center shrink-0" style={{ width: '20px', height: '20px' }}>
        <AngleIcon 
          number={number} 
          style={{ color: 'rgba(0, 0, 0, 0.8)' }} // Icon color: black with 80% opacity
        />
      </div>
      <span
        style={{
          fontFamily: "'Poppins', sans-serif",
          fontSize: '14px',
          lineHeight: '20px',
          fontWeight: 600, // Semibold
          color: 'rgba(0, 0, 0, 0.8)', // Text color: black with 80% opacity
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '200px', // Prevent badge from getting too wide
        }}
      >
        {truncatedLabel}
      </span>
    </div>
  );
};

export default AngleBadge;

