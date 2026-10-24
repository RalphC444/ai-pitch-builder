import React from 'react';
import IconButton from '@mui/material/IconButton';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import { Tooltip } from '../../components/tooltip';
import { CONFIDENCE_COLORS, getConfidenceLevel, PitchAnalysis } from '../../data/pitchAnalysis';

const font = "'Poppins', sans-serif";

const Dot: React.FC<{ color: string; size?: number }> = ({ color, size = 12 }) => (
  <span className="block shrink-0 rounded-full" style={{ width: `${size}px`, height: `${size}px`, backgroundColor: color }} aria-hidden="true" />
);

interface QualityScoreIndicatorProps {
  analysis: PitchAnalysis;
  /** Rescoring after an edit - show a loading state instead of the score */
  isScoring?: boolean;
  isPanelOpen: boolean;
  onTogglePanel: () => void;
}

/**
 * QualityScoreIndicator Component
 *
 * Compact pitch quality line under the advisor name (Figma "Modal Review"):
 * colored dot, score /100 Quality, and a button that opens the Pitch Quality panel.
 */
export const QualityScoreIndicator: React.FC<QualityScoreIndicatorProps> = ({ analysis, isScoring = false, isPanelOpen, onTogglePanel }) => (
  <div className="flex items-center gap-1.5" aria-live="polite" aria-busy={isScoring}>
    {isScoring ? (
      <>
        <span className="block shrink-0 rounded-full animate-pulse" style={{ width: '8px', height: '8px', backgroundColor: '#adadad' }} aria-hidden="true" />
        <span className="loader-bar-animated rounded-full" style={{ width: '28px', height: '18px' }} aria-hidden="true" />
        <span style={{ fontFamily: font, fontSize: '11px', lineHeight: '24px', fontWeight: 500, color: '#adadad' }}>Updating quality…</span>
      </>
    ) : (
      <>
        <Dot color={CONFIDENCE_COLORS[getConfidenceLevel(analysis.score)]} size={8} />
        <span className="transition-all" style={{ fontFamily: font, fontSize: '20px', lineHeight: '24px', fontWeight: 600, color: '#333333' }}>
          {analysis.score}
        </span>
        <span style={{ fontFamily: font, fontSize: '11px', lineHeight: '24px', fontWeight: 500, color: '#adadad' }}>/100 Quality</span>
      </>
    )}
    <Tooltip content="Evaluate the grading criteria for the Pitch Quality score.">
      <IconButton
        onClick={onTogglePanel}
        size="small"
        sx={{ p: 0.25, borderRadius: 1, color: isPanelOpen ? 'primary.main' : '#333333', backgroundColor: isPanelOpen ? 'rgba(0, 130, 235, 0.08)' : undefined }}
        aria-label="Evaluate the grading criteria for the Pitch Quality score"
        aria-pressed={isPanelOpen}
      >
        <OpenInNewRoundedIcon sx={{ fontSize: 16 }} />
      </IconButton>
    </Tooltip>
  </div>
);
