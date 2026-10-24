import React, { useEffect, useRef, useState } from 'react';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import { AngleIcon } from '../icons/AngleIcon';
import { ModalButton } from '../modal';
import {
  AngleKeyDetails,
  AnglePrompt,
  DEFAULT_ANGLE_PROMPTS,
  isSamePrompt,
  PROMPT_VARIABLES,
  PromptAdvisor,
  renderPrompt,
} from '../../data/anglePrompts';

export interface PromptDrawerAngle {
  number: number;
  label: string;
  advisorCount: number;
}

interface PromptDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  angles: PromptDrawerAngle[];
  prompts: Record<number, AnglePrompt>;
  /** First advisor of each angle, used for the rendered preview */
  previewAdvisors: Record<number, PromptAdvisor | undefined>;
  onSaveAndRegenerate: (angleNumber: number, prompt: AnglePrompt) => void;
}

const font = "'Poppins', sans-serif";

const labelStyle: React.CSSProperties = { fontFamily: font, fontSize: '12px', lineHeight: '16px', fontWeight: 600, color: '#333333' };
const hintStyle: React.CSSProperties = { fontFamily: font, fontSize: '12px', lineHeight: '16px', fontWeight: 500, color: '#5c5c5c' };

const KEY_DETAIL_FIELDS: Array<{ key: keyof Omit<AngleKeyDetails, 'bulletCount'>; label: string; hint: string; rows: number }> = [
  { key: 'clientObjective', label: 'Client objective', hint: 'What the client wants to learn from this angle', rows: 2 },
  { key: 'targetExpertise', label: 'Target expertise', hint: 'The kind of advisor this angle is pitching', rows: 2 },
  { key: 'mustCover', label: 'Must-cover topics', hint: 'One per line - pitches should speak to these', rows: 3 },
  { key: 'avoid', label: 'Avoid', hint: 'Compliance, confidentiality or tone guardrails', rows: 2 },
];

/**
 * PromptDrawer Component
 *
 * Side drawer for the Edit Prompt flow. Each angle of the project has a prompt
 * template ({{variables}} filled per advisor) and key details. Saving regenerates
 * that angle's pitches.
 */
export const PromptDrawer: React.FC<PromptDrawerProps> = ({
  isOpen,
  onClose,
  angles,
  prompts,
  previewAdvisors,
  onSaveAndRegenerate,
}) => {
  const [activeAngle, setActiveAngle] = useState<number>(angles[0]?.number ?? 1);
  const [drafts, setDrafts] = useState<Record<number, AnglePrompt>>(prompts);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const templateRef = useRef<HTMLTextAreaElement>(null);

  // Fresh drafts every time the drawer opens
  useEffect(() => {
    if (isOpen) {
      setDrafts(prompts);
      setIsPreviewOpen(false);
      if (!angles.some((angle) => angle.number === activeAngle)) setActiveAngle(angles[0]?.number ?? 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const draft = drafts[activeAngle];
  const angle = angles.find((item) => item.number === activeAngle);
  const isDirty = (angleNumber: number) => drafts[angleNumber] && prompts[angleNumber] && !isSamePrompt(drafts[angleNumber], prompts[angleNumber]);
  const isDefault = draft && DEFAULT_ANGLE_PROMPTS[activeAngle] && isSamePrompt(draft, DEFAULT_ANGLE_PROMPTS[activeAngle]);

  const updateDraft = (changes: Partial<AnglePrompt>) => {
    setDrafts((previous) => ({ ...previous, [activeAngle]: { ...previous[activeAngle], ...changes } }));
  };

  const updateKeyDetails = (changes: Partial<AngleKeyDetails>) => {
    updateDraft({ keyDetails: { ...draft.keyDetails, ...changes } });
  };

  // Insert {{variable}} at the cursor in the template
  const insertVariable = (key: string) => {
    const textarea = templateRef.current;
    const token = `{{${key}}}`;
    if (!textarea) {
      updateDraft({ template: `${draft.template}${token}` });
      return;
    }
    const { selectionStart, selectionEnd } = textarea;
    const template = draft.template.slice(0, selectionStart) + token + draft.template.slice(selectionEnd);
    updateDraft({ template });
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(selectionStart + token.length, selectionStart + token.length);
    });
  };

  const previewAdvisor = previewAdvisors[activeAngle];

  return (
    <>
      <div className="fixed inset-0 bg-black/40" style={{ zIndex: 60 }} onClick={onClose} aria-hidden="true" />
      <div
        className="fixed top-0 right-0 bottom-0 flex flex-col bg-white w-full"
        style={{ zIndex: 61, maxWidth: '560px', boxShadow: '-4px 0px 24px rgba(0, 0, 0, 0.16)' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="prompt-drawer-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-4 sm:px-6 pt-5 pb-3">
          <div className="flex flex-col gap-1 min-w-0">
            <h2 id="prompt-drawer-title" style={{ fontFamily: font, fontSize: '18px', lineHeight: '24px', fontWeight: 600, color: '#333333' }}>
              Edit Pitch Prompt
            </h2>
            <p style={hintStyle}>Each angle has its own prompt template and key details. Saving regenerates that angle's pitches.</p>
          </div>
          <IconButton onClick={onClose} aria-label="Close prompt editor" size="small" sx={{ flexShrink: 0 }}>
            <CloseRoundedIcon />
          </IconButton>
        </div>

        {/* Angle tabs */}
        <div className="flex gap-2 px-4 sm:px-6 pb-3 overflow-x-auto border-b border-grey-scale-200" role="tablist" aria-label="Angles">
          {angles.map((item) => {
            const isActive = item.number === activeAngle;
            return (
              <Chip
                key={item.number}
                onClick={() => setActiveAngle(item.number)}
                role="tab"
                aria-selected={isActive}
                title={item.label}
                variant="outlined"
                icon={<AngleIcon number={item.number} style={{ color: isActive ? '#0068bc' : 'rgba(0, 0, 0, 0.8)' }} />}
                label={
                  <span className="flex items-center gap-1.5 min-w-0">
                    <span className="truncate">{item.label}</span>
                    {isDirty(item.number) && (
                      <span className="shrink-0 rounded-full" style={{ width: '6px', height: '6px', backgroundColor: '#fe800f' }} aria-label="Unsaved changes" />
                    )}
                  </span>
                }
                sx={{
                  flexShrink: 0,
                  maxWidth: 240,
                  height: 34,
                  fontSize: 13,
                  borderColor: isActive ? 'primary.main' : '#d6d6d6',
                  color: isActive ? 'primary.main' : '#333333',
                  backgroundColor: isActive ? 'rgba(0, 130, 235, 0.08)' : '#ffffff',
                }}
              />
            );
          })}
        </div>

        {/* Body */}
        {draft && (
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 flex flex-col gap-6">
            <p style={hintStyle}>
              {angle?.advisorCount ?? 0} advisor{angle?.advisorCount === 1 ? '' : 's'} in <strong style={{ color: '#333333' }}>{draft.angleLabel}</strong>
            </p>

            {/* Prompt template */}
            <section className="flex flex-col gap-2" aria-labelledby="prompt-template-label">
              <div className="flex items-center justify-between gap-2">
                <label id="prompt-template-label" htmlFor="prompt-template" style={labelStyle}>Prompt template</label>
                {!isDefault && (
                  <Button
                    onClick={() => updateDraft({ template: DEFAULT_ANGLE_PROMPTS[activeAngle].template, keyDetails: DEFAULT_ANGLE_PROMPTS[activeAngle].keyDetails })}
                    size="small"
                    sx={{ minHeight: 0, fontSize: 12 }}
                  >
                    Reset to default
                  </Button>
                )}
              </div>
              <TextField
                id="prompt-template"
                inputRef={templateRef}
                value={draft.template}
                onChange={(event) => updateDraft({ template: event.target.value })}
                multiline
                minRows={12}
                fullWidth
                InputProps={{ sx: { fontSize: 13, lineHeight: '19px' } }}
              />
              <div className="flex flex-col gap-1.5">
                <span style={hintStyle}>Insert variable</span>
                <div className="flex flex-wrap gap-1.5">
                  {PROMPT_VARIABLES.map((variable) => (
                    <Chip
                      key={variable.key}
                      onClick={() => insertVariable(variable.key)}
                      title={variable.description}
                      label={`{{${variable.key}}}`}
                      size="small"
                      variant="outlined"
                      color="primary"
                      sx={{ fontFamily: 'Menlo, monospace', fontSize: 11, fontWeight: 500, borderRadius: '4px' }}
                    />
                  ))}
                </div>
              </div>
            </section>

            {/* Key details */}
            <section className="flex flex-col gap-4" aria-label="Key details">
              <h3 style={{ fontFamily: font, fontSize: '14px', lineHeight: '20px', fontWeight: 600, color: '#333333' }}>Key details</h3>
              {KEY_DETAIL_FIELDS.map((field) => (
                <div key={field.key} className="flex flex-col gap-1">
                  <label htmlFor={`key-detail-${field.key}`} style={labelStyle}>{field.label}</label>
                  <span style={hintStyle}>{field.hint}</span>
                  <TextField
                    id={`key-detail-${field.key}`}
                    value={draft.keyDetails[field.key]}
                    onChange={(event) => updateKeyDetails({ [field.key]: event.target.value })}
                    multiline
                    minRows={field.rows}
                    fullWidth
                  />
                </div>
              ))}
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="key-detail-bullets" style={labelStyle}>Bullets per pitch</label>
                <TextField
                  id="key-detail-bullets"
                  select
                  size="small"
                  value={draft.keyDetails.bulletCount}
                  onChange={(event) => updateKeyDetails({ bulletCount: Number(event.target.value) })}
                  sx={{ minWidth: 80 }}
                >
                  {[2, 3, 4, 5].map((count) => <MenuItem key={count} value={count}>{count}</MenuItem>)}
                </TextField>
              </div>
            </section>

            {/* Rendered preview */}
            {previewAdvisor && (
              <section className="flex flex-col gap-2">
                <Button
                  onClick={() => setIsPreviewOpen((open) => !open)}
                  aria-expanded={isPreviewOpen}
                  size="small"
                  startIcon={isPreviewOpen ? <ExpandMoreRoundedIcon /> : <ChevronRightRoundedIcon />}
                  sx={{ alignSelf: 'flex-start', fontSize: 12 }}
                >
                  Preview prompt for {previewAdvisor.name}
                </Button>
                {isPreviewOpen && (
                  <pre
                    className="whitespace-pre-wrap rounded-lg p-3 overflow-x-auto"
                    style={{ fontFamily: 'Menlo, monospace', fontSize: '11px', lineHeight: '17px', backgroundColor: '#f0f4f8', color: '#1c2024' }}
                  >
                    {renderPrompt(draft, previewAdvisor)}
                  </pre>
                )}
              </section>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-4 sm:px-6 py-4 border-t border-grey-scale-200">
          <ModalButton label="Cancel" onClick={onClose} />
          <ModalButton
            label="Save & Regenerate"
            primary
            disabled={!draft || !draft.template.trim()}
            onClick={() => onSaveAndRegenerate(activeAngle, draft)}
          />
        </div>
      </div>
    </>
  );
};

export default PromptDrawer;
