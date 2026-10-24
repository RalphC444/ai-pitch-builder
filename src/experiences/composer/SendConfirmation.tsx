import React, { useState } from 'react';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import PriorityHighRoundedIcon from '@mui/icons-material/PriorityHighRounded';
import { EmailHeaderRows } from './EmailPreviewModal';
import { ModalButton } from '../../components/modal';
import { NavActions } from '../../components/navigation/NavActions';
import { useMediaQuery, MOBILE_QUERY } from '../../hooks/useMediaQuery';
import type { Profile } from '../../data/profiles';
import type { SentEmail } from './EmailComposer';

interface SendConfirmationProps {
  email: SentEmail;
  profiles: Profile[];
  onBackToCompose: () => void;
  onStartOver: () => void;
}

type DeliveryStatus = 'sent' | 'failed';

const font = "'Poppins', sans-serif";

const formatTime = (iso: string) => new Date(iso).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

const HEADLINES: Record<SentEmail['mode'], (email: SentEmail) => { title: string; subtitle: string }> = {
  'agent-auto': (email) => ({ title: 'Sent by the agent', subtitle: `Every hard constraint passed. Sent ${formatTime(email.sentAt)}.` }),
  'agent-scheduled': (email) => ({ title: `Scheduled for ${formatTime(email.scheduledFor || email.sentAt)}`, subtitle: 'Outside the client send window, so it was queued for business hours.' }),
  'human-approved': (email) => ({ title: 'Email sent', subtitle: `Approved by you. Sent ${formatTime(email.sentAt)}.` }),
  manual: (email) => ({ title: 'Email sent', subtitle: `Sent ${formatTime(email.sentAt)}.` }),
};

const FAILED = {
  title: "Email didn't send",
  subtitle: "The mail server didn't respond, so nothing reached your recipients. Your email is saved - try again, or go back and edit it.",
};

/**
 * SendConfirmation
 *
 * Send To Client step: one full-screen message saying whether the email went
 * out, with the subject and recipients exactly as the preview showed them.
 * The Sent / Failed toggle previews the error state.
 */
export const SendConfirmation: React.FC<SendConfirmationProps> = ({ email, onBackToCompose, onStartOver }) => {
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const [status, setStatus] = useState<DeliveryStatus>('sent');
  const isFailed = status === 'failed';
  const isScheduled = !isFailed && email.mode === 'agent-scheduled';
  const { title, subtitle } = isFailed ? FAILED : HEADLINES[email.mode](email);
  const tone = isFailed
    ? { color: '#c41e2f', background: '#fde8ea' }
    : isScheduled
    ? { color: '#0068bc', background: '#e4effa' }
    : { color: '#149c4d', background: '#e3f4ea' };

  return (
    <main
      className="content-wrapper flex flex-col items-center justify-center gap-6 py-10 text-center"
      style={{ minHeight: 'calc(100vh - 64px)', fontFamily: font }}
    >
      <span
        className="flex items-center justify-center rounded-full"
        style={{ width: '72px', height: '72px', color: tone.color, backgroundColor: tone.background }}
        aria-hidden="true"
      >
        {isFailed ? <PriorityHighRoundedIcon sx={{ fontSize: 36 }} /> : isScheduled ? <ScheduleRoundedIcon sx={{ fontSize: 36 }} /> : <CheckRoundedIcon sx={{ fontSize: 40 }} />}
      </span>

      <div className="flex flex-col gap-2 max-w-[520px]" role="status" aria-live="polite">
        <h1 style={{ fontSize: '28px', lineHeight: '36px', fontWeight: 600, color: '#000000' }}>{title}</h1>
        <p style={{ fontSize: '15px', lineHeight: '22px', fontWeight: 500, color: '#5c5c5c' }}>{subtitle}</p>
      </div>

      <div className="flex flex-col gap-2 w-full max-w-[520px] bg-white rounded-2xl p-4 sm:p-5 text-left" style={{ border: '1px solid #ebeef7' }}>
        <EmailHeaderRows draft={email.draft} sentAt={isFailed ? undefined : formatTime(email.sentAt)} />
        <p style={{ fontSize: '13px', fontWeight: 500, color: '#5c5c5c' }}>
          {email.advisorCount} advisor{email.advisorCount === 1 ? '' : 's'} pitched
        </p>
      </div>

      <div className="flex flex-col items-center gap-1.5">
        <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.4px', textTransform: 'uppercase', color: '#8b8d98' }}>Preview state</span>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={status}
          onChange={(_, next: DeliveryStatus | null) => next && setStatus(next)}
          aria-label="Preview delivery state"
        >
          <ToggleButton value="sent" sx={{ px: 2, textTransform: 'none' }}>Sent</ToggleButton>
          <ToggleButton value="failed" sx={{ px: 2, textTransform: 'none' }}>Failed</ToggleButton>
        </ToggleButtonGroup>
      </div>

      <NavActions>
        {isFailed ? (
          <>
            <ModalButton label={isMobile ? 'Edit' : 'Back to Email'} onClick={onBackToCompose} />
            <ModalButton label="Try Again" primary onClick={() => setStatus('sent')} />
          </>
        ) : (
          <ModalButton label={isMobile ? 'Project' : 'Back To Project'} primary onClick={onStartOver} />
        )}
      </NavActions>
    </main>
  );
};

export default SendConfirmation;
