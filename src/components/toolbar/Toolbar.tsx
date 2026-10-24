import React from 'react';
import { ToolbarIcon } from './ToolbarIcon';
import { ToolbarIconTextButton } from './ToolbarIconTextButton';
import { ToolbarTextButton } from './ToolbarTextButton';
import { ToolbarDropdownButton } from './ToolbarDropdownButton';

export interface ToolbarButton {
  /**
   * Icon component (optional)
   */
  icon?: React.ReactNode;
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
   * Accessibility label
   */
  'aria-label'?: string;
}

export interface ToolbarProps {
  /**
   * Array of toolbar buttons with icon and text
   */
  buttons?: ToolbarButton[];
  /**
   * Array of icon-only buttons
   */
  iconButtons?: Array<{
    icon: React.ReactNode;
    onClick?: () => void;
    active?: boolean;
    'aria-label'?: string;
  }>;
  /**
   * Dropdown button with translation icon and chevron
   */
  dropdownButton?: {
    icon: React.ReactNode;
    chevronIcon: React.ReactNode;
    options?: Array<{
      label: string;
      value: string;
      onClick?: () => void;
    }>;
    onClick?: () => void;
    active?: boolean;
    'aria-label'?: string;
  };
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Toolbar Component
 * 
 * Toolbar with support for icon+text buttons and icon-only buttons.
 * Matches Figma design specifications.
 * 
 * @example
 * <Toolbar
 *   buttons={[
 *     { icon: <SaveIcon />, label: "Save", onClick: handleSave },
 *     { icon: <SendIcon />, label: "Send", active: true }
 *   ]}
 *   iconButtons={[
 *     { icon: <EditIcon />, onClick: handleEdit }
 *   ]}
 * />
 */
export const Toolbar: React.FC<ToolbarProps> = ({
  buttons = [],
  iconButtons = [],
  dropdownButton,
  className = '',
}) => {
  return (
    <div 
      className={`bg-white flex items-center rounded-3xl shadow-sm ${className}`}
      style={{
        padding: '4px',
        gap: '8px', // Spacing between toolbar items
      }}
      role="toolbar"
      aria-label="Toolbar"
    >
      {/* Dropdown Button with Translation Icon and Chevron */}
      {dropdownButton && (
        <ToolbarDropdownButton
          icon={dropdownButton.icon}
          chevronIcon={dropdownButton.chevronIcon}
          options={dropdownButton.options}
          onClick={dropdownButton.onClick}
          active={dropdownButton.active}
          aria-label={dropdownButton['aria-label']}
        />
      )}

      {/* Divider after dropdown button */}
      {dropdownButton && (buttons.length > 0 || iconButtons.length > 0) && (
        <div 
          className="h-6 w-px bg-grey-scale-200"
          aria-hidden="true"
        />
      )}

      {/* Icon + Text Buttons or Text Only Buttons */}
      {buttons.map((button, index) => {
        const hasIcon = button.icon !== null && button.icon !== undefined;
        
        if (hasIcon) {
          return (
            <ToolbarIconTextButton
              key={index}
              icon={button.icon}
              label={button.label}
              onClick={button.onClick}
              active={button.active}
              primary={button.primary}
              aria-label={button['aria-label']}
            />
          );
        } else {
          return (
            <ToolbarTextButton
              key={index}
              label={button.label}
              onClick={button.onClick}
              active={button.active}
              primary={button.primary}
              aria-label={button['aria-label']}
            />
          );
        }
      })}

      {/* Divider */}
      {buttons.length > 0 && iconButtons.length > 0 && (
        <div 
          className="h-6 w-px bg-grey-scale-200"
          aria-hidden="true"
        />
      )}

      {/* Icon-Only Buttons */}
      {iconButtons.map((button, index) => (
        <ToolbarIcon
          key={index}
          icon={button.icon}
          onClick={button.onClick}
          active={button.active}
          size="small"
          aria-label={button['aria-label']}
        />
      ))}
    </div>
  );
};

export default Toolbar;

