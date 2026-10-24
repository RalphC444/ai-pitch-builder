import React from 'react';
import type { SxProps, Theme } from '@mui/material/styles';

/** Text / icon colour for toolbar buttons by state (Nexus toolbar tokens) */
export const toolbarColor = (active?: boolean, primary?: boolean) => {
  if (primary) return '#ffffff';
  if (active) return '#0068bc';
  return 'rgba(0, 0, 0, 0.64)';
};

/** Shared MUI styling for round toolbar buttons */
export const toolbarButtonSx = (active?: boolean, primary?: boolean): SxProps<Theme> => ({
  borderRadius: '1000px',
  minHeight: 40,
  fontSize: 14,
  fontWeight: 600,
  lineHeight: '16px',
  color: toolbarColor(active, primary),
  backgroundColor: primary ? '#0068bc' : active ? 'rgba(0, 130, 235, 0.08)' : 'transparent',
  '&:hover': { backgroundColor: primary ? 'rgba(0, 104, 188, 0.9)' : active ? 'rgba(0, 130, 235, 0.12)' : 'rgba(0, 0, 0, 0.04)' },
  '&:active': { backgroundColor: primary ? '#005296' : 'rgba(0, 130, 235, 0.08)' },
});

/**
 * Give an icon the button's colour. Figma SVG icons read `style.color`;
 * MUI icons also inherit it.
 */
export const colorIcon = (icon: React.ReactNode, color: string) =>
  React.isValidElement(icon)
    ? React.cloneElement(icon as React.ReactElement<{ style?: React.CSSProperties }>, {
        style: { ...((icon.props as { style?: React.CSSProperties }).style || {}), color },
      })
    : icon;
