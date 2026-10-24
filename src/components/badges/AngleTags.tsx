import React from 'react';
import Tooltip from '@mui/material/Tooltip';
import { Tag } from './Tag';
import type { Angle } from '../profile/ProfileCard';

/** Short names for the project's angles (full names stay in the tooltip) */
const SHORT_ANGLE_LABELS: Record<number, string> = {
  1: 'GLP-1 Formers',
  2: 'Packaging & Elastomers',
  3: 'Biosimilars',
};

export const shortAngleLabel = (angle: Angle) => SHORT_ANGLE_LABELS[angle.number] || angle.label;

/**
 * AngleTags
 *
 * One angle: a tag with its short name. Several: a single "2 angles" tag.
 * Hovering either lists each angle by number and full name.
 */
export const AngleTags: React.FC<{ angles: Angle[] }> = ({ angles }) => {
  if (angles.length === 0) return null;

  const tooltip = (
    <span className="flex flex-col gap-0.5">
      {angles.map((angle) => (
        <span key={angle.number}>Angle {angle.number} · {angle.label}</span>
      ))}
    </span>
  );

  return (
    <Tooltip title={tooltip} placement="top">
      <span className="inline-flex max-w-full" tabIndex={0} aria-label={angles.map((angle) => `Angle ${angle.number}: ${angle.label}`).join(', ')}>
        <Tag label={angles.length === 1 ? shortAngleLabel(angles[0]) : `${angles.length} angles`} />
      </span>
    </Tooltip>
  );
};

export default AngleTags;
