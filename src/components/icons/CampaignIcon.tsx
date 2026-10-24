import React, { useId } from 'react';

interface CampaignIconProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * CampaignIcon Component
 *
 * Megaphone icon used for the Pitch Builder / Advisor Pitches headings.
 * (Moved from the Navigation component so it can be reused.)
 */
export const CampaignIcon: React.FC<CampaignIconProps> = ({
  className = '',
  style,
}) => {
  const maskId = useId();
  const fillColor = style?.color || '#1c2024';

  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <mask id={maskId} style={{maskType: 'alpha'}} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
        <rect width="24" height="24" fill="#D9D9D9"/>
      </mask>
      <g mask={`url(#${maskId})`}>
        <path d="M17.4 12.9006V11.1006H21V12.9006H17.4ZM18.48 19.2006L15.6 17.0406L16.68 15.6006L19.56 17.7606L18.48 19.2006ZM16.68 8.40063L15.6 6.96063L18.48 4.80063L19.56 6.24063L16.68 8.40063ZM5.7 18.3006V14.7006H4.8C4.305 14.7006 3.88125 14.5244 3.52875 14.1719C3.17625 13.8194 3 13.3956 3 12.9006V11.1006C3 10.6056 3.17625 10.1819 3.52875 9.82938C3.88125 9.47688 4.305 9.30063 4.8 9.30063H8.4L12.9 6.60063V17.4006L8.4 14.7006H7.5V18.3006H5.7ZM13.8 15.0156V8.98563C14.205 9.34563 14.5312 9.78438 14.7788 10.3019C15.0262 10.8194 15.15 11.3856 15.15 12.0006C15.15 12.6156 15.0262 13.1819 14.7788 13.6994C14.5312 14.2169 14.205 14.6556 13.8 15.0156Z" fill={fillColor}/>
      </g>
    </svg>
  );
};

export default CampaignIcon;
