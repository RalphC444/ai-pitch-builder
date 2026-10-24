import React from 'react';
import Button from '@mui/material/Button';
import { colorIcon, toolbarButtonSx, toolbarColor } from './toolbarStyles';

interface ToolbarIconTextButtonProps {
  /**
   * Icon component
   */
  icon: React.ReactNode;
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
 * ToolbarIconTextButton Component
 *
 * Round icon + text toolbar button (MUI Button), with default, hover,
 * active and primary states from the Nexus toolbar tokens.
 *
 * @example
 * <ToolbarIconTextButton icon={<CloseIcon />} label="Close" onClick={handleClose} />
 */
export const ToolbarIconTextButton: React.FC<ToolbarIconTextButtonProps> = ({
  icon,
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
    startIcon={<span className="flex items-center justify-center size-5">{colorIcon(icon, toolbarColor(active, primary))}</span>}
    sx={{ ...toolbarButtonSx(active, primary), pl: 1.5, pr: 2, '& .MuiButton-startIcon': { mr: 0.5, ml: 0 } }}
  >
    {label}
  </Button>
);

export default ToolbarIconTextButton;
