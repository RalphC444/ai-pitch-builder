import React, { useState } from 'react';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { colorIcon, toolbarButtonSx, toolbarColor } from './toolbarStyles';

interface ToolbarDropdownButtonProps {
  /**
   * Main icon (e.g. translation)
   */
  icon: React.ReactNode;
  /**
   * Chevron icon - rotates when the menu is open
   */
  chevronIcon: React.ReactNode;
  /**
   * Menu options; without options the button just calls onClick
   */
  options?: Array<{
    label: string;
    value: string;
    onClick?: () => void;
  }>;
  /**
   * Click handler when there are no options
   */
  onClick?: () => void;
  /**
   * Whether button is active
   */
  active?: boolean;
  /**
   * Accessibility label
   */
  'aria-label'?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * ToolbarDropdownButton Component
 *
 * Icon + chevron toolbar button that opens an MUI menu.
 *
 * @example
 * <ToolbarDropdownButton
 *   icon={<TranslationIcon />}
 *   chevronIcon={<ChevronIcon />}
 *   options={[
 *     { label: "Option 1", value: "opt1" },
 *     { label: "Option 2", value: "opt2" }
 *   ]}
 * />
 */
export const ToolbarDropdownButton: React.FC<ToolbarDropdownButtonProps> = ({
  icon,
  chevronIcon,
  options = [],
  onClick,
  active = false,
  'aria-label': ariaLabel,
  className = '',
}) => {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const isOpen = Boolean(anchor);
  const color = toolbarColor(active || isOpen);

  return (
    <>
      <Button
        onClick={(event) => (options.length > 0 ? setAnchor(event.currentTarget) : onClick?.())}
        className={className}
        aria-label={ariaLabel}
        aria-pressed={active}
        aria-expanded={options.length > 0 ? isOpen : undefined}
        aria-haspopup={options.length > 0 ? 'menu' : undefined}
        onMouseDown={(event) => event.preventDefault()} // Keep editor selections
        sx={{ ...toolbarButtonSx(active || isOpen), minWidth: 0, p: '10px', gap: 0.5 }}
      >
        <span className="size-5 flex items-center justify-center shrink-0">{colorIcon(icon, color)}</span>
        <span className="size-5 flex items-center justify-center shrink-0 transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : undefined }}>
          {colorIcon(chevronIcon, color)}
        </span>
      </Button>
      <Menu
        anchorEl={anchor}
        open={isOpen}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { minWidth: 200, mt: 0.5 } } }}
      >
        {options.map((option) => (
          <MenuItem
            key={option.value}
            onClick={() => {
              option.onClick?.();
              setAnchor(null);
            }}
          >
            {option.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default ToolbarDropdownButton;
