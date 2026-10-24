import React, { useEffect, useState } from 'react';
import { ModalButton } from '../../components/modal';
import {
  AgentCheck,
  AgentEdit,
  AgentRun,
  AUTONOMY_OPTIONS,
  AutonomyLevel,
  CheckStatus,
  EditStatus,
  HARD_CONSTRAINTS,
  UNDO_WINDOW_SECONDS,
} from '../../data/agentReview';
import aiSparkleUrl from '../../assets/ai.svg';

interface AgentReviewPanelProps {
  level: AutonomyLevel;
  onLevelChange: (level: AutonomyLevel) => void;
  run: AgentRun | null;
  /** True while the trace is being "worked through" */
  isRunning: boolean;
  /** The draft changed since the last run */
  isStale: boolean;
  onRun: () => void;
  onEditStatusChange: (editId: string, status: EditStatus) => void;
  /** Countdown seconds remaining for an autonomous send, or null */
  countdown: number | null;
  onCancelAutoSend: () => void;
  onApproveSend: () => void;
  onSendNow: () => void;
}

const font = "'Poppins', sans-serif";
const STEP_DELAY_MS = 280;

const STATUS_META: Record<CheckStatus, { label: string; color: string; background: string; icon: string }> = {
  pass: { label: 'Passed', color: '#149c4d', background: 'rgba(20, 156, 77, 0.1)', icon: '✓' },
  fixed: { label: 'Auto-fixed', color: '#0068bc', background: 'rgba(0, 130, 235, 0.1)', icon: '✎' },
  proposed: { label: 'Proposed', color: '#b35c00', background: 'rgba(254, 128, 15, 0.12)', icon: '?' },
  flagged: { label: 'Flagged', color: '#b35c00', background: 'rgba(254, 128, 15, 0.12)', icon: '!' },
  blocked: { label: 'Needs you', color: '#c41e2f', background: 'rgba(196, 30, 47, 0.1)', icon: '✕' },
  info: { label: 'Info', color: '#5c5c5c', background: 'rgba(0, 0, 0, 0.06)', icon: 'i' },
};

const RULE_LABEL: Record<AgentCheck['rule'], string> = { hard: 'Hard constraint', soft: 'Quality', info: 'Business rule' };

const MATRIX_ROWS: Array<{ label: string; values: string[] }> = [
  { label: 'Fix pitch statements', values: ['Agent', 'Agent', 'You approve', 'You', 'You'] },
  { label: 'Compliance & disclosure fixes', values: ['Agent', 'Agent', 'You approve', 'You', 'You'] },
  { label: 'Final send', values: ['Agent', 'You', 'You', 'You', 'You'] },
  { label: 'Hard constraints enforced', values: ['Always', 'Always', 'Always', 'Always', 'Always'] },
  { label: 'Typical Project Manager time', values: ['~0 min', '~1 min', '~3 min', '~8 min', '~15 min'] },
];

const Chip: React.FC<{ color: string; background: string; children: React.ReactNode }> = ({ color, background, children }) => (
  <span
    className="inline-flex items-center rounded px-1.5 shrink-0"
    style={{ fontFamily: font, fontSize: '11px', lineHeight: '18px', fontWeight: 600, color, backgroundColor: background }}
  >
    {children}
  </span>
);

/**
 * AgentReviewPanel Component
 *
 * The AI review agent for the composer. A human-in-the-loop scale sets how much the
 * agent may do on its own; the run shows every check, edit and the send decision.
 */
export const AgentReviewPanel: React.FC<AgentReviewPanelProps> = ({
  level,
  onLevelChange,
  run,
  isRunning,
  isStale,
  onRun,
  onEditStatusChange,
  countdown,
  onCancelAutoSend,
  onApproveSend,
  onSendNow,
}) => {
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [isConstraintsOpen, setIsConstraintsOpen] = useState(false);
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);
  const option = AUTONOMY_OPTIONS.find((item) => item.level === level) || AUTONOMY_OPTIONS[0];

  // Reveal the trace one check at a time while running
  useEffect(() => {
    if (!run) {
      setVisibleSteps(0);
      return;
    }
    if (!isRunning) {
      setVisibleSteps(run.checks.length);
      return;
    }
    setVisibleSteps(0);
    const timers = run.checks.map((_, index) => setTimeout(() => setVisibleSteps(index + 1), (index + 1) * STEP_DELAY_MS));
    return () => timers.forEach(clearTimeout);
  }, [run, isRunning]);

  const pendingEdits = run?.edits.filter((edit) => edit.status === 'pending') || [];
  const showDecision = run && !isRunning;

  return (
    <section className="bg-white flex flex-col gap-5 p-4 sm:p-6" style={{ borderRadius: '16px' }} aria-labelledby="agent-panel-title">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 id="agent-panel-title" className="flex items-center gap-2" style={{ fontFamily: font, fontSize: '18px', lineHeight: '24px', fontWeight: 600, color: '#000000' }}>
            <img src={aiSparkleUrl} alt="" width={20} height={20} />
            AI Review Agent
          </h2>
          <p style={{ fontFamily: font, fontSize: '13px', lineHeight: '18px', fontWeight: 500, color: '#5c5c5c' }}>
            Reviews recipients, compliance and every pitch, then acts within the autonomy you choose.
          </p>
        </div>
        <ModalButton
          label={isRunning ? 'Reviewing…' : run && !isStale ? 'Re-run Review' : 'Run Agent Review'}
          primary={!run || isStale}
          disabled={isRunning || countdown !== null}
          onClick={onRun}
          className="shrink-0 self-start"
        />
      </div>

      {/* Human-in-the-loop scale */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <span style={{ fontFamily: font, fontSize: '13px', fontWeight: 600, color: '#333333' }}>Human in the loop</span>
          <span style={{ fontFamily: font, fontSize: '12px', fontWeight: 500, color: '#5c5c5c' }}>0% = fully autonomous</span>
        </div>
        <div className="grid grid-cols-5 gap-1 p-1 rounded-xl" style={{ backgroundColor: '#f0f4f8' }} role="radiogroup" aria-label="Human in the loop">
          {AUTONOMY_OPTIONS.map((item) => {
            const isActive = item.level === level;
            return (
              <button
                key={item.level}
                onClick={() => onLevelChange(item.level)}
                disabled={isRunning || countdown !== null}
                className="flex flex-col items-center rounded-lg py-2 px-1 transition-colors disabled:cursor-not-allowed"
                style={{
                  backgroundColor: isActive ? '#ffffff' : 'transparent',
                  boxShadow: isActive ? '0px 1px 3px rgba(0, 0, 0, 0.12)' : undefined,
                }}
                role="radio"
                aria-checked={isActive}
              >
                <span style={{ fontFamily: font, fontSize: '15px', lineHeight: '20px', fontWeight: 700, color: isActive ? '#0068bc' : '#333333' }}>
                  {item.level}%
                </span>
                <span className="hidden sm:block text-center" style={{ fontFamily: font, fontSize: '11px', lineHeight: '14px', fontWeight: 500, color: '#5c5c5c' }}>
                  {item.name}
                </span>
              </button>
            );
          })}
        </div>

        <div className="grid sm:grid-cols-2 gap-3 rounded-xl p-4" style={{ border: '1px solid #ebeef7', backgroundColor: '#f8f9fd' }}>
          <div className="sm:col-span-2 flex flex-wrap items-baseline gap-x-2">
            <span style={{ fontFamily: font, fontSize: '14px', fontWeight: 600, color: '#000000' }}>{option.level}% · {option.name}</span>
            <span style={{ fontFamily: font, fontSize: '13px', fontWeight: 500, color: '#5c5c5c' }}>{option.tagline}</span>
          </div>
          <p style={{ fontFamily: font, fontSize: '12px', lineHeight: '17px', color: '#333333' }}>
            <strong>Agent:</strong> {option.agentDoes}
          </p>
          <p style={{ fontFamily: font, fontSize: '12px', lineHeight: '17px', color: '#333333' }}>
            <strong>You:</strong> {option.humanDoes}
          </p>
          <p className="sm:col-span-2" style={{ fontFamily: font, fontSize: '12px', lineHeight: '17px', color: '#5c5c5c' }}>
            <strong style={{ color: '#333333' }}>Trade-off:</strong> {option.tradeoff}
          </p>
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-1">
          <button
            onClick={() => setIsConstraintsOpen((open) => !open)}
            className="underline"
            style={{ fontFamily: font, fontSize: '12px', fontWeight: 600, color: '#0068bc' }}
            aria-expanded={isConstraintsOpen}
          >
            {isConstraintsOpen ? 'Hide' : 'Show'} business constraints
          </button>
          <button
            onClick={() => setIsMatrixOpen((open) => !open)}
            className="underline"
            style={{ fontFamily: font, fontSize: '12px', fontWeight: 600, color: '#0068bc' }}
            aria-expanded={isMatrixOpen}
          >
            {isMatrixOpen ? 'Hide' : 'Compare'} approaches
          </button>
        </div>

        {isConstraintsOpen && (
          <div className="flex flex-col gap-2 rounded-xl p-4" style={{ border: '1px solid #ebeef7' }}>
            <p style={{ fontFamily: font, fontSize: '12px', lineHeight: '17px', fontWeight: 500, color: '#5c5c5c' }}>
              These can't be waived at any autonomy level. At 0% the agent fixes what it safely can; anything it can't verify pauses autonomy and escalates to you.
            </p>
            <ul className="flex flex-col gap-1.5">
              {HARD_CONSTRAINTS.map((constraint) => (
                <li key={constraint.id} style={{ fontFamily: font, fontSize: '12px', lineHeight: '17px', color: '#333333' }}>
                  <strong>{constraint.title}.</strong> {constraint.why}
                </li>
              ))}
              <li style={{ fontFamily: font, fontSize: '12px', lineHeight: '17px', color: '#333333' }}>
                <strong>Send window &amp; undo.</strong> Autonomous sends only go out 7:00-19:00 (otherwise they're scheduled) and wait {UNDO_WINDOW_SECONDS}s so anyone can cancel.
              </li>
            </ul>
          </div>
        )}

        {isMatrixOpen && (
          <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid #ebeef7' }}>
            <table className="w-full min-w-[520px] text-left" style={{ fontFamily: font, fontSize: '12px', color: '#333333' }}>
              <thead style={{ backgroundColor: '#f8f9fd' }}>
                <tr>
                  <th className="p-2 font-semibold">Who does it</th>
                  {AUTONOMY_OPTIONS.map((item) => (
                    <th key={item.level} className="p-2 font-semibold" style={{ color: item.level === level ? '#0068bc' : undefined }}>
                      {item.level}%
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MATRIX_ROWS.map((row) => (
                  <tr key={row.label} className="border-t" style={{ borderColor: '#ebeef7' }}>
                    <td className="p-2 font-medium">{row.label}</td>
                    {row.values.map((value, index) => (
                      <td
                        key={index}
                        className="p-2"
                        style={{
                          fontWeight: AUTONOMY_OPTIONS[index].level === level ? 600 : 400,
                          backgroundColor: AUTONOMY_OPTIONS[index].level === level ? 'rgba(0, 130, 235, 0.06)' : undefined,
                        }}
                      >
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Decision trace */}
      {run && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <h3 style={{ fontFamily: font, fontSize: '14px', fontWeight: 600, color: '#000000' }}>Decision trace</h3>
            {isStale && !isRunning && (
              <Chip color="#b35c00" background="rgba(254, 128, 15, 0.12)">Email changed - re-run to update</Chip>
            )}
          </div>
          <ol className="flex flex-col" aria-live="polite">
            {run.checks.slice(0, visibleSteps).map((check, index) => {
              const meta = STATUS_META[check.status];
              return (
                <li key={check.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className="flex items-center justify-center rounded-full shrink-0"
                      style={{ width: '22px', height: '22px', backgroundColor: meta.background, color: meta.color, fontSize: '12px', fontWeight: 700 }}
                      aria-hidden="true"
                    >
                      {meta.icon}
                    </span>
                    {index < run.checks.length - 1 && <span className="w-px flex-1 my-1" style={{ backgroundColor: '#ebeef7' }} />}
                  </div>
                  <div className="flex flex-col gap-0.5 pb-3 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span style={{ fontFamily: font, fontSize: '13px', fontWeight: 600, color: '#333333' }}>{check.title}</span>
                      <Chip color={meta.color} background={meta.background}>{meta.label}</Chip>
                      <Chip color="#5c5c5c" background="rgba(0, 0, 0, 0.05)">{RULE_LABEL[check.rule]}</Chip>
                    </div>
                    <p style={{ fontFamily: font, fontSize: '12px', lineHeight: '17px', fontWeight: 500, color: '#5c5c5c' }}>{check.detail}</p>
                    {check.why && check.status !== 'pass' && (
                      <p style={{ fontFamily: font, fontSize: '11px', lineHeight: '15px', fontWeight: 500, color: '#8b8d98' }}>Why: {check.why}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
          {isRunning && (
            <div className="flex flex-col gap-1.5" aria-hidden="true">
              <div className="loader-bar-animated rounded-full" style={{ height: '12px', width: '60%' }} />
              <div className="loader-bar-animated rounded-full" style={{ height: '12px', width: '40%' }} />
            </div>
          )}
        </div>
      )}

      {/* Edits */}
      {showDecision && run.edits.length > 0 && (
        <EditList
          edits={run.edits}
          onEditStatusChange={onEditStatusChange}
        />
      )}

      {/* Decision */}
      {showDecision && (
        <DecisionBanner
          run={run}
          countdown={countdown}
          pendingCount={pendingEdits.length}
          onCancelAutoSend={onCancelAutoSend}
          onApproveSend={onApproveSend}
          onSendNow={onSendNow}
          onAcceptAll={() => pendingEdits.forEach((edit) => onEditStatusChange(edit.id, 'accepted'))}
        />
      )}
    </section>
  );
};

const EDIT_HEADINGS: Record<EditStatus, string> = {
  applied: 'Changes the agent made',
  accepted: 'Changes the agent made',
  pending: 'Proposed changes - accept or reject each',
  rejected: 'Proposed changes - accept or reject each',
  flagged: 'Flagged for you to fix',
};

const EditList: React.FC<{
  edits: AgentEdit[];
  onEditStatusChange: (editId: string, status: EditStatus) => void;
}> = ({ edits, onEditStatusChange }) => (
  <div className="flex flex-col gap-3">
    <h3 style={{ fontFamily: font, fontSize: '14px', fontWeight: 600, color: '#000000' }}>{EDIT_HEADINGS[edits[0].status]}</h3>
    <ul className="flex flex-col gap-2">
      {edits.map((edit) => (
        <li key={edit.id} className="flex flex-col gap-2 rounded-xl p-3" style={{ border: '1px solid #ebeef7', opacity: edit.status === 'rejected' ? 0.6 : 1 }}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex flex-col gap-0.5 min-w-0">
              <span style={{ fontFamily: font, fontSize: '13px', fontWeight: 600, color: '#333333' }}>{edit.label}</span>
              <span style={{ fontFamily: font, fontSize: '12px', lineHeight: '16px', fontWeight: 500, color: '#5c5c5c' }}>{edit.reason}</span>
            </div>
            <EditActions edit={edit} onEditStatusChange={onEditStatusChange} />
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            <p className="rounded-lg p-2" style={{ fontFamily: font, fontSize: '12px', lineHeight: '17px', backgroundColor: 'rgba(196, 30, 47, 0.06)', color: '#5c5c5c', textDecoration: edit.status === 'applied' || edit.status === 'accepted' ? 'line-through' : undefined }}>
              {edit.before}
            </p>
            <p className="rounded-lg p-2" style={{ fontFamily: font, fontSize: '12px', lineHeight: '17px', backgroundColor: 'rgba(20, 156, 77, 0.08)', color: '#1c2024' }}>
              {edit.after}
            </p>
          </div>
        </li>
      ))}
    </ul>
  </div>
);

const smallButton = (color: string): React.CSSProperties => ({
  fontFamily: font, fontSize: '12px', fontWeight: 600, color, border: `1px solid ${color}`, borderRadius: '6px', padding: '4px 10px',
});

const EditActions: React.FC<{ edit: AgentEdit; onEditStatusChange: (editId: string, status: EditStatus) => void }> = ({ edit, onEditStatusChange }) => {
  switch (edit.status) {
    case 'applied':
      return <button onClick={() => onEditStatusChange(edit.id, 'rejected')} style={smallButton('#5c5c5c')}>Undo</button>;
    case 'pending':
      return (
        <div className="flex gap-2 shrink-0">
          <button onClick={() => onEditStatusChange(edit.id, 'rejected')} style={smallButton('#5c5c5c')}>Reject</button>
          <button onClick={() => onEditStatusChange(edit.id, 'accepted')} style={{ ...smallButton('#0068bc'), backgroundColor: '#0068bc', color: '#ffffff' }}>Accept</button>
        </div>
      );
    case 'accepted':
      return <button onClick={() => onEditStatusChange(edit.id, 'pending')} style={smallButton('#149c4d')}>✓ Accepted</button>;
    case 'rejected':
      return <button onClick={() => onEditStatusChange(edit.id, 'pending')} style={smallButton('#5c5c5c')}>Rejected · Undo</button>;
    default:
      return <Chip color="#b35c00" background="rgba(254, 128, 15, 0.12)">You fix</Chip>;
  }
};

const OUTCOME_COLORS: Record<string, { color: string; background: string }> = {
  'auto-send': { color: '#149c4d', background: 'rgba(20, 156, 77, 0.08)' },
  schedule: { color: '#0068bc', background: 'rgba(0, 130, 235, 0.08)' },
  blocked: { color: '#c41e2f', background: 'rgba(196, 30, 47, 0.06)' },
  default: { color: '#0068bc', background: 'rgba(0, 130, 235, 0.06)' },
};

const DecisionBanner: React.FC<{
  run: AgentRun;
  countdown: number | null;
  pendingCount: number;
  onCancelAutoSend: () => void;
  onApproveSend: () => void;
  onSendNow: () => void;
  onAcceptAll: () => void;
}> = ({ run, countdown, pendingCount, onCancelAutoSend, onApproveSend, onSendNow, onAcceptAll }) => {
  const { decision } = run;
  const colors = OUTCOME_COLORS[decision.outcome] || OUTCOME_COLORS.default;

  return (
    <div className="flex flex-col gap-3 rounded-xl p-4" style={{ border: `1px solid ${colors.color}`, backgroundColor: colors.background }} role="status">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span style={{ fontFamily: font, fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: colors.color }}>
            Agent decision
          </span>
          <span style={{ fontFamily: font, fontSize: '16px', lineHeight: '22px', fontWeight: 600, color: '#1c2024' }}>
            {countdown !== null && decision.outcome === 'auto-send' && `Sending automatically in ${countdown}s`}
            {countdown !== null && decision.outcome === 'schedule' && `${decision.headline} - confirming in ${countdown}s`}
            {countdown === null && decision.headline}
          </span>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          {(decision.outcome === 'auto-send' || decision.outcome === 'schedule') && countdown !== null && (
            <ModalButton label="Cancel" onClick={onCancelAutoSend} />
          )}
          {decision.outcome === 'auto-send' && countdown === null && (
            <ModalButton label="Send now" primary onClick={onApproveSend} />
          )}
          {decision.outcome === 'schedule' && countdown === null && (
            <>
              <ModalButton label="Send now instead" onClick={onSendNow} />
              <ModalButton label="Confirm schedule" primary onClick={onApproveSend} />
            </>
          )}
          {decision.outcome === 'await-approval' && <ModalButton label="Approve & Send" primary onClick={onApproveSend} />}
          {decision.outcome === 'await-edit-review' && (
            <>
              {pendingCount > 0 && <ModalButton label="Accept all" onClick={onAcceptAll} />}
              <ModalButton label={pendingCount > 0 ? `${pendingCount} left to review` : 'Send Email'} primary disabled={pendingCount > 0} onClick={onApproveSend} />
            </>
          )}
        </div>
      </div>
      <ul className="flex flex-col gap-1 list-disc pl-5">
        {decision.reasoning.map((reason) => (
          <li key={reason} style={{ fontFamily: font, fontSize: '12px', lineHeight: '17px', fontWeight: 500, color: '#333333' }}>{reason}</li>
        ))}
      </ul>
    </div>
  );
};

export default AgentReviewPanel;
