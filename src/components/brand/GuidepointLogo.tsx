import React, { useState } from 'react';

/** Drop the official logo here (public/guidepoint-logo.svg) and it replaces the stand-in */
const LOGO_SRC = `${process.env.PUBLIC_URL}/guidepoint-logo.svg`;

interface GuidepointLogoProps {
  /** Logotype height in px (brand: 40 for email headers, 24 in footers / nav) */
  height: number;
  /** "black" for yellow backgrounds (brand 1-color-black logo) */
  tone?: 'two-color' | 'black';
  className?: string;
}

/**
 * GuidepointLogo
 *
 * Uses the official logo file when it's in /public. Until then, shows a text
 * stand-in: the wordmark in black with the brand-yellow dot.
 */
export const GuidepointLogo: React.FC<GuidepointLogoProps> = ({ height, tone = 'two-color', className = '' }) => {
  const [hasFile, setHasFile] = useState(true);

  if (hasFile) {
    return (
      <img
        src={LOGO_SRC}
        alt="Guidepoint"
        style={{ height, width: 'auto' }}
        className={`block shrink-0 ${className}`}
        onError={() => setHasFile(false)}
      />
    );
  }

  return (
    <span
      className={`inline-flex items-baseline shrink-0 select-none ${className}`}
      style={{ height, fontFamily: "'Poppins', sans-serif", fontSize: height * 0.82, lineHeight: `${height}px`, fontWeight: 600, letterSpacing: '-0.035em', color: '#000000' }}
      role="img"
      aria-label="Guidepoint"
    >
      Guidepoint
      <span
        aria-hidden="true"
        style={{ display: 'inline-block', width: height * 0.2, height: height * 0.2, marginLeft: height * 0.04, borderRadius: '50%', backgroundColor: tone === 'black' ? '#000000' : '#FFCD00' }}
      />
    </span>
  );
};

export default GuidepointLogo;
