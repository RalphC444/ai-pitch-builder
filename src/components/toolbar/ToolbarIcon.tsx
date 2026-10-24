import React from 'react';
import IconButton from '@mui/material/IconButton';
import { colorIcon, toolbarButtonSx, toolbarColor } from './toolbarStyles';

interface ToolbarIconProps {
  /**
   * Icon component
   */
  icon: React.ReactNode;
  /**
   * Click handler
   */
  onClick?: () => void;
  /**
   * Whether button is active
   */
  active?: boolean;
  /**
   * Size: small (20px icon, 10px padding) or large (24px icon, 8px padding)
   */
  size?: 'small' | 'large';
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
 * ToolbarIcon Component
 *
 * Round icon-only toolbar button (MUI IconButton) in small and large sizes.
 *
 * @example
 * <ToolbarIcon icon={<EditIcon />} size="small" onClick={handleEdit} aria-label="Edit" />
 */
export const ToolbarIcon: React.FC<ToolbarIconProps> = ({
  icon,
  onClick,
  active = false,
  size = 'small',
  className = '',
  'aria-label': ariaLabel,
}) => (
  <IconButton
    onClick={onClick}
    className={className}
    aria-label={ariaLabel}
    aria-pressed={active}
    sx={{ ...toolbarButtonSx(active), p: size === 'small' ? '10px' : '8px', minHeight: 0 }}
  >
    <span className={`flex items-center justify-center ${size === 'small' ? 'size-5' : 'size-6'}`}>
      {colorIcon(icon, toolbarColor(active))}
    </span>
  </IconButton>
);

export default ToolbarIcon;
