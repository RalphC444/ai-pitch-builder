import React from 'react';
import { CONFIDENCE_COLORS, PitchAnalysis, PitchIssue } from '../../data/pitchAnalysis';

interface QualityPanelProps {
  analysis: PitchAnalysis;
  /** Rescoring after an edit - show loading bars instead of the results */
  isScoring?: boolean;
  activeIssueId?: string | null;
  onSelectIssue: (issue: PitchIssue) => void;
  onViewSources: () => void;
}

const font = "'Poppins', sans-serif";

const Dot: React.FC<{ color: string }> = ({ color }) => (
  <span className="block shrink-0 rounded-full" style={{ width: '12px', height: '12px', backgroundColor: color }} aria-hidden="true" />
);

const BREAKDOWN = [
  { level: 'high' as const, label: 'High (80%+)' },
  { level: 'medium' as const, label: 'Medium (60% - 79%)' },
  { level: 'low' as const, label: 'Low (<60%)' },
];

/**
 * QualityPanel Component
 *
 * "Pitch Quality" sidebar from the Figma: score out of 100 on a red-to-green bar,
 * confidence breakdown, and AI suggestions for each flagged statement.
 */
const LoadingBars: React.FC<{ widths: string[] }> = ({ widths }) => (
  <div className="flex flex-col gap-2 py-1" aria-hidden="true">
    {widths.map((width, index) => (
      <div key={index} className="loader-bar-animated rounded-full" style={{ height: '12px', width }} />
    ))}
  </div>
);

export const QualityPanel: React.FC<QualityPanelProps> = ({
  analysis,
  isScoring = false,
  activeIssueId,
  onSelectIssue,
  onViewSources,
}) => {
  const flagged = analysis.issues.filter((issue) => issue.level !== 'high' || issue.resolved);

  return (
    <aside
      className="bg-white flex flex-col w-full lg:w-[232px] shrink-0 self-stretch"
      style={{ border: '1px solid #d6d6d6', borderRadius: '16px' }}
      aria-label="Pitch quality"
      aria-busy={isScoring}
    >
      <div className="flex flex-col gap-2 p-3">
        <p style={{ fontFamily: font, fontSize: '14px', lineHeight: '22px', fontWeight: 600, color: '#333333' }}>
          Pitch Quality
        </p>
        {isScoring ? (
          <>
            <p style={{ fontFamily: font, fontSize: '12px', lineHeight: '16px', fontWeight: 500, color: '#5c5c5c' }}>Updating quality…</p>
            <LoadingBars widths={['40%', '100%', '80%']} />
            <p className="mt-1" style={{ fontFamily: font, fontSize: '12px', lineHeight: '16px', fontWeight: 600, color: '#000000' }}>
              Confidence Breakdown
            </p>
            <LoadingBars widths={['100%', '100%', '100%']} />
          </>
        ) : (
        <>
        <p style={{ fontFamily: font, color: '#333333' }}>
          <span style={{ fontSize: '24px', lineHeight: '28px', fontWeight: 600 }}>{analysis.score}</span>
          <span style={{ fontSize: '12px', fontWeight: 500, color: '#adadad' }}> /100</span>
        </p>

        {/* Score bar with marker */}
        <div
          className="relative w-full rounded-full"
          style={{ height: '11px', background: 'linear-gradient(90deg, #c21b2f 0%, #ff820e 51%, #009e52 100%)' }}
          role="meter"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={analysis.score}
          aria-label="Pitch quality score"
        >
          <span
            className="absolute top-1/2 rounded-full transition-[left] duration-500"
            style={{
              left: `calc(${analysis.score}% - 6px)`,
              width: '12px',
              height: '12px',
              transform: 'translateY(-50%)',
              border: '1px solid #ffffff',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              boxShadow: '0px -4px 4px rgba(240, 240, 240, 0.53), 0px 4px 4px rgba(0, 0, 0, 0.25)',
            }}
          />
        </div>

        <p style={{ fontFamily: font, fontSize: '12px', lineHeight: '16px', fontWeight: 500, color: '#5c5c5c' }}>
          {analysis.summary}
        </p>

        <p className="mt-1" style={{ fontFamily: font, fontSize: '12px', lineHeight: '16px', fontWeight: 600, color: '#000000' }}>
          Confidence Breakdown
        </p>
        <ul className="flex flex-col gap-2">
          {BREAKDOWN.map(({ level, label }) => (
            <li key={level} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <Dot color={CONFIDENCE_COLORS[level]} />
                <span style={{ fontFamily: font, fontSize: '12px', lineHeight: '16px', fontWeight: 500, color: '#5c5c5c' }}>{label}</span>
              </span>
              <span style={{ fontFamily: font, fontSize: '12px', lineHeight: '16px', fontWeight: 600, color: '#5c5c5c' }}>
                {analysis.counts[level]} {analysis.counts[level] === 1 ? 'Item' : 'Items'}
              </span>
            </li>
          ))}
        </ul>
        </>
        )}
      </div>

      <div className="h-px w-full" style={{ backgroundColor: '#d6d6d6' }} aria-hidden="true" />

      <div className="flex flex-col gap-3 p-3">
        <div className="flex items-center justify-between gap-2">
          <p style={{ fontFamily: font, fontSize: '14px', lineHeight: '22px', fontWeight: 600, color: '#333333' }}>
            AI Suggestions
          </p>
          <button
            onClick={onViewSources}
            className="underline hover:text-blue-600"
            style={{ fontFamily: font, fontSize: '12px', fontWeight: 500, color: '#333333' }}
          >
            View Sources
          </button>
        </div>

        {isScoring ? (
          <LoadingBars widths={['100%', '85%', '100%', '60%']} />
        ) : flagged.length === 0 ? (
          <p style={{ fontFamily: font, fontSize: '12px', lineHeight: '16px', fontWeight: 500, color: '#5c5c5c' }}>
            No issues found. Every statement is backed by the advisor's profile.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {flagged.map((issue) => (
              <li key={issue.id}>
                <button
                  onClick={() => onSelectIssue(issue)}
                  className={`w-full flex items-start gap-2 text-left rounded-md p-1 -m-1 transition-colors hover:bg-black/[0.04] ${
                    activeIssueId === issue.id ? 'bg-black/[0.04]' : ''
                  }`}
                  aria-label={`${issue.resolved ? 'Resolved: ' : ''}${issue.message}`}
                >
                  <span className="py-0.5">
                    <Dot color={issue.resolved ? CONFIDENCE_COLORS.high : CONFIDENCE_COLORS[issue.level]} />
                  </span>
                  <span
                    style={{
                      fontFamily: font,
                      fontSize: '12px',
                      lineHeight: '16px',
                      fontWeight: 500,
                      color: '#5c5c5c',
                    }}
                  >
                    {issue.message}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
};

export default QualityPanel;
