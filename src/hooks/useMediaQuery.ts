import { useEffect, useState } from 'react';

/**
 * Phones - single column, stacked header, tighter spacing.
 * Matches Tailwind's `sm` breakpoint (640px).
 */
export const MOBILE_QUERY = '(max-width: 639px)';

/**
 * Phones and tablets - not enough room for the 616px inline drawer
 * next to the cards, so the drawer becomes an overlay sheet.
 * Matches Tailwind's `lg` breakpoint (1024px).
 */
export const COMPACT_QUERY = '(max-width: 1023px)';

const getMatches = (query: string) =>
  typeof window !== 'undefined' && window.matchMedia(query).matches;

/**
 * useMediaQuery Hook
 *
 * Returns whether the given media query currently matches, and updates on change.
 *
 * @example
 * const isMobile = useMediaQuery(MOBILE_QUERY);
 */
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(() => getMatches(query));

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    const handleChange = () => setMatches(mediaQueryList.matches);

    handleChange();
    mediaQueryList.addEventListener('change', handleChange);
    return () => mediaQueryList.removeEventListener('change', handleChange);
  }, [query]);

  return matches;
};

export default useMediaQuery;
