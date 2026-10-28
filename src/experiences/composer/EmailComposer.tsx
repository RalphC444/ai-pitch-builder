import React, { useCallback, useEffect, useRef, useState } from 'react';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import AddCircleOutlineRoundedIcon from '@mui/icons-material/AddCircleOutlineRounded';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import { WorkflowHeader } from '../WorkflowHeader';
import { AgentReviewPanel } from './AgentReviewPanel';
import { EmailBody, EmailBrandFooter, EmailBrandHeader, EmailHeaderRows } from './EmailPreviewModal';
import { CopyEmailButton } from './CopyEmailButton';
import { RichTextEditor, RichTextEditorHandle } from '../../components/editor/RichTextEditor';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import { createBlock } from '../../data/contentBlocks';
import { CampaignIcon } from '../../components/icons/CampaignIcon';
import { EditIcon } from '../../components/icons/EditIcon';
import { ModalButton } from '../../components/modal';
import { AngleTags } from '../../components/badges/AngleTags';
import { NavActions } from '../../components/navigation/NavActions';
import { useMediaQuery, MOBILE_QUERY } from '../../hooks/useMediaQuery';
import { useToast } from '../../components/toast';
import {
  AgentRun,
  AGENT_REVIEW_ENABLED,
  applyAgentEdits,
  AutonomyLevel,
  EditStatus,
  EmailDraft,
  nextSendTime,
  runAgentReview,
  UNDO_WINDOW_SECONDS,
} from '../../data/agentReview';
import type { AnglePrompt } from '../../data/anglePrompts';
import type { SavedAnalyses } from '../../data/pitchAnalysis';
import { getCurrentRoleText, hasCurrentRoleLine, Profile } from '../../data/profiles';

export type SendMode = 'agent-auto' | 'agent-scheduled' | 'human-approved' | 'manual';

export interface SentEmail {
  mode: SendMode;
  level: AutonomyLevel;
  sentAt: string;
  scheduledFor?: string;
  run: AgentRun | null;
  draft: EmailDraft;
  advisorCount: number;
}

interface EmailComposerProps {
  draft: EmailDraft;
  setDraft: React.Dispatch<React.SetStateAction<EmailDraft>>;
  profiles: Profile[];
  setProfiles: React.Dispatch<React.SetStateAction<Profile[]>>;
  prompts: Record<number, AnglePrompt>;
  savedAnalyses: SavedAnalyses;
  setSavedAnalyses: React.Dispatch<React.SetStateAction<SavedAnalyses>>;
  autonomy: AutonomyLevel;
  onAutonomyChange: (level: AutonomyLevel) => void;
  onBack: () => void;
  onSent: (email: SentEmail) => void;
}

const font = "'Poppins', sans-serif";
const STEP_DELAY_MS = 280;

const THREADS = [
  'GLP-1 Elastomer & Device Supply - Express List',
  'GLP-1 Elastomer & Device Supply - Kickoff',
];
/** Value of the "+ New thread" option in the Thread dropdown */
const NEW_THREAD = '__new-thread__';
const TEMPLATES = ['Blank Email', 'Express List - Unvetted', 'Express List - Vetted'];
const SENDERS = ['rcapriglione@guidepoint.com', 'research-team@guidepoint.com'];

interface ThreadEmail {
  fromName: string;
  fromEmail: string;
  to: string;
  cc?: string;
  date: string;
  subject: string;
  body: string;
}

/** Earlier emails in the thread, oldest first: the client's project request, the kickoff reply, the latest note */
const PRIOR_EMAILS: ThreadEmail[] = [
  {
    fromName: 'Claire Johnson',
    fromEmail: 'client1@org.com',
    to: 'rcapriglione@guidepoint.com',
    cc: 'client2@org.com',
    date: 'Mon, Oct 19, 9:12 AM',
    subject: 'New project: GLP-1 elastomer & device supply',
    body: `Hi Ralph,

We're starting a project on supply constraints for GLP-1 injectables and would like to speak with experts in three areas:

1. Former GLP-1 leaders at Novo Nordisk and Eli Lilly (commercial, supply chain, medical)
2. Procurement leads for primary packaging and elastomers (stoppers, plungers, pen components)
3. Biosimilar companies planning GLP-1 launches

Key questions:
- Where are the capacity bottlenecks for pens and cartridges over the next three years?
- How are elastomer suppliers allocating capacity between brands?
- How quickly can biosimilar entrants secure device supply?

Could you send 8 to 10 profiles to start? We'd like 60-minute calls, ideally this week.

Thanks,
Claire Johnson
Director, Healthcare Investments`,
  },
  {
    fromName: 'Ralph Capriglione',
    fromEmail: 'rcapriglione@guidepoint.com',
    to: 'client1@org.com',
    cc: 'client2@org.com, compliance@guidepoint.com',
    date: 'Mon, Oct 19, 2:40 PM',
    subject: 'Re: New project: GLP-1 elastomer & device supply',
    body: `Hi Claire,

Thanks for the brief. We've set the project up as three angles:

- GLP-1 Formers
- GLP-1 primary packaging/elastomer procurement
- Biosimilar players

Recruiting has started across all three. You'll have a first set of advisors by Wednesday, each with a short pitch on how they fit your questions.

Best,
Ralph Capriglione
Project Manager, Guidepoint`,
  },
  {
    fromName: 'Claire Johnson',
    fromEmail: 'client1@org.com',
    to: 'rcapriglione@guidepoint.com',
    cc: 'client2@org.com',
    date: 'Tue, Oct 20, 8:05 AM',
    subject: 'Re: New project: GLP-1 elastomer & device supply',
    body: `Thanks Ralph. Could you prioritize former Novo and Lilly supply chain leaders first?

We'd also like at least two people who have negotiated elastomer contracts directly.

Claire`,
  },
];

export const DEFAULT_EMAIL_DRAFT: EmailDraft = {
  thread: THREADS[0],
  from: SENDERS[0],
  to: 'client1@org.com, client2@org.com',
  cc: 'rm1@guidepoint.com',
  bcc: '',
  complianceCc: 'compliance@guidepoint.com',
  template: TEMPLATES[1],
  subject: 'GLP-1 Elastomer & Device Supply - Advisor Pitches',
  introHtml: '<p>Hi Claire,</p><p><br></p><p>As discussed, here are advisors across our three angles for the GLP-1 elastomer and device supply project. Let me know if any are of particular interest and we will prioritize getting their availability.</p>',
  outroHtml: '<p>Please let me know if you would like to speak with any of these advisors or if priorities change.</p><p><br></p><p>Best,</p><p>The Guidepoint Team</p>',
  blocks: [],
};

const labelStyle: React.CSSProperties = { fontFamily: font, fontSize: '14px', lineHeight: '18px', fontWeight: 500, color: '#1c2024' };
const Field: React.FC<{ id: string; label: string; action?: React.ReactNode; children: React.ReactNode }> = ({ id, label, action, children }) => (
  <div className="flex flex-col gap-1.5">
    {action ? (
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} style={labelStyle}>{label}</label>
        {action}
      </div>
    ) : (
      <label htmlFor={id} style={labelStyle}>{label}</label>
    )}
    {children}
  </div>
);

const TextInput: React.FC<{ id: string; value: string; onChange: (value: string) => void; placeholder?: string }> = ({ id, value, onChange, placeholder }) => (
  <TextField id={id} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} size="small" fullWidth />
);

const SelectInput: React.FC<{ id: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }> = ({ id, value, onChange, options }) => (
  <TextField id={id} select value={value} onChange={(event) => onChange(event.target.value)} size="small" fullWidth>
    {options.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
  </TextField>
);

const SectionTitle: React.FC<{ icon?: React.ReactNode; children: React.ReactNode }> = ({ icon, children }) => (
  <h2 className="flex items-center gap-2" style={{ fontFamily: font, fontSize: '18px', lineHeight: '24px', fontWeight: 600, color: '#000000' }}>
    {icon}
    {children}
  </h2>
);

const signature = (draft: EmailDraft, profiles: Profile[]) =>
  JSON.stringify([draft, profiles.map((profile) => profile.contentHtml)]);

/**
 * EmailComposer
 *
 * Compose Email step from the Unified Email Experience Figma, with the AI Review Agent:
 * the agent reviews the email and, depending on the human-in-the-loop level,
 * sends it, waits for approval, proposes edits, or only flags issues.
 */
export const EmailComposer: React.FC<EmailComposerProps> = ({
  draft,
  setDraft,
  profiles,
  setProfiles,
  prompts,
  savedAnalyses,
  setSavedAnalyses,
  autonomy,
  onAutonomyChange,
  onBack,
  onSent,
}) => {
  const { showToast } = useToast();
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const agentRef = useRef<HTMLDivElement>(null);
  const emailBodyRef = useRef<HTMLDivElement>(null);
  const blocks = draft.blocks || [];
  const blockEditorRefs = useRef(new Map<string, RichTextEditorHandle>());
  // A newly added content block takes the cursor
  const [focusBlockId, setFocusBlockId] = useState<string | null>(null);
  useEffect(() => {
    if (!focusBlockId) return;
    blockEditorRefs.current.get(focusBlockId)?.focus();
    setFocusBlockId(null);
  }, [focusBlockId, draft.blocks]);
  const [run, setRun] = useState<AgentRun | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [baseline, setBaseline] = useState<{ draft: EmailDraft; profiles: Profile[]; savedAnalyses: SavedAnalyses } | null>(null);
  const [reviewedSignature, setReviewedSignature] = useState<string | null>(null);
  // Land on the preview; "Edit Email" opens the composer
  const [mode, setMode] = useState<'preview' | 'edit'>('preview');
  const [isThreadOpen, setIsThreadOpen] = useState(false);
  // Specify Recipients starts collapsed to just the Thread field
  const [isRecipientsExpanded, setIsRecipientsExpanded] = useState(false);
  // Thread names not in the existing list are new threads
  const isNewThread = !THREADS.includes(draft.thread);

  const isStale = !!run && !isRunning && reviewedSignature !== signature(draft, profiles);

  const updateDraft = (changes: Partial<EmailDraft>) => setDraft((previous) => ({ ...previous, ...changes }));

  /** Re-apply the run's applied/accepted edits on top of the pre-run snapshot */
  const applyFromBaseline = useCallback((edits: AgentRun['edits'], snapshot = baseline) => {
    if (!snapshot) return;
    const result = applyAgentEdits(snapshot.draft, snapshot.profiles, edits, prompts, snapshot.savedAnalyses);
    setDraft(result.draft);
    setProfiles(result.profiles);
    setSavedAnalyses(result.savedAnalyses);
    setReviewedSignature(signature(result.draft, result.profiles));
  }, [baseline, prompts, setDraft, setProfiles, setSavedAnalyses]);

  const send = useCallback((mode: SendMode, currentRun: AgentRun | null = run) => {
    const now = new Date();
    const scheduledFor = mode === 'agent-scheduled' ? nextSendTime(now).toISOString() : undefined;
    setCountdown(null);
    onSent({ mode, level: autonomy, sentAt: now.toISOString(), scheduledFor, run: currentRun, draft, advisorCount: profiles.length });
  }, [autonomy, draft, onSent, profiles.length, run]);

  const runReview = useCallback(() => {
    setCountdown(null);
    const snapshot = { draft, profiles, savedAnalyses };
    const result = runAgentReview(draft, profiles, prompts, savedAnalyses, autonomy);
    setBaseline(snapshot);
    setRun(result);
    setIsRunning(true);
    agentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    setTimeout(() => {
      setIsRunning(false);
      applyFromBaseline(result.edits, snapshot);
      // 0% human in the loop: send (or schedule) on its own after the undo window
      if (result.decision.outcome === 'auto-send' || result.decision.outcome === 'schedule') setCountdown(UNDO_WINDOW_SECONDS);
    }, (result.checks.length + 1) * STEP_DELAY_MS);
  }, [applyFromBaseline, autonomy, draft, profiles, prompts, savedAnalyses]);

  // Agentic by default: at 0-25% human in the loop the agent reviews as soon as you arrive
  useEffect(() => {
    if (!AGENT_REVIEW_ENABLED || autonomy > 25) return;
    const timer = setTimeout(runReview, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autonomous send countdown (undo window)
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      send(run?.decision.outcome === 'schedule' ? 'agent-scheduled' : 'agent-auto');
      return;
    }
    const timer = setTimeout(() => setCountdown((value) => (value === null ? null : value - 1)), 1000);
    return () => clearTimeout(timer);
  }, [countdown, send, run]);

  // Editing the email during the undo window cancels the autonomous send
  useEffect(() => {
    if (countdown !== null && isStale) {
      setCountdown(null);
      showToast('Email changed - autonomous send cancelled');
    }
  }, [countdown, isStale, showToast]);

  const handleEditStatusChange = (editId: string, status: EditStatus) => {
    if (!run) return;
    const edits = run.edits.map((edit) => (edit.id === editId ? { ...edit, status } : edit));
    setRun({ ...run, edits });
    applyFromBaseline(edits);
  };

  const handleLevelChange = (level: AutonomyLevel) => {
    onAutonomyChange(level);
    if (run) {
      // Previous run's edits came from another level - restore the pre-run email (unless you've edited since)
      if (baseline && !isStale) {
        setDraft(baseline.draft);
        setProfiles(baseline.profiles);
        setSavedAnalyses(baseline.savedAnalyses);
      }
      setRun(null);
      setBaseline(null);
    }
  };

  const handleSendClick = () => {
    if (!AGENT_REVIEW_ENABLED) {
      send('manual', null);
      return;
    }
    if (autonomy === 100) {
      // Agent off - still enforce hard guardrails
      const guardrails = runAgentReview(draft, profiles, prompts, savedAnalyses, 100);
      if (guardrails.decision.outcome === 'blocked') {
        setRun(guardrails);
        setBaseline({ draft, profiles, savedAnalyses });
        setReviewedSignature(signature(draft, profiles));
        agentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        showToast('Hard guardrails failed - see the Agent panel');
        return;
      }
      send('manual', guardrails);
      return;
    }
    if (!run || isStale) {
      runReview();
      return;
    }
    const { outcome } = run.decision;
    if (outcome === 'blocked') {
      agentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      showToast('Resolve the items the agent escalated first');
    } else if (outcome === 'await-edit-review' && run.edits.some((edit) => edit.status === 'pending')) {
      agentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      showToast('Accept or reject the proposed edits first');
    } else if (outcome === 'schedule') {
      send('agent-scheduled');
    } else {
      send('human-approved');
    }
  };

  const switchMode = (next: 'preview' | 'edit') => {
    setMode(next);
    window.scrollTo({ top: 0 });
  };

  const sendLabel = !AGENT_REVIEW_ENABLED ? 'Send Email' : autonomy === 0 ? 'Run Agent & Send' : autonomy === 100 ? 'Send Email' : !run || isStale ? 'Review & Send' : 'Send Email';

  /** Earlier emails in the thread - collapsed until opened */
  const threadHistory = (
  <section className="bg-white flex flex-col gap-4 p-4 sm:p-6" style={{ borderRadius: '16px' }}>
    <SectionTitle icon={<ForumOutlinedIcon sx={{ color: '#1c2024' }} />}>Emails In This Thread</SectionTitle>
    {isNewThread ? (
      <p className="p-4" style={{ fontFamily: font, fontSize: '13px', fontWeight: 500, color: '#5c5c5c', border: '1px solid #ebeef7', borderRadius: '12px' }}>
        New thread - this email starts “{draft.thread || 'New thread'}”. There are no earlier emails yet.
      </p>
    ) : (
    <div className="flex flex-col" style={{ border: '1px solid #ebeef7', borderRadius: '12px' }}>
      <button
        onClick={() => setIsThreadOpen((open) => !open)}
        className="flex items-center justify-between gap-3 p-4 text-left"
        aria-expanded={isThreadOpen}
      >
        <span className="flex flex-col min-w-0">
          <span className="truncate" style={{ fontFamily: font, fontSize: '14px', fontWeight: 600, color: '#1c2024' }}>{draft.thread}</span>
          <span style={{ fontFamily: font, fontSize: '12px', fontWeight: 500, color: '#5c5c5c' }}>
            Latest from {PRIOR_EMAILS[PRIOR_EMAILS.length - 1].fromName} · {PRIOR_EMAILS[PRIOR_EMAILS.length - 1].date}
          </span>
        </span>
        <span className="flex items-center gap-3 shrink-0">
          <span className="flex items-center justify-center rounded-full" style={{ width: '20px', height: '20px', backgroundColor: '#5c5c5c', color: '#ffffff', fontSize: '11px', fontWeight: 600 }}>
            {PRIOR_EMAILS.length}
          </span>
          <span className="inline-flex transition-transform" style={{ transform: isThreadOpen ? 'rotate(180deg)' : undefined }}>
            <ExpandMoreRoundedIcon />
          </span>
        </span>
      </button>
      {/* Full emails, oldest first, laid out like an email client */}
      {isThreadOpen && PRIOR_EMAILS.map((email) => (
        <article key={email.date} className="flex flex-col gap-3 px-4 sm:px-5 py-4 border-t" style={{ borderColor: '#ebeef7', fontFamily: font }}>
          <div className="flex items-start gap-3">
            <span
              className="flex items-center justify-center rounded-full shrink-0"
              style={{ width: '32px', height: '32px', backgroundColor: email.fromEmail.endsWith('@guidepoint.com') ? '#e4effa' : '#eef1f5', color: email.fromEmail.endsWith('@guidepoint.com') ? '#0068bc' : '#3d4652', fontSize: '13px', fontWeight: 600 }}
              aria-hidden="true"
            >
              {email.fromName.split(' ').map((part) => part[0]).join('')}
            </span>
            <div className="flex flex-col min-w-0 flex-1" style={{ fontSize: '12px', lineHeight: '18px', color: '#5c5c5c' }}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="min-w-0 break-words" style={{ fontSize: '13px', color: '#1c2024' }}>
                  <strong style={{ fontWeight: 600 }}>{email.fromName}</strong> &lt;{email.fromEmail}&gt;
                </span>
                <span className="shrink-0" style={{ color: '#8b8d98' }}>{email.date}</span>
              </div>
              <span className="break-words">To: {email.to}</span>
              {email.cc && <span className="break-words">Cc: {email.cc}</span>}
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#1c2024' }}>{email.subject}</p>
          <p className="break-words" style={{ margin: 0, fontSize: '14px', lineHeight: '22px', color: '#333333', whiteSpace: 'pre-line' }}>{email.body}</p>
        </article>
      ))}
    </div>
    )}
  </section>
  );

  const sendButton = <ModalButton label={isMobile ? 'Send' : sendLabel} primary disabled={isRunning || countdown !== null} onClick={handleSendClick} />;

  if (mode === 'preview') {
    return (
      <main className="content-wrapper flex flex-col gap-6 pt-6 sm:pt-[34px] pb-12">
        <WorkflowHeader
          activeStep={1}
          title="Compose Email"
          subtitle="Check how it reads, then send."
          onBack={onBack}
          backLabel="Back to pitch curation"
        />

        <section
          className="bg-white flex flex-col"
          style={{ overflow: 'clip', borderRadius: '16px', boxShadow: '0 1px 2px rgba(16, 24, 40, 0.06), 0 12px 32px rgba(16, 24, 40, 0.06)' }}
          aria-label="Email preview"
        >
          {/* Floating copy button: pinned to the card's top-right while it scrolls */}
          <div className="sticky top-20 z-10 flex items-start justify-end h-0 pr-4 sm:pr-6 pt-4 sm:pt-6">
            <CopyEmailButton getContent={() => emailBodyRef.current} />
          </div>
          {/* Email client header */}
          <div className="px-4 sm:px-6 pt-6 pb-6 pr-16 sm:pr-20" style={{ borderBottom: '1px solid #d5d5d5' }}>
            <EmailHeaderRows draft={draft} />
          </div>
          {/* Branded email (Guidepoint template) */}
          <div className="flex flex-col items-center gap-6 pt-6 px-4 sm:px-6">
            <EmailBrandHeader />
            <div ref={emailBodyRef} className="w-full max-w-[600px] pt-6">
              <EmailBody draft={draft} profiles={profiles} />
            </div>
          </div>
          <div className="flex flex-col items-center pt-6">
            <EmailBrandFooter />
          </div>
        </section>

        {threadHistory}

        <NavActions>
          <ModalButton label={isMobile ? 'Edit' : 'Edit Email'} onClick={() => switchMode('edit')} />
          {sendButton}
        </NavActions>
      </main>
    );
  }

  return (
    <main className="content-wrapper flex flex-col gap-6 pt-6 sm:pt-[34px] pb-12">
      <WorkflowHeader
        activeStep={1}
        title="Compose Email"
        subtitle="Customize your email content and personalize it for your recipients"
        onBack={() => switchMode('preview')}
        backLabel="Back to email preview"
      />

      {AGENT_REVIEW_ENABLED && (
      <div ref={agentRef} className="scroll-mt-40">
        <AgentReviewPanel
          level={autonomy}
          onLevelChange={handleLevelChange}
          run={run}
          isRunning={isRunning}
          isStale={isStale}
          onRun={runReview}
          onEditStatusChange={handleEditStatusChange}
          countdown={countdown}
          onCancelAutoSend={() => {
            setCountdown(null);
            showToast('Autonomous send cancelled - you are in the loop');
          }}
          onApproveSend={handleSendClick}
          onSendNow={() => send('human-approved')}
        />
      </div>
      )}

      {/* Specify Recipients */}
      <section className="bg-white flex flex-col gap-4 p-4 sm:p-6" style={{ borderRadius: '16px' }}>
        <SectionTitle icon={<GroupsRoundedIcon sx={{ color: '#1c2024' }} />}>Specify Recipients</SectionTitle>
        <div className="flex flex-col gap-4 p-4 sm:p-5" style={{ border: '1px solid #ebeef7', borderRadius: '12px' }}>
          {/* The show / hide toggle shares the Thread label row */}
          <Field
            id="email-thread"
            label="Thread:"
            action={
              <Button
              onClick={() => setIsRecipientsExpanded((expanded) => !expanded)}
              aria-expanded={isRecipientsExpanded}
              aria-controls="recipient-fields"
              size="small"
              endIcon={<ExpandMoreRoundedIcon sx={{ transform: isRecipientsExpanded ? 'rotate(180deg)' : undefined, transition: 'transform 0.2s' }} />}
              sx={{ flexShrink: 0, mr: -1, my: -0.5, minHeight: 28, px: 1, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', '& .MuiButton-endIcon': { ml: 0.25 } }}
            >
              {isRecipientsExpanded ? 'Hide fields' : 'Show all fields'}
            </Button>
            }
          >
            <SelectInput
              id="email-thread"
              value={isNewThread ? NEW_THREAD : draft.thread}
              onChange={(value) => updateDraft({ thread: value === NEW_THREAD ? (draft.subject || 'New thread') : value })}
              options={[...THREADS.map((thread) => ({ value: thread, label: thread })), { value: NEW_THREAD, label: '+ New thread' }]}
            />
          </Field>
          {isNewThread && (
            <Field id="email-new-thread" label="New thread name:">
              <TextInput id="email-new-thread" value={draft.thread} onChange={(thread) => updateDraft({ thread })} placeholder="Name this thread" />
            </Field>
          )}
          {/* While the fields are hidden, a summary of the key ones */}
          {!isRecipientsExpanded && (
            <dl className="grid min-w-0 gap-x-2 gap-y-0.5" style={{ gridTemplateColumns: 'auto minmax(0, 1fr)', fontFamily: font, fontSize: '13px', lineHeight: '19px' }}>
              <dt style={{ fontWeight: 600, color: '#5c5c5c' }}>To:</dt>
              <dd className="break-words" style={{ color: '#1c2024' }}>{draft.to || '-'}</dd>
              <dt style={{ fontWeight: 600, color: '#5c5c5c' }}>Subject:</dt>
              <dd className="break-words" style={{ color: '#1c2024' }}>{draft.subject || '-'}</dd>
            </dl>
          )}
          {isRecipientsExpanded && (
            <div id="recipient-fields" className="flex flex-col gap-4">
              <div className="h-px w-full" style={{ backgroundColor: '#ebeef7' }} aria-hidden="true" />
              <Field id="email-from" label="From:">
                <SelectInput id="email-from" value={draft.from} onChange={(from) => updateDraft({ from })} options={SENDERS.map((sender) => ({ value: sender, label: sender }))} />
              </Field>
              <Field id="email-to" label="To:">
                <TextInput id="email-to" value={draft.to} onChange={(to) => updateDraft({ to })} />
              </Field>
              <Field id="email-cc" label="CC:">
                <TextInput id="email-cc" value={draft.cc} onChange={(cc) => updateDraft({ cc })} />
              </Field>
              <Field id="email-bcc" label="BCC:">
                <TextInput id="email-bcc" value={draft.bcc} onChange={(bcc) => updateDraft({ bcc })} />
              </Field>
              <Field id="email-compliance" label="Compliance CC:">
                <TextInput id="email-compliance" value={draft.complianceCc} onChange={(complianceCc) => updateDraft({ complianceCc })} placeholder="Required for client emails" />
              </Field>
              <Field id="email-template" label="Email Template">
                <SelectInput id="email-template" value={draft.template} onChange={(template) => updateDraft({ template })} options={TEMPLATES.map((template) => ({ value: template, label: template }))} />
              </Field>
              <Field id="email-subject" label="Subject:">
                <TextInput id="email-subject" value={draft.subject} onChange={(subject) => updateDraft({ subject })} />
              </Field>
            </div>
          )}
        </div>
      </section>

      {/* Email Content */}
      <section className="bg-white flex flex-col gap-5 p-4 sm:p-6" style={{ borderRadius: '16px' }}>
        <SectionTitle icon={<MailOutlineRoundedIcon sx={{ color: '#1c2024' }} />}>Email Content</SectionTitle>

        <div className="flex flex-col gap-3 p-4 sm:p-5" style={{ border: '1px solid #ebeef7', borderRadius: '12px' }}>
          <SectionTitle>Introduction</SectionTitle>
          <RichTextEditor value={draft.introHtml} onChange={(html) => updateDraft({ introHtml: html })} minHeight="120px" lineHeight="24px" aria-label="Introduction" />
        </div>

        <div className="flex flex-col gap-4 p-4 sm:p-5" style={{ backgroundColor: '#ebeef7', borderRadius: '12px' }}>
          <div className="flex items-center justify-between gap-2">
            <SectionTitle icon={<CampaignIcon />}>Advisor Pitches</SectionTitle>
            <button
              onClick={onBack}
              className="flex items-center justify-center rounded-full w-9 h-9 hover:bg-black/[0.04]"
              aria-label="Edit advisor pitches"
              title="Edit in Pitch Curation"
            >
              <EditIcon />
            </button>
          </div>
          {profiles.map((profile) => {
            const currentRoleText = !hasCurrentRoleLine(profile.contentHtml) && getCurrentRoleText(profile);
            return (
              <article key={profile.id} className="bg-white flex flex-col gap-2 p-4 sm:p-5" style={{ borderRadius: '16px' }}>
                <div className="flex flex-wrap items-center gap-2">
                  <span style={{ fontFamily: font, fontSize: '16px', fontWeight: 600, color: '#333333' }}>{profile.name}</span>
                  <AngleTags angles={profile.angles} />
                </div>
                {currentRoleText && (
                  <p style={{ fontFamily: font, fontSize: '14px', lineHeight: '24px', fontWeight: 500, color: '#000000' }}>
                    {currentRoleText}
                  </p>
                )}
                <div
                  className="pitch-content"
                  style={{ fontFamily: font, fontSize: '14px', lineHeight: '24px', fontWeight: 500, color: '#000000' }}
                  dangerouslySetInnerHTML={{ __html: profile.contentHtml || '' }}
                />
              </article>
            );
          })}
        </div>

        <button
          onClick={() => showToast('No Insights transcripts are available for this request yet')}
          className="flex items-center gap-2 self-start hover:opacity-80"
          style={{ fontFamily: font, fontSize: '12px', fontWeight: 600, color: '#0068bc' }}
        >
          <AddCircleOutlineRoundedIcon sx={{ fontSize: 20 }} />
          Attach Insights Transcripts
        </button>

        {/* Content blocks: extra sections like the Introduction, between the pitches and the closing message */}
        {blocks.map((block, index) => (
          <div key={block.id} className="flex flex-col gap-3 p-4 sm:p-5" style={{ border: '1px solid #ebeef7', borderRadius: '12px' }}>
            <div className="flex items-center justify-between gap-2">
              <SectionTitle>Content Block{blocks.length > 1 ? ` ${index + 1}` : ''}</SectionTitle>
              <Tooltip title="Remove content block">
                <IconButton size="small" aria-label={`Remove content block ${index + 1}`} onClick={() => updateDraft({ blocks: blocks.filter((item) => item.id !== block.id) })}>
                  <DeleteOutlineRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </div>
            <RichTextEditor
              ref={(handle) => {
                if (handle) blockEditorRefs.current.set(block.id, handle);
                else blockEditorRefs.current.delete(block.id);
              }}
              value={block.html}
              onChange={(html) => updateDraft({ blocks: blocks.map((item) => (item.id === block.id ? { ...item, html } : item)) })}
              minHeight="120px"
              lineHeight="24px"
              aria-label={`Content block ${index + 1}`}
            />
          </div>
        ))}

        <button
          type="button"
          onClick={() => {
            const block = createBlock('text');
            updateDraft({ blocks: [...blocks, block] });
            setFocusBlockId(block.id);
          }}
          className="flex items-center justify-center gap-2 w-full rounded-xl py-4 transition-colors hover:bg-[#f6f8fb]"
          style={{ fontFamily: font, fontSize: '14px', fontWeight: 600, color: '#5c5c5c', border: '1.5px dashed #c4c9d1' }}
        >
          <AddRoundedIcon fontSize="small" />
          Add content block
        </button>

        <div className="flex flex-col gap-3 p-4 sm:p-5" style={{ border: '1px solid #ebeef7', borderRadius: '12px' }}>
          <SectionTitle>Closing Message</SectionTitle>
          <RichTextEditor value={draft.outroHtml} onChange={(html) => updateDraft({ outroHtml: html })} minHeight="120px" lineHeight="24px" aria-label="Closing message" />
        </div>
      </section>

      {threadHistory}

      <NavActions>
        <ModalButton label={isMobile ? 'Preview' : 'Preview Email'} onClick={() => switchMode('preview')} />
        {sendButton}
      </NavActions>
    </main>
  );
};

export default EmailComposer;
