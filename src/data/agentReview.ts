import type { Profile } from './profiles';
import type { AnglePrompt } from './anglePrompts';
import { getPitchAnalysis, replaceBullet, resolveIssue, SavedAnalyses } from './pitchAnalysis';
import type { ContentBlock } from './contentBlocks';

/**
 * The AI review agent / human-in-the-loop scale is hidden until its design is agreed.
 * Flip to true to show the agent panel in the composer again.
 */
export const AGENT_REVIEW_ENABLED = false;

/** How much of the send decision a human makes: 0% = fully autonomous, 100% = fully manual */
export type AutonomyLevel = 0 | 25 | 50 | 75 | 100;

export interface AutonomyOption {
  level: AutonomyLevel;
  name: string;
  tagline: string;
  agentDoes: string;
  humanDoes: string;
  /** Business trade-off of choosing this level */
  tradeoff: string;
}

export const AUTONOMY_OPTIONS: AutonomyOption[] = [
  {
    level: 0,
    name: 'Autonomous',
    tagline: 'Agent fixes, checks and sends',
    agentDoes: 'Applies every fix, verifies all guardrails, sends (or schedules) on its own',
    humanDoes: 'Nothing - gets an audit log and a short undo window',
    tradeoff: 'Fastest turnaround, but only safe while every hard business constraint can be verified automatically.',
  },
  {
    level: 25,
    name: 'Approve to send',
    tagline: 'Agent prepares, you press send',
    agentDoes: 'Applies every fix and verifies guardrails',
    humanDoes: 'Reviews the finished email and approves the send',
    tradeoff: 'One click of human accountability on every client email, with almost no editing effort.',
  },
  {
    level: 50,
    name: 'Approve edits',
    tagline: 'Agent proposes, you decide',
    agentDoes: 'Proposes each fix with its reasoning and sources',
    humanDoes: 'Accepts or rejects every edit, then sends',
    tradeoff: 'You see and own every change - slower, but best while trust in the agent is being built.',
  },
  {
    level: 75,
    name: 'Flag only',
    tagline: 'Agent flags, you edit',
    agentDoes: 'Finds issues and explains why they matter',
    humanDoes: 'Makes every edit by hand, re-runs the review, sends',
    tradeoff: 'Agent acts as a second pair of eyes; all writing stays with the Project Manager.',
  },
  {
    level: 100,
    name: 'Manual',
    tagline: 'Agent off',
    agentDoes: 'Only enforces hard compliance guardrails when you press send',
    humanDoes: 'Writes, reviews and sends everything',
    tradeoff: 'Today\'s workflow. Slowest, with the highest risk of missed issues.',
  },
];

/** Hard constraints can never be waived by autonomy - they must pass (or be fixed) before any send */
export const HARD_CONSTRAINTS = [
  { id: 'recipients', title: 'Valid client recipients', why: 'An email can\'t go out without at least one valid client address in To.' },
  { id: 'compliance', title: 'Compliance copied', why: 'Guidepoint policy: every client-facing email copies Compliance for the audit trail.' },
  { id: 'disclosure', title: 'Unvetted advisors disclosed', why: 'Clients must be told when an advisor hasn\'t been vetted for this project yet.' },
  { id: 'mnpi', title: 'No confidential information', why: 'MNPI policy: pitches can\'t imply access to confidential or non-public information.' },
  { id: 'verified', title: 'No unverified claims', why: 'Low-confidence statements (<60%) can\'t reach a client without a sourced fix.' },
  { id: 'volume', title: 'Advisor volume', why: 'Client emails are capped at 10 advisors to keep pitches reviewable.' },
];

export const SEND_WINDOW = { startHour: 7, endHour: 19 };
export const QUALITY_THRESHOLD = 80;
export const COMPLIANCE_ADDRESS = 'compliance@guidepoint.com';
export const UNDO_WINDOW_SECONDS = 10;

export interface EmailDraft {
  thread: string;
  from: string;
  to: string;
  cc: string;
  bcc: string;
  complianceCc: string;
  template: string;
  subject: string;
  introHtml: string;
  outroHtml: string;
  /** Extra blocks between the advisor pitches and the closing message */
  blocks?: ContentBlock[];
}

export type CheckStatus = 'pass' | 'fixed' | 'proposed' | 'flagged' | 'blocked' | 'info';

export interface AgentCheck {
  id: string;
  title: string;
  rule: 'hard' | 'soft' | 'info';
  status: CheckStatus;
  /** What the agent found / did */
  detail: string;
  /** Why this matters to the business */
  why?: string;
}

export type EditStatus = 'applied' | 'pending' | 'accepted' | 'rejected' | 'flagged';

export interface AgentEdit {
  id: string;
  checkId: string;
  target: 'pitch' | 'intro' | 'compliance' | 'subject';
  profileId?: string;
  issueId?: string;
  bulletIndex?: number;
  label: string;
  reason: string;
  before: string;
  after: string;
  status: EditStatus;
}

export type DecisionOutcome = 'auto-send' | 'schedule' | 'await-approval' | 'await-edit-review' | 'await-human-edits' | 'manual' | 'blocked';

export interface AgentDecision {
  outcome: DecisionOutcome;
  headline: string;
  reasoning: string[];
}

export interface AgentRun {
  level: AutonomyLevel;
  checks: AgentCheck[];
  edits: AgentEdit[];
  decision: AgentDecision;
  ranAt: string;
}

const EMAIL_PATTERN = /^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/;
const CONFIDENTIAL_PATTERN = /\b(confidential|non-public|insider|proprietary)\b/i;
const DISCLOSURE_PATTERN = /\b(unvetted|not yet (been )?vetted|haven't been vetted)\b/i;

export const parseEmails = (value: string) => value.split(/[,;\s]+/).map((item) => item.trim()).filter(Boolean);

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

export const isWithinSendWindow = (date: Date) =>
  date.getHours() >= SEND_WINDOW.startHour && date.getHours() < SEND_WINDOW.endHour;

/** Next 8:00 AM after `date` (today if before the window opens) */
export const nextSendTime = (date: Date) => {
  const next = new Date(date);
  if (date.getHours() >= SEND_WINDOW.endHour) next.setDate(next.getDate() + 1);
  next.setHours(8, 0, 0, 0);
  return next;
};

const editStatusFor = (level: AutonomyLevel): EditStatus => {
  if (level <= 25) return 'applied';
  if (level === 50) return 'pending';
  return 'flagged';
};

const checkStatusFor = (level: AutonomyLevel, hasEdits: boolean): CheckStatus => {
  if (!hasEdits) return 'pass';
  if (level <= 25) return 'fixed';
  if (level === 50) return 'proposed';
  return 'flagged';
};

/**
 * Run the review agent over the draft email and its pitches.
 * Pure: returns the checks, the edits it wants (applied / proposed / flagged by level)
 * and its send decision with reasoning.
 */
export const runAgentReview = (
  draft: EmailDraft,
  profiles: Profile[],
  prompts: Record<number, AnglePrompt>,
  savedAnalyses: SavedAnalyses,
  level: AutonomyLevel,
  now: Date = new Date(),
): AgentRun => {
  const checks: AgentCheck[] = [];
  const edits: AgentEdit[] = [];
  const editStatus = editStatusFor(level);
  const agentActive = level < 100;

  // 1. Recipients (hard, not fixable)
  const toAddresses = parseEmails(draft.to);
  const invalid = toAddresses.filter((address) => !EMAIL_PATTERN.test(address));
  checks.push({
    id: 'recipients',
    title: 'Valid client recipients',
    rule: 'hard',
    status: toAddresses.length > 0 && invalid.length === 0 ? 'pass' : 'blocked',
    detail: toAddresses.length === 0
      ? 'No client address in To - only a person can decide who receives this.'
      : invalid.length > 0
        ? `Can't verify ${invalid.join(', ')} - needs a person to correct.`
        : `${toAddresses.length} client recipient${toAddresses.length === 1 ? '' : 's'} verified.`,
    why: HARD_CONSTRAINTS[0].why,
  });

  // 2. Compliance CC (hard, fixable)
  const hasCompliance = parseEmails(draft.complianceCc).length > 0;
  if (!hasCompliance && agentActive) {
    edits.push({
      id: 'edit-compliance',
      checkId: 'compliance',
      target: 'compliance',
      label: 'Add Compliance CC',
      reason: 'Compliance CC was empty.',
      before: '(empty)',
      after: COMPLIANCE_ADDRESS,
      status: editStatus,
    });
  }
  checks.push({
    id: 'compliance',
    title: 'Compliance copied',
    rule: 'hard',
    status: hasCompliance ? 'pass' : agentActive ? checkStatusFor(level, true) : 'blocked',
    detail: hasCompliance ? `Copying ${draft.complianceCc}.` : `Compliance CC is empty - ${COMPLIANCE_ADDRESS} needs to be added.`,
    why: HARD_CONSTRAINTS[1].why,
  });

  // 3. Unvetted disclosure (hard, fixable)
  const unvetted = profiles.filter((profile) => profile.status === 'unvetted');
  const hasDisclosure = DISCLOSURE_PATTERN.test(stripHtml(draft.introHtml));
  const needsDisclosure = unvetted.length > 0 && !hasDisclosure;
  if (needsDisclosure && agentActive) {
    edits.push({
      id: 'edit-disclosure',
      checkId: 'disclosure',
      target: 'intro',
      label: 'Disclose unvetted advisors',
      reason: `${unvetted.length} of ${profiles.length} advisors are unvetted for this project.`,
      before: '(no disclosure in introduction)',
      after: `Please note: ${unvetted.length} of these advisors (${unvetted.map((profile) => profile.name).join(', ')}) have not yet been vetted for this project. We'll confirm their responses before scheduling.`,
      status: editStatus,
    });
  }
  checks.push({
    id: 'disclosure',
    title: 'Unvetted advisors disclosed',
    rule: 'hard',
    status: !needsDisclosure ? 'pass' : agentActive ? checkStatusFor(level, true) : 'blocked',
    detail: unvetted.length === 0
      ? 'All advisors are vetted.'
      : hasDisclosure
        ? `Introduction discloses the ${unvetted.length} unvetted advisor${unvetted.length === 1 ? '' : 's'}.`
        : `${unvetted.length} unvetted advisor${unvetted.length === 1 ? '' : 's'} not disclosed in the introduction.`,
    why: HARD_CONSTRAINTS[2].why,
  });

  // 4-6. Pitch statements: confidentiality (hard), unverified claims (hard), quality (soft)
  const pitchFixes: Record<'mnpi' | 'verified' | 'quality', AgentEdit[]> = { mnpi: [], verified: [], quality: [] };
  const unfixable: Record<'mnpi' | 'verified', string[]> = { mnpi: [], verified: [] };
  let scoreTotal = 0;

  profiles.forEach((profile) => {
    const analysis = getPitchAnalysis(profile, prompts, savedAnalyses);
    scoreTotal += analysis.score;
    analysis.issues.forEach((issue) => {
      if (issue.resolved || issue.level === 'high') return;
      const bucket = CONFIDENTIAL_PATTERN.test(issue.text) ? 'mnpi' : issue.level === 'low' ? 'verified' : 'quality';
      const suggestion = issue.suggestions[0];
      if (!suggestion) {
        if (bucket !== 'quality') unfixable[bucket].push(`${profile.name}: "${issue.text}"`);
        return;
      }
      if (!agentActive) {
        if (bucket !== 'quality') unfixable[bucket].push(`${profile.name}: "${issue.text}"`);
        return;
      }
      pitchFixes[bucket].push({
        id: `edit-${issue.id}`,
        checkId: bucket,
        target: 'pitch',
        profileId: profile.id,
        issueId: issue.id,
        bulletIndex: issue.index,
        label: `${profile.name} - ${suggestion.title}`,
        reason: `${issue.message} (${issue.confidence}% confidence)`,
        before: issue.text,
        after: suggestion.text,
        status: editStatus,
      });
    });
  });

  const averageScore = profiles.length ? Math.round(scoreTotal / profiles.length) : 0;

  (['mnpi', 'verified'] as const).forEach((id, index) => {
    const fixes = pitchFixes[id];
    edits.push(...fixes);
    const blocked = unfixable[id].length > 0;
    checks.push({
      id,
      title: HARD_CONSTRAINTS[3 + index].title,
      rule: 'hard',
      status: blocked ? 'blocked' : checkStatusFor(level, fixes.length > 0),
      detail: blocked
        ? `Needs a person: ${unfixable[id].join('; ')}`
        : fixes.length > 0
          ? `${fixes.length} statement${fixes.length === 1 ? '' : 's'} rewritten from screener sources.`
          : id === 'mnpi' ? 'No confidential references found.' : 'Every claim is backed by the advisor\'s profile or screeners.',
      why: HARD_CONSTRAINTS[3 + index].why,
    });
  });

  edits.push(...pitchFixes.quality);
  checks.push({
    id: 'quality',
    title: `Pitch quality ≥ ${QUALITY_THRESHOLD}`,
    rule: 'soft',
    status: checkStatusFor(level, pitchFixes.quality.length > 0),
    detail: pitchFixes.quality.length > 0
      ? `Average ${averageScore}/100 - ${pitchFixes.quality.length} medium-confidence statement${pitchFixes.quality.length === 1 ? '' : 's'} tightened.`
      : `Average ${averageScore}/100 across ${profiles.length} pitches.`,
  });

  // 7. Volume (hard)
  checks.push({
    id: 'volume',
    title: 'Advisor volume',
    rule: 'hard',
    status: profiles.length <= 10 ? 'pass' : 'blocked',
    detail: `${profiles.length} advisor${profiles.length === 1 ? '' : 's'} (limit 10).`,
    why: HARD_CONSTRAINTS[5].why,
  });

  // 8. Subject (soft)
  if (!draft.subject.trim() && agentActive) {
    edits.push({
      id: 'edit-subject',
      checkId: 'subject',
      target: 'subject',
      label: 'Write subject line',
      reason: 'Subject was empty.',
      before: '(empty)',
      after: `${draft.thread} - Advisor Pitches`,
      status: editStatus,
    });
  }
  checks.push({
    id: 'subject',
    title: 'Subject line',
    rule: 'soft',
    status: draft.subject.trim() ? 'pass' : checkStatusFor(level, agentActive),
    detail: draft.subject.trim() ? `"${draft.subject}"` : 'Subject is empty.',
  });

  // 9. Send window (info)
  const inWindow = isWithinSendWindow(now);
  checks.push({
    id: 'send-window',
    title: 'Client send window',
    rule: 'info',
    status: 'info',
    detail: inWindow
      ? `Within ${SEND_WINDOW.startHour}:00-${SEND_WINDOW.endHour}:00 send window.`
      : `Outside ${SEND_WINDOW.startHour}:00-${SEND_WINDOW.endHour}:00 - autonomous sends are scheduled for ${nextSendTime(now).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' })}.`,
    why: 'Business rule: automated client emails only go out during business hours.',
  });

  return { level, checks, edits, decision: decide(level, checks, edits, averageScore, inWindow, now), ranAt: now.toISOString() };
};

const decide = (
  level: AutonomyLevel,
  checks: AgentCheck[],
  edits: AgentEdit[],
  averageScore: number,
  inWindow: boolean,
  now: Date,
): AgentDecision => {
  const blocked = checks.filter((check) => check.status === 'blocked');
  const hardCount = checks.filter((check) => check.rule === 'hard').length;
  const fixCount = edits.length;

  if (blocked.length > 0) {
    return {
      outcome: 'blocked',
      headline: level === 0 ? 'Escalated to you - autonomy paused' : 'Needs your input before this can send',
      reasoning: [
        ...blocked.map((check) => `${check.title}: ${check.detail}`),
        'Hard business constraints can\'t be waived at any autonomy level, so the agent stopped instead of guessing.',
      ],
    };
  }

  const base = [
    `${hardCount}/${hardCount} hard constraints satisfied${fixCount && level <= 25 ? ` after ${fixCount} automatic fix${fixCount === 1 ? '' : 'es'}` : ''}.`,
    `Average pitch quality ${averageScore}/100 (threshold ${QUALITY_THRESHOLD}).`,
  ];

  switch (level) {
    case 0:
      return inWindow
        ? {
          outcome: 'auto-send',
          headline: 'Sending automatically',
          reasoning: [...base, `Autonomy 0% human-in-the-loop - sending after a ${UNDO_WINDOW_SECONDS}s undo window.`],
        }
        : {
          outcome: 'schedule',
          headline: `Scheduled for ${nextSendTime(now).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' })}`,
          reasoning: [...base, 'Outside the client send window, so the agent scheduled the send instead of sending now.'],
        };
    case 25:
      return { outcome: 'await-approval', headline: 'Ready - approve to send', reasoning: [...base, 'Autonomy 25%: the agent prepared everything; a person approves the final send.'] };
    case 50:
      return {
        outcome: 'await-edit-review',
        headline: `${fixCount} edit${fixCount === 1 ? '' : 's'} to review`,
        reasoning: [`${fixCount} proposed edit${fixCount === 1 ? '' : 's'} - nothing changes until you accept ${fixCount === 1 ? 'it' : 'them'}.`, ...base.slice(1), 'Autonomy 50%: you accept or reject each edit, then send.'],
      };
    case 75:
      return {
        outcome: 'await-human-edits',
        headline: `${fixCount} issue${fixCount === 1 ? '' : 's'} flagged for you`,
        reasoning: [`${fixCount} flagged issue${fixCount === 1 ? '' : 's'} - the agent won't change your email.`, ...base.slice(1), 'Autonomy 75%: make the edits yourself, then re-run the review.'],
      };
    default:
      return { outcome: 'manual', headline: 'Agent off - manual send', reasoning: ['Autonomy 100%: only hard compliance guardrails are enforced when you press Send.'] };
  }
};

/**
 * Apply the edits that are applied/accepted to the draft and pitches.
 * Rewritten statements are recorded as resolved so a re-run doesn't flag them again.
 */
export const applyAgentEdits = (
  draft: EmailDraft,
  profiles: Profile[],
  edits: AgentEdit[],
  prompts: Record<number, AnglePrompt>,
  savedAnalyses: SavedAnalyses,
): { draft: EmailDraft; profiles: Profile[]; savedAnalyses: SavedAnalyses } => {
  const nextDraft = { ...draft };
  let nextProfiles = profiles;
  const nextSaved = { ...savedAnalyses };

  edits
    .filter((edit) => edit.status === 'applied' || edit.status === 'accepted')
    .forEach((edit) => {
      if (edit.target === 'compliance') {
        nextDraft.complianceCc = nextDraft.complianceCc ? `${nextDraft.complianceCc}, ${edit.after}` : edit.after;
      } else if (edit.target === 'intro') {
        nextDraft.introHtml = `${nextDraft.introHtml}<p><br></p><p>${edit.after}</p>`;
      } else if (edit.target === 'subject') {
        nextDraft.subject = edit.after;
      } else if (edit.target === 'pitch' && edit.profileId && edit.issueId && edit.bulletIndex !== undefined) {
        const profile = nextProfiles.find((item) => item.id === edit.profileId);
        if (!profile) return;
        const analysis = resolveIssue(getPitchAnalysis(profile, prompts, nextSaved), edit.issueId, edit.after);
        const html = replaceBullet(profile.contentHtml || '', edit.bulletIndex, edit.after);
        nextSaved[profile.id] = { html, analysis };
        nextProfiles = nextProfiles.map((item) => (item.id === profile.id ? { ...item, contentHtml: html } : item));
      }
    });

  return { draft: nextDraft, profiles: nextProfiles, savedAnalyses: nextSaved };
};
