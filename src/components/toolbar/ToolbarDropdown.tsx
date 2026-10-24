import React, { useState, useRef, useEffect } from 'react';
import { TextStyles } from '../design-system/typography/TextStyles';

export interface DropdownOption {
  /**
   * Option label
   */
  label: string;
  /**
   * Option value
   */
  value: string;
  /**
   * Click handler for this option
   */
  onClick?: () => void;
}

export interface ToolbarDropdownProps {
  /**
   * Icon component
   */
  icon: React.ReactNode;
  /**
   * Dropdown label
   */
  label: string;
  /**
   * Dropdown options
   */
  options: DropdownOption[];
  /**
   * Currently selected value
   */
  value?: string;
  /**
   * Change handler
   */
  onChange?: (value: string) => void;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * ToolbarDropdown Component
 * 
 * Dropdown button for toolbars with icon, label, and chevron.
 * Opens a menu with selectable options.
 * 
 * @example
 * <ToolbarDropdown
 *   icon={<GenerateIcon />}
 *   label="Generate Summaries"
 *   options={[
 *     { label: "Option 1", value: "opt1" },
 *     { label: "Option 2", value: "opt2" }
 *   ]}
 *   onChange={(value) => console.log(value)}
 * />
 */
export const ToolbarDropdown: React.FC<ToolbarDropdownProps> = ({
  icon,
  label,
  options,
  value,
  onChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-3 py-2.5 rounded-full hover:bg-black/4 transition-colors"
        aria-label={label}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="size-5 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <TextStyles 
          token="button-dropdown"
          className="capitalize text-black/64"
        >
          {selectedOption?.label || label}
        </TextStyles>
        <div className="size-5 flex items-center justify-center shrink-0">
          <svg 
            className="size-5" 
            viewBox="0 0 20 20" 
            fill="none"
            aria-hidden="true"
          >
            <path 
              d="M5 7.5L10 12.5L15 7.5" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="text-black/64"
            />
          </svg>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className="absolute top-full left-0 mt-1 bg-white border border-grey-scale-200 rounded-md shadow-lg z-50 min-w-[200px]"
          role="menu"
        >
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange?.(option.value);
                option.onClick?.();
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 hover:bg-cool-grey-100 transition-colors ${
                option.value === value ? 'bg-blue-600/8' : ''
              }`}
              role="menuitem"
            >
              <TextStyles 
                token="body-sm"
                className={option.value === value ? 'text-blue-600' : 'text-grey-scale-700'}
              >
                {option.label}
              </TextStyles>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ToolbarDropdown;






