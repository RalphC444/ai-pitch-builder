import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/** id of the slot in Navigation that NavActions renders into */
export const NAV_ACTIONS_ID = 'nav-step-actions';

/**
 * NavActions Component
 *
 * Renders a step's CTAs in the top nav (right side, before Close) so they stay
 * in reach while the page scrolls.
 */
export const NavActions: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => setTarget(document.getElementById(NAV_ACTIONS_ID)), []);

  return target ? createPortal(children, target) : null;
};

export default NavActions;
