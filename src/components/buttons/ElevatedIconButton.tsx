import React from 'react';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

interface ElevatedIconButtonProps {
  /** Tooltip text and accessible name */
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  /** Success colour, e.g. right after a copy */
  isDone?: boolean;
  tooltipPlacement?: 'top' | 'left' | 'right' | 'bottom';
}

/**
 * ElevatedIconButton
 *
 * Small white icon button with a hairline border and soft shadow, used for
 * quick utility actions that sit on top of content (copy, open profile data).
 */
export const ElevatedIconButton: React.FC<ElevatedIconButtonProps> = ({
  label,
  icon,
  onClick,
  isDone = false,
  tooltipPlacement = 'top',
}) => (
  <Tooltip title={label} placement={tooltipPlacement}>
    <IconButton
      onClick={onClick}
      aria-label={label}
      size="small"
      sx={{
        flexShrink: 0,
        backgroundColor: '#ffffff',
        border: '1px solid #e3e6eb',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
        color: isDone ? '#149c4d' : '#5c5c5c',
        '&:hover': { backgroundColor: '#f6f8fb', color: isDone ? '#149c4d' : '#0068bc' },
      }}
    >
      {icon}
    </IconButton>
  </Tooltip>
);

export default ElevatedIconButton;
