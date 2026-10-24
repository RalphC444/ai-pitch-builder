import React from 'react';

export type TagTone = 'neutral' | 'vetted' | 'unvetted';

const TONES: Record<TagTone, { color: string; background: string }> = {
  neutral: { color: '#3d4652', background: '#eef1f5' },
  vetted: { color: '#6136b8', background: '#f1ebfd' },
  unvetted: { color: '#a85300', background: '#fdf0e2' },
};

interface TagProps {
  label: string;
  tone?: TagTone;
  /** Full text on hover (labels truncate) */
  title?: string;
}

/**
 * Tag Component
 *
 * Small tinted label shown next to an advisor's name (angle, vetting status).
 * One size and shape for every tone so tags read as a set.
 */
export const Tag: React.FC<TagProps> = ({ label, tone = 'neutral', title }) => (
  <span
    className="inline-flex items-center max-w-full"
    style={{
      height: '22px',
      padding: '0 8px',
      borderRadius: '6px',
      fontFamily: "'Poppins', sans-serif",
      fontSize: '12px',
      lineHeight: '16px',
      fontWeight: 600,
      ...TONES[tone],
    }}
    title={title}
  >
    <span className="truncate">{label}</span>
  </span>
);

export default Tag;
