import React, { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListSubheader from '@mui/material/ListSubheader';
import Chip from '@mui/material/Chip';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';

export interface KebabMenuItem {
  label: string;
  /** Secondary line under the label */
  description?: string;
  /** Show a checkmark (current selection) */
  checked?: boolean;
  /** Small pill after the label, e.g. "V1" */
  badge?: string;
  onClick: () => void;
}

export interface KebabMenuProps {
  items: KebabMenuItem[];
  /** Optional heading above the items */
  heading?: string;
  'aria-label'?: string;
  /** Open the menu above the button (for buttons near the bottom of the screen) */
  placement?: 'bottom' | 'top';
  /** Raised white circle with a shadow, for a floating button */
  floating?: boolean;
  className?: string;
}

/**
 * KebabMenu Component
 *
 * "More options" icon button with an MUI menu. Closes on outside click,
 * Escape, or selecting an item.
 */
export const KebabMenu: React.FC<KebabMenuProps> = ({
  items,
  heading,
  'aria-label': ariaLabel = 'More options',
  placement = 'bottom',
  floating = false,
  className = '',
}) => {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const isOpen = Boolean(anchor);

  return (
    <div className={className}>
      <IconButton
        onClick={(event) => setAnchor(event.currentTarget)}
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        sx={floating ? {
          width: 48,
          height: 48,
          backgroundColor: isOpen ? '#ebf5fd' : '#ffffff',
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.16)',
          '&:hover': { backgroundColor: '#f6f8fb' },
        } : { color: isOpen ? 'primary.main' : undefined }}
      >
        <MoreVertRoundedIcon />
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={isOpen}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: placement === 'top' ? 'top' : 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: placement === 'top' ? 'bottom' : 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { width: 'min(300px, calc(100vw - 32px))', borderRadius: '8px', mt: placement === 'top' ? -1 : 0.5 } } }}
        MenuListProps={{
          subheader: heading ? <ListSubheader sx={{ lineHeight: '32px', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{heading}</ListSubheader> : undefined,
        }}
      >
        {items.map((item) => (
          <MenuItem
            key={item.label}
            selected={item.checked}
            onClick={() => {
              item.onClick();
              setAnchor(null);
            }}
            sx={{ alignItems: 'flex-start', gap: 1, whiteSpace: 'normal', py: 1 }}
          >
            <ListItemIcon sx={{ minWidth: 24, mt: 0.25, color: 'primary.main' }}>
              {item.checked && <CheckRoundedIcon fontSize="small" />}
            </ListItemIcon>
            <span className="flex flex-col min-w-0">
              <span className="flex items-center gap-2" style={{ fontSize: '14px', fontWeight: 600, color: '#333333' }}>
                {item.label}
                {item.badge && <Chip label={item.badge} size="small" sx={{ height: 18, fontSize: 11, backgroundColor: '#5c5c5c', color: '#ffffff' }} />}
              </span>
              {item.description && (
                <span style={{ fontSize: '12px', lineHeight: '16px', fontWeight: 500, color: '#5c5c5c' }}>{item.description}</span>
              )}
            </span>
          </MenuItem>
        ))}
      </Menu>
    </div>
  );
};

export default KebabMenu;
