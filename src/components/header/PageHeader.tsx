import React, { useState, useEffect, useRef } from 'react';
import { Toolbar } from '../toolbar/Toolbar';
import { useMediaQuery, MOBILE_QUERY } from '../../hooks/useMediaQuery';

interface PageHeaderProps {
  /**
   * Page title
   */
  title: string;
  /**
   * Toolbar buttons
   */
  toolbarButtons?: Array<{
    icon?: React.ReactNode;
    label: string;
    onClick?: () => void;
    active?: boolean;
    primary?: boolean;
    'aria-label'?: string;
  }>;
  /**
   * Icon-only buttons for toolbar
   */
  toolbarIconButtons?: Array<{
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
   * Whether the profile drawer is open (affects layout width)
   */
  isDrawerOpen?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * PageHeader Component
 * 
 * Sticky header with page title and main action toolbar.
 * Matches Figma design specifications exactly.
 * Positioned 64px from top (below navigation), 72px height.
 * 
 * @example
 * <PageHeader
 *   title="Curate Advisor Pitches"
 *   toolbarButtons={[
 *     { icon: <Icon />, label: "Save Pitches", onClick: handleSave }
 *   ]}
 * />
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  toolbarButtons = [],
  toolbarIconButtons = [],
  dropdownButton,
  isDrawerOpen = false,
  className = '',
}) => {
  const [isSticky, setIsSticky] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery(MOBILE_QUERY);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      // Header is sticky when scrolled past its base position (at the top of the page)
      // When scrollY is 0, we're at the base position, so no shadow
      // When scrollY > 0, the header is sticky and should have shadow
      setIsSticky(scrollY > 0);
    };

    // Check initial state
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const titleElement = (
    <h1
      style={{
        fontFamily: "'Poppins', sans-serif",
        color: '#333333', // grey-scale-700
        fontSize: '20px',
        lineHeight: '24px',
        fontWeight: 'bold',
      }}
    >
      {title}
    </h1>
  );

  const hasActionButtons = toolbarButtons.length > 0 || toolbarIconButtons.length > 0;

  // Phones: two rows - title + dropdown, then the action toolbar
  if (isMobile) {
    return (
      <div
        ref={headerRef}
        className={`sticky z-40 bg-cool-grey-100 ${className}`}
        style={{
          top: '64px', // Below navigation (64px height)
          paddingTop: isSticky ? '12px' : '16px',
          paddingBottom: '12px',
          boxShadow: isSticky ? '0px 2px 8px rgba(0, 0, 0, 0.08)' : 'none', // Drop shadow only when sticky
        }}
      >
        <div className="content-container flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            {titleElement}
            {dropdownButton && <Toolbar dropdownButton={dropdownButton} />}
          </div>
          {hasActionButtons && (
            <Toolbar
              buttons={toolbarButtons}
              iconButtons={toolbarIconButtons}
              className="self-start" // Hug the buttons rather than fill the width
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={headerRef}
      className={`sticky z-40 bg-cool-grey-100 ${className}`}
      style={{
        top: '64px', // Below navigation (64px height)
        height: isSticky ? '72px' : 'auto', // Fixed height when sticky, auto when at base
        paddingTop: isSticky ? '12px' : '32px', // 12px when sticky, 32px at base
        paddingBottom: isSticky ? '12px' : '0px', // 12px when sticky, 0px at base
        boxShadow: isSticky ? '0px 2px 8px rgba(0, 0, 0, 0.08)' : 'none', // Drop shadow only when sticky
      }}
    >
      <div
        className={`flex items-center justify-between ${isDrawerOpen ? 'header-content-drawer-open' : 'content-container'}`}
        style={{
          height: isSticky ? '48px' : 'auto',
        }}
      >
        {titleElement}

        {hasActionButtons || dropdownButton ? (
          <Toolbar
            buttons={toolbarButtons}
            iconButtons={toolbarIconButtons}
            dropdownButton={dropdownButton}
          />
        ) : null}
      </div>
    </div>
  );
};

export default PageHeader;

