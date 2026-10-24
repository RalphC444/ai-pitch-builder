import React, { useEffect } from 'react';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import { ExpressAdvisor, getScreenerResponses } from '../../data/expressList';
import { QualifiedStatusChips } from './QualifiedStatusChips';

interface AdvisorDetailCardProps {
  advisor: ExpressAdvisor;
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onClose: () => void;
}

const font = "'Poppins', sans-serif";

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="flex flex-col gap-1.5 py-3" style={{ borderTop: '1px solid #ebebeb' }}>
    <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#1c2024' }}>{title}</h3>
    <div style={{ fontSize: '13px', lineHeight: '20px', color: '#333333' }}>{children}</div>
  </section>
);

const Key: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <kbd className="inline-flex items-center justify-center rounded px-1.5" style={{ fontFamily: font, fontSize: '11px', minWidth: '20px', height: '18px', border: '1px solid #d6d6d6', backgroundColor: '#f8f9fd', color: '#333333' }}>
    {children}
  </kbd>
);

/**
 * AdvisorDetailCard Component
 *
 * Right-hand card for an Express List row (Figma "comp-card-rhs-xlg"): contact
 * details, notes, recommendation, screeners and employment, with keyboard
 * shortcuts to move between rows.
 */
export const AdvisorDetailCard: React.FC<AdvisorDetailCardProps> = ({
  advisor,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
  onClose,
}) => {
  // ↑ / ↓ move between rows, Esc closes
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('input, textarea, [contenteditable="true"]')) return;
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowUp' && hasPrevious) {
        event.preventDefault();
        onPrevious();
      }
      if (event.key === 'ArrowDown' && hasNext) {
        event.preventDefault();
        onNext();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [hasPrevious, hasNext, onPrevious, onNext, onClose]);

  const { profile } = advisor;
  const details = profile.profileDetails;
  const screeners = getScreenerResponses(advisor);

  return (
    <aside
      className="express-detail fixed flex flex-col bg-white"
      style={{ zIndex: 56, border: '1px solid #ebebeb', boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.16)', fontFamily: font }}
      aria-label={`Profile data for ${profile.name}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-4 py-3" style={{ borderBottom: '1px solid #ebebeb' }}>
        <div className="flex flex-col gap-1 min-w-0">
          <h2 className="truncate" style={{ fontSize: '16px', lineHeight: '22px', fontWeight: 600, color: '#1c2024' }}>{profile.name}</h2>
          <div className="flex flex-wrap items-center gap-2" style={{ fontSize: '12px', color: '#5c5c5c' }}>
            <QualifiedStatusChips advisor={advisor} />
            <span>Angle {profile.angles.map((angle) => angle.number).join(', ')}</span>
            <span aria-hidden="true">•</span>
            <span>${advisor.hourlyRate}/hr</span>
            <span aria-hidden="true">•</span>
            <span>{advisor.country}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <IconButton onClick={onPrevious} disabled={!hasPrevious} aria-label="Previous row" size="small"><KeyboardArrowUpRoundedIcon /></IconButton>
          <IconButton onClick={onNext} disabled={!hasNext} aria-label="Next row" size="small"><KeyboardArrowDownRoundedIcon /></IconButton>
          <IconButton onClick={onClose} aria-label="Close" size="small"><CloseRoundedIcon /></IconButton>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-2">
        <Section title="Contact information">
          <p>Email: {advisor.contact.email}</p>
          <p>Phone: {advisor.contact.phone}</p>
          <p>Time Zone: {advisor.contact.timeZone}</p>
          <p>Country: {advisor.country}</p>
        </Section>
        <Section title="Location">{advisor.contact.location}</Section>
        <Section title="Tags">
          <span className="flex flex-wrap gap-1.5">
            {advisor.tags.map((tag) => (
              <Chip key={tag} label={tag} size="small" sx={{ fontSize: 12, fontWeight: 500, backgroundColor: '#f0f4f8' }} />
            ))}
          </span>
        </Section>
        <Section title="Recommendation">
          <p><strong>{advisor.recommendationScore}</strong> / 100 · Engagement: {advisor.engagement}</p>
          <p style={{ color: '#5c5c5c' }}>{advisor.recommendationExplanation}</p>
        </Section>
        <Section title="Advisor Notes">{advisor.advisorNotes}</Section>
        <Section title="Client Feedback">{advisor.clientFeedback}</Section>
        <Section title="Biography">{details?.biography || 'No biography available.'}</Section>
        <Section title={`Screener Responses (${screeners.length})`}>
          {screeners.length === 0 ? 'No screener responses yet.' : (
            <ul className="flex flex-col gap-2">
              {screeners.map((screener) => (
                <li key={screener.id}>
                  <p><strong>Q:</strong> {screener.question}</p>
                  <p style={{ color: '#5c5c5c' }}><strong style={{ color: '#333333' }}>A:</strong> {screener.answer}</p>
                </li>
              ))}
            </ul>
          )}
        </Section>
        <Section title="Employment">
          <ul className="flex flex-col gap-1.5">
            {(details?.jobHistory || []).map((job) => (
              <li key={job.id} className="flex justify-between gap-3">
                <span className="min-w-0"><strong>{job.companyName}</strong><br /><span style={{ color: '#5c5c5c' }}>{job.role}</span></span>
                <span className="shrink-0" style={{ color: '#5c5c5c', fontVariantNumeric: 'tabular-nums' }}>{job.dateRange}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      {/* Keyboard shortcuts */}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5" style={{ borderTop: '1px solid #ebebeb', fontSize: '11px', color: '#5c5c5c' }}>
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1"><Key><KeyboardArrowUpRoundedIcon sx={{ fontSize: 14 }} /></Key> Previous row</span>
          <span className="flex items-center gap-1"><Key><KeyboardArrowDownRoundedIcon sx={{ fontSize: 14 }} /></Key> Next row</span>
        </span>
        <span className="flex items-center gap-1"><Key>Esc</Key> Close</span>
      </div>
    </aside>
  );
};

export default AdvisorDetailCard;
