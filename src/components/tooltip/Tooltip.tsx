import React from 'react';
import MuiTooltip from '@mui/material/Tooltip';

export interface TooltipProps {
  content: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Tooltip Component
 *
 * Dark themed MUI tooltip that appears on hover / focus.
 * Matches Figma design.
 */
export const Tooltip: React.FC<TooltipProps> = ({ content, children, className = '' }) => (
  <MuiTooltip title={content}>
    <span className={`inline-flex ${className}`}>{children}</span>
  </MuiTooltip>
);

export default Tooltip;
