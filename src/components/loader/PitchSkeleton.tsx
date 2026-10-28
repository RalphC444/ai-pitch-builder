import React from 'react';

/**
 * PitchSkeleton
 *
 * Mini loading state for one pitch card while its draft is generated: a name
 * bar with a tag pill, then three text lines of decreasing width.
 */
export const PitchSkeleton: React.FC = () => (
  <div className="flex flex-col gap-3 w-full" role="status" aria-label="Drafting pitch">
    <div className="flex items-center gap-2">
      <span className="pitch-skel pitch-skel-strong" style={{ width: '168px', maxWidth: '50%', height: '14px' }} />
      <span className="pitch-skel" style={{ width: '72px', height: '18px', borderRadius: '6px' }} />
    </div>
    <span className="pitch-skel" style={{ width: '64px', height: '12px' }} />
    <div className="flex flex-col gap-2.5 pt-1">
      {['88%', '94%', '62%'].map((width) => (
        <span key={width} className="pitch-skel" style={{ width, height: '12px' }} />
      ))}
    </div>
  </div>
);

export default PitchSkeleton;
