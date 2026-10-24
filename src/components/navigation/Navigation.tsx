import React from 'react';
import { ToolbarIconTextButton } from '../toolbar/ToolbarIconTextButton';
import { ToolbarIcon } from '../toolbar/ToolbarIcon';
import { ToolbarDropdownButton } from '../toolbar/ToolbarDropdownButton';
import { CloseIcon } from '../icons/CloseIcon';
import { CampaignIcon } from '../icons/CampaignIcon';
import { KebabMenu, KebabMenuItem } from '../menu/KebabMenu';
import { Tooltip } from '../tooltip/Tooltip';
import { NAV_ACTIONS_ID } from './NavActions';
import { GuidepointLogo } from '../brand/GuidepointLogo';
import { useMediaQuery, MOBILE_QUERY } from '../../hooks/useMediaQuery';
import aiSparkleUrl from '../../assets/ai.svg';

export interface NavigationBreadcrumb {
  label: string;
  icon?: React.ReactNode;
}

interface NavigationProps {
  requestNumber?: string;
  /**
   * Breadcrumbs after the request number, e.g. Express List • Email
   */
  breadcrumbs?: NavigationBreadcrumb[];
  /**
   * Small pill after the breadcrumbs, e.g. "V1"
   */
  versionBadge?: string;
  /**
   * Translation dropdown (icon + chevron + options)
   */
  translationDropdown?: {
    icon: React.ReactNode;
    chevronIcon: React.ReactNode;
    options?: Array<{ label: string; value: string; onClick?: () => void }>;
    'aria-label'?: string;
  };
  /**
   * Opens the Edit Prompt flow
   */
  onEditPrompt?: () => void;
  isEditPromptActive?: boolean;
  /**
   * Items for the kebab ("more options") menu
   */
  menuItems?: KebabMenuItem[];
  menuHeading?: string;
  /** Extra actions before Close (e.g. the Express List CTAs) */
  actions?: React.ReactNode;
  /** Omit to hide Close */
  onClose?: () => void;
  className?: string;
}

const textStyle: React.CSSProperties = {
  fontFamily: "'Poppins', sans-serif",
  color: '#1c2024',
};

/**
 * Navigation Component
 *
 * Top navigation bar for the Pitch Curation tool.
 * Matches Figma design exactly with 12px top/bottom padding and 48px left/right padding.
 * Actions collapse to icon-only buttons on phones.
 *
 * @example
 * <Navigation
 *   requestNumber="#1085069"
 *   breadcrumbs={[{ label: 'Express List' }, { label: 'Email' }]}
 *   onEditPrompt={openPromptDrawer}
 *   onClose={() => console.log('Close clicked')}
 * />
 */
export const Navigation: React.FC<NavigationProps> = ({
  requestNumber = '#1085069',
  breadcrumbs = [{ label: 'Pitch Builder', icon: <CampaignIcon /> }],
  versionBadge,
  translationDropdown,
  onEditPrompt,
  isEditPromptActive = false,
  menuItems,
  menuHeading,
  actions,
  onClose,
  className = '',
}) => {
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const sparkleIcon = <img src={aiSparkleUrl} alt="" width={20} height={20} />;

  return (
    <nav
      className={`sticky top-0 z-50 bg-white flex items-center justify-between gap-3 w-full py-3 px-4 sm:px-12 ${className}`}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Left Side - Request Info and Breadcrumbs */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 whitespace-nowrap">
        <GuidepointLogo height={isMobile ? 18 : 22} />
        {requestNumber && (
          <span className="text-sm sm:text-base leading-normal font-bold shrink-0" style={textStyle}>
            <span className="hidden sm:inline">Request: </span>{requestNumber}
          </span>
        )}

        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={crumb.label}>
            {(requestNumber || index > 0) && (
              <span
                // Phones show only the logo and request number - the page title names the step
                className="text-sm sm:text-base leading-normal font-bold shrink-0 hidden sm:inline"
                style={textStyle}
                aria-hidden="true"
              >
                •
              </span>
            )}
            <div className="items-center gap-1 sm:gap-2 min-w-0 hidden sm:flex">
              {crumb.icon && (
                <div className="size-6 flex items-center justify-center shrink-0" style={{ color: '#1c2024' }}>
                  {crumb.icon}
                </div>
              )}
              <span className="text-sm sm:text-base leading-normal font-bold truncate" style={textStyle}>
                {crumb.label}
              </span>
            </div>
          </React.Fragment>
        ))}

        {versionBadge && (
          <span
            className="shrink-0 px-2 rounded"
            style={{ fontFamily: "'Poppins', sans-serif", fontSize: '11px', lineHeight: '18px', fontWeight: 600, backgroundColor: '#5c5c5c', color: '#ffffff' }}
          >
            {versionBadge}
          </span>
        )}
      </div>

      {/* Right Side - Actions (icon only on phones) */}
      <div className="flex items-center justify-end gap-1 sm:gap-2 shrink-0">
        {translationDropdown && (
          <ToolbarDropdownButton
            icon={translationDropdown.icon}
            chevronIcon={translationDropdown.chevronIcon}
            options={translationDropdown.options}
            aria-label={translationDropdown['aria-label']}
          />
        )}

        {onEditPrompt && (
          isMobile ? (
            <ToolbarIcon
              icon={sparkleIcon}
              onClick={onEditPrompt}
              active={isEditPromptActive}
              aria-label="Edit prompt"
            />
          ) : (
            <ToolbarIconTextButton
              icon={sparkleIcon}
              label="Edit Prompt"
              onClick={onEditPrompt}
              active={isEditPromptActive}
              aria-label="Edit prompt"
            />
          )
        )}

        {actions}

        {/* Step CTAs portal in here (see NavActions); divider before Close on larger screens */}
        <div id={NAV_ACTIONS_ID} className="flex items-center gap-2 empty:hidden sm:pr-3 sm:border-r border-grey-scale-200" />

        {menuItems && menuItems.length > 0 && (
          <KebabMenu items={menuItems} heading={menuHeading} aria-label="More options" />
        )}

        {onClose && (translationDropdown || onEditPrompt || menuItems || actions) && (
          <div className="h-6 w-px bg-grey-scale-200 hidden sm:block" aria-hidden="true" />
        )}

        {onClose && (
          <Tooltip content="Close">
            <ToolbarIcon icon={<CloseIcon />} onClick={onClose} aria-label="Close" />
          </Tooltip>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
