import React, { useEffect, useMemo, useRef, useState } from 'react';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import UndoRoundedIcon from '@mui/icons-material/UndoRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import AccountBoxOutlinedIcon from '@mui/icons-material/AccountBoxOutlined';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import { ElevatedIconButton } from '../../components/buttons/ElevatedIconButton';
import {
  CONFIDENCE_COLORS,
  generatePromptedSuggestions,
  ISSUE_LABELS,
  PitchIssue,
  PitchSource,
  PitchSuggestion,
} from '../../data/pitchAnalysis';
import type { Profile } from '../../data/profiles';
import { isAbortError } from '../../services/aiService';

interface IssuePopoverProps {
  issue: PitchIssue;
  profile: Profile;
  /** 1-based position of this issue among the unresolved ones */
  position: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
  onApply: (suggestion: PitchSuggestion) => void;
  /** Revert the last applied suggestion */
  onUndo?: () => void;
  /** Open the advisor's Profile Data drawer */
  onOpenProfileData?: () => void;
  onClose: () => void;
  /** Positioning (absolute on desktop, bottom sheet on phones) */
  style?: React.CSSProperties;
  className?: string;
}

const font = "'Poppins', sans-serif";

/** One-click rewrites offered above the ask field */
const QUICK_ASKS = [
  { label: 'Shorter', prompt: 'Make this shorter and more direct' },
  { label: 'More specific', prompt: 'Make this more specific using their screener answers' },
  { label: 'Use their words', prompt: "Rewrite this using the advisor's own words from their screener answers" },
];

type DiffPart = { type: 'same' | 'del' | 'ins'; text: string };

const normalize = (word: string) => word.toLowerCase().replace(/[^\w$%]/g, '');

/**
 * Word-level diff (LCS) between the flagged statement and a rewrite.
 * Returns null when the rewrite shares too little with the original to read well as a diff.
 */
const diffWords = (before: string, after: string): DiffPart[] | null => {
  const a = before.split(/\s+/).filter(Boolean);
  const b = after.split(/\s+/).filter(Boolean);
  const table = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      table[i][j] = normalize(a[i]) === normalize(b[j]) ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }
  if (b.length === 0 || table[0][0] / b.length < 0.3) return null;

  const parts: DiffPart[] = [];
  const push = (type: DiffPart['type'], word: string) => {
    const last = parts[parts.length - 1];
    if (last && last.type === type) last.text += ` ${word}`;
    else parts.push({ type, text: word });
  };
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (normalize(a[i]) === normalize(b[j])) {
      push('same', b[j]);
      i += 1;
      j += 1;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      push('del', a[i]);
      i += 1;
    } else {
      push('ins', b[j]);
      j += 1;
    }
  }
  while (i < a.length) push('del', a[i++]);
  while (j < b.length) push('ins', b[j++]);
  return parts;
};

const DiffText: React.FC<{ before: string; after: string }> = ({ before, after }) => {
  const parts = useMemo(() => diffWords(before, after), [before, after]);
  if (!parts) return <>{after}</>;
  return (
    <>
      {parts.map((part, index) => (
        <React.Fragment key={index}>
          {index > 0 && ' '}
          {part.type === 'same' && part.text}
          {part.type === 'del' && (
            <del style={{ backgroundColor: '#fde8ea', color: '#6b3b40', textDecorationColor: '#c41e2f' }}>{part.text}</del>
          )}
          {part.type === 'ins' && (
            <ins style={{ backgroundColor: '#e3f4ea', color: '#0f4d2a', textDecoration: 'none' }}>{part.text}</ins>
          )}
        </React.Fragment>
      ))}
    </>
  );
};

/** Highlight words in a source answer that also appear in the rewrite */
const HighlightedAnswer: React.FC<{ answer: string; rewrite: string }> = ({ answer, rewrite }) => {
  const rewriteWords = new Set(rewrite.split(/\s+/).map(normalize).filter((word) => word.length > 3));
  return (
    <>
      {answer.split(/(\s+)/).map((token, index) =>
        rewriteWords.has(normalize(token))
          ? <mark key={index} style={{ backgroundColor: '#fff1c2', color: 'inherit', borderRadius: '2px' }}>{token}</mark>
          : <React.Fragment key={index}>{token}</React.Fragment>
      )}
    </>
  );
};

const SmallIconButton: React.FC<{
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ label, onClick, children }) => (
  <IconButton onClick={onClick} aria-label={label} title={label} size="small" sx={{ p: 0.5 }}>
    {children}
  </IconButton>
);

/**
 * IssuePopover Component
 *
 * Compact AI companion card for a flagged pitch statement: names the problem,
 * quotes the statement, offers rewrites as word diffs with numbered sources,
 * and a one-line ask with quick rewrites. Each prompt's results replace the
 * options shown, so the card always offers the most recent set.
 */
export const IssuePopover: React.FC<IssuePopoverProps> = ({
  issue,
  profile,
  position,
  total,
  onPrevious,
  onNext,
  onApply,
  onUndo,
  onOpenProfileData,
  onClose,
  style,
  className = '',
}) => {
  const [isApplied, setIsApplied] = useState(!!issue.resolved);
  const [promptText, setPromptText] = useState('');
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const [promptedSuggestions, setPromptedSuggestions] = useState<PitchSuggestion[]>([]);
  // Suggestion whose sources are showing
  const [openSourcesId, setOpenSourcesId] = useState<string | null>(null);
  const [copiedSourceId, setCopiedSourceId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Bring the whole card into view when it opens (it can start below the fold)
  useEffect(() => {
    rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, []);

  // Stop any request in flight when the card closes or switches statement
  useEffect(() => () => abortRef.current?.abort(), []);

  // Escape closes the card
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Latest prompt's results replace the earlier options
  const suggestions = promptedSuggestions.length > 0 ? promptedSuggestions : issue.suggestions;

  const submitPrompt = async (instruction: string) => {
    const text = instruction.trim();
    if (!text || pendingPrompt) return;

    const controller = new AbortController();
    abortRef.current = controller;
    setPendingPrompt(text);
    setPromptText('');

    try {
      const results = await generatePromptedSuggestions(issue, text, profile, controller.signal);
      setPromptedSuggestions(results.map((result, index) => ({ ...result, id: `${result.id}-${Date.now()}-${index}` })));
      setOpenSourcesId(null);
    } catch (error) {
      if (!isAbortError(error)) console.error('Prompted suggestions failed:', error);
      setPromptText(text); // Stopped - give the prompt back to edit
    } finally {
      abortRef.current = null;
      setPendingPrompt(null);
    }
  };

  const handleApply = (suggestion: PitchSuggestion) => {
    onApply(suggestion);
    setIsApplied(true);
  };

  const copySource = async (source: PitchSource) => {
    try {
      await navigator.clipboard.writeText(`Q: ${source.question}\nA: ${source.answer}`);
      setCopiedSourceId(source.id);
      setTimeout(() => setCopiedSourceId(null), 1500);
    } catch {
      // Clipboard can be unavailable (permissions / insecure context)
    }
  };

  const frameStyle: React.CSSProperties = {
    ...style,
    border: '1px solid #ebebeb',
    borderRadius: '14px',
    boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.12)',
    fontFamily: font,
  };

  if (isApplied) {
    // Compact confirmation bar: sized to its content, one line
    return (
      <div
        ref={rootRef}
        className={`bg-white flex items-center gap-1 py-1.5 pl-2 pr-1.5 ${className}`}
        style={{ ...frameStyle, width: 'auto', maxWidth: '100%', borderRadius: '12px', boxShadow: '0px 6px 16px rgba(16, 24, 40, 0.1)' }}
        role="status"
      >
        <span className="flex items-center gap-2 pr-2 whitespace-nowrap" style={{ fontSize: '13px', lineHeight: '20px', fontWeight: 600, color: '#1c2024' }}>
          <span className="flex items-center justify-center rounded-full shrink-0" style={{ width: '24px', height: '24px', backgroundColor: '#e3f4ea', color: '#149c4d' }} aria-hidden="true">
            <CheckRoundedIcon sx={{ fontSize: 16 }} />
          </span>
          Rewrite applied
        </span>
        <div className="h-5 w-px shrink-0" style={{ backgroundColor: '#e3e6eb' }} aria-hidden="true" />
        {onUndo && (
          <Button onClick={onUndo} size="small" color="inherit" startIcon={<UndoRoundedIcon />} sx={{ minHeight: 32, color: '#333333', whiteSpace: 'nowrap', px: 1.25 }}>
            Undo
          </Button>
        )}
        {total > 0 && (
          <Button onClick={onNext} size="small" endIcon={<ArrowForwardRoundedIcon />} sx={{ minHeight: 32, whiteSpace: 'nowrap', px: 1.25 }}>
            Next issue
          </Button>
        )}
        <SmallIconButton label="Close" onClick={onClose}><CloseRoundedIcon fontSize="small" /></SmallIconButton>
      </div>
    );
  }

  const levelColor = CONFIDENCE_COLORS[issue.level];

  return (
    <div
      ref={rootRef}
      className={`bg-white flex flex-col gap-3.5 p-[18px] overflow-y-auto ${className}`}
      style={frameStyle}
      role="dialog"
      aria-label={`${ISSUE_LABELS[issue.kind]}, ${issue.confidence}% confidence`}
    >
      {/* Problem first: what's wrong, then the statement it's about */}
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 min-w-0" style={{ fontSize: '14px', lineHeight: '20px', fontWeight: 600, color: '#1c2024' }} title={issue.message}>
          <span className="block shrink-0 rounded-full" style={{ width: '9px', height: '9px', backgroundColor: levelColor }} aria-hidden="true" />
          <span className="truncate">{ISSUE_LABELS[issue.kind]}</span>
          <span className="shrink-0" style={{ fontWeight: 500, color: '#5c5c5c' }}>· {issue.confidence}%</span>
        </p>
        <div className="flex items-center gap-1 shrink-0" style={{ fontSize: '13px', color: '#5c5c5c' }}>
          {total > 1 && (
            <>
              <SmallIconButton label="Previous issue" onClick={onPrevious}><ArrowBackRoundedIcon fontSize="small" /></SmallIconButton>
              <span style={{ fontWeight: 600 }}>{position}/{total}</span>
              <SmallIconButton label="Next issue" onClick={onNext}><ArrowForwardRoundedIcon fontSize="small" /></SmallIconButton>
              <div className="h-5 w-px mx-1" style={{ backgroundColor: '#d6d6d6' }} aria-hidden="true" />
            </>
          )}
          <SmallIconButton label="Close" onClick={onClose}><CloseRoundedIcon fontSize="small" /></SmallIconButton>
        </div>
      </div>
      <p style={{ fontSize: '12px', lineHeight: '18px', color: '#5c5c5c', borderLeft: `3px solid ${levelColor}`, paddingLeft: '10px' }}>
        {issue.text}
      </p>

      {/* Rewrites: the most recent set only (current options stay visible while a new set loads) */}
      <div className="flex flex-col" aria-live="polite">
        {pendingPrompt && (
          <div className="flex flex-col gap-2 pb-3">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate" style={{ fontSize: '12px', fontWeight: 500, color: '#5c5c5c' }}>Rewriting: “{pendingPrompt}”</span>
              <Button onClick={() => abortRef.current?.abort()} variant="outlined" size="small" color="inherit" sx={{ borderColor: '#d6d6d6' }}>Stop</Button>
            </div>
            {['100%', '70%'].map((width) => (
              <div key={width} className="loader-bar-animated rounded-full" style={{ height: '12px', width }} aria-hidden="true" />
            ))}
          </div>
        )}

        {suggestions.length === 0 && !pendingPrompt && (
          <p style={{ fontSize: '12px', lineHeight: '18px', color: '#5c5c5c' }}>{issue.message}</p>
        )}

        {suggestions.map((suggestion, index) => {
          const sourceCount = suggestion.sources.length;
          const isSourcesOpen = openSourcesId === suggestion.id;
          return (
            <div
              key={suggestion.id}
              className="flex flex-col gap-2 py-3"
              style={{ borderTop: index > 0 || pendingPrompt ? '1px solid #ebebeb' : undefined, paddingTop: index === 0 && !pendingPrompt ? 0 : undefined }}
            >
              <p style={{ fontSize: '13px', lineHeight: '20px', color: '#1c2024' }}>
                <DiffText before={issue.text} after={suggestion.text} />
              </p>
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 min-w-0">
                  {/* Why this rewrite works - opens its sources when it has any */}
                  <Chip
                    size="small"
                    variant="outlined"
                    label={sourceCount ? `${suggestion.title} · ${sourceCount} source${sourceCount === 1 ? '' : 's'}` : suggestion.title}
                    onClick={sourceCount ? () => setOpenSourcesId(isSourcesOpen ? null : suggestion.id) : undefined}
                    onDelete={sourceCount ? () => setOpenSourcesId(isSourcesOpen ? null : suggestion.id) : undefined}
                    deleteIcon={sourceCount ? <ExpandMoreRoundedIcon sx={{ transform: isSourcesOpen ? 'rotate(180deg)' : undefined, transition: 'transform 0.2s' }} /> : undefined}
                    aria-expanded={sourceCount ? isSourcesOpen : undefined}
                    sx={{
                      minWidth: 0,
                      height: 30,
                      fontSize: 11,
                      fontWeight: 500,
                      borderColor: '#e3e6eb',
                      color: sourceCount ? '#0068bc' : '#5c5c5c',
                      backgroundColor: isSourcesOpen ? '#e4effa' : '#ffffff',
                      '& .MuiChip-deleteIcon': { color: '#0068bc', fontSize: 18 },
                    }}
                  />
                  {onOpenProfileData && (
                    <ElevatedIconButton
                      label="Open profile data"
                      icon={<AccountBoxOutlinedIcon fontSize="small" />}
                      onClick={onOpenProfileData}
                    />
                  )}
                </span>
                <Button onClick={() => handleApply(suggestion)} variant="contained" size="small" sx={{ flexShrink: 0 }}>Apply</Button>
              </div>

              {isSourcesOpen && (
                <ul className="flex flex-col gap-2">
                  {suggestion.sources.map((source) => (
                    <li key={source.id} className="flex flex-col gap-1.5 rounded-lg p-2.5" style={{ backgroundColor: '#f8f9fd' }}>
                      <div className="flex items-center justify-between gap-2" style={{ fontSize: '11px', color: '#5c5c5c' }}>
                        <span className="min-w-0 truncate">
                          {source.projectLabel}{source.date ? ` · ${source.date}` : ''}
                        </span>
                        <ElevatedIconButton
                          label={copiedSourceId === source.id ? 'Copied' : 'Copy answer'}
                          icon={copiedSourceId === source.id ? <CheckRoundedIcon fontSize="small" /> : <ContentCopyRoundedIcon fontSize="small" />}
                          onClick={() => copySource(source)}
                          isDone={copiedSourceId === source.id}
                        />
                      </div>
                      <p style={{ fontSize: '12px', lineHeight: '18px', color: '#1c2024' }}>
                        “<HighlightedAnswer answer={source.answer} rewrite={suggestion.text} />”
                      </p>
                      <p className="line-clamp-2" style={{ fontSize: '11px', lineHeight: '16px', color: '#8b8d98' }} title={source.question}>
                        Q: {source.question}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {/* One-line ask with quick rewrites */}
      <div className="flex flex-col gap-2 pt-3" style={{ borderTop: '1px solid #ebebeb' }}>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_ASKS.map((ask) => (
            <Chip
              key={ask.label}
              label={ask.label}
              onClick={() => submitPrompt(ask.prompt)}
              disabled={!!pendingPrompt}
              size="small"
              sx={{ fontSize: 11, fontWeight: 500, backgroundColor: '#f0f4f8', '&:hover': { backgroundColor: '#e3e9f1' } }}
            />
          ))}
        </div>
        <div
          className="flex items-end justify-between gap-2 py-1.5 pl-3.5 pr-1.5"
          style={{
            border: `1px solid ${promptText ? '#0068bc' : '#d6d6d6'}`,
            borderRadius: promptText.length > 48 ? '14px' : '999px',
          }}
        >
          <textarea
            value={promptText}
            onChange={(event) => setPromptText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                submitPrompt(promptText);
              }
            }}
            rows={promptText.length > 48 ? 3 : 1}
            placeholder="Ask AI to rewrite this…"
            className="flex-1 resize-none bg-transparent focus:outline-none self-center"
            style={{ fontSize: '12px', lineHeight: '18px', color: '#1c2024' }}
            aria-label="Ask AI to rewrite this statement"
          />
          <IconButton
            onClick={() => submitPrompt(promptText)}
            disabled={!promptText.trim() || !!pendingPrompt}
            aria-label="Send"
            size="small"
            sx={{
              width: 26,
              height: 26,
              backgroundColor: '#1c2024',
              color: '#ffffff',
              '&:hover': { backgroundColor: '#333333' },
              '&.Mui-disabled': { backgroundColor: '#d6d6d6', color: 'rgba(0, 0, 0, 0.5)' },
            }}
          >
            <ArrowUpwardRoundedIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </div>
      </div>
    </div>
  );
};

export default IssuePopover;
