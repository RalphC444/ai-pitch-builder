import React from 'react';
import Button from '@mui/material/Button';
import { toolbarButtonSx } from './toolbarStyles';

interface ToolbarTextButtonProps {
  /**
   * Button label text
   */
  label: string;
  /**
   * Click handler
   */
  onClick?: () => void;
  /**
   * Whether button is active
   */
  active?: boolean;
  /**
   * Whether this is a primary button (blue background)
   */
  primary?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Accessibility label
   */
  'aria-label'?: string;
}

/**
 * ToolbarTextButton Component
 *
 * Round text-only toolbar button (MUI Button); primary is the blue CTA.
 *
 * @example
 * <ToolbarTextButton label="Save Pitches" onClick={handleSave} />
 */
export const ToolbarTextButton: React.FC<ToolbarTextButtonProps> = ({
  label,
  onClick,
  active = false,
  primary = false,
  className = '',
  'aria-label': ariaLabel,
}) => (
  <Button
    onClick={onClick}
    className={className}
    aria-label={ariaLabel || label}
    aria-pressed={active}
    sx={{ ...toolbarButtonSx(active, primary), px: 2 }}
  >
    {label}
  </Button>
);

export default ToolbarTextButton;
