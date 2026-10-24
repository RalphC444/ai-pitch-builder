import React, { useEffect, useRef, useState } from 'react';
import TextField from '@mui/material/TextField';
import { ModalButton } from '../modal';
import { generateBulletsFromProfileData, SelectedProfileItem } from '../../data/pitchAnalysis';
import type { AnglePrompt } from '../../data/anglePrompts';
import { isAbortError } from '../../services/aiService';
import aiSparkleUrl from '../../assets/ai.svg';

interface GenerateFromProfileBarProps {
  advisorName: string;
  items: SelectedProfileItem[];
  onClearSelection: () => void;
  /** Angle context for generation (optional) */
  anglePrompt?: AnglePrompt;
  /** Append HTML to the pitch being edited */
  onAddToPitch: (html: string) => void;
  /** Replace the pitch's bullets (optional - hidden when not supported) */
  onReplacePitch?: (html: string) => void;
}

type BarMode = 'idle' | 'loading' | 'result';

const font = "'Poppins', sans-serif";

const escapeHtml = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const toListHtml = (bullets: string[]) => `<ul>${bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join('')}</ul>`;

/** Selected items as raw bullets (screeners as Q / A pairs) */
const itemsAsIs = (items: SelectedProfileItem[]) =>
  `<ul>${items.map((item) => item.kind === 'screener'
    ? `<li><strong>Q:</strong> ${escapeHtml(item.text)}</li>${item.answer ? `<li><strong>A:</strong> ${escapeHtml(item.answer)}</li>` : ''}`
    : `<li>${escapeHtml(item.text)}</li>`).join('')}</ul>`;

/**
 * GenerateFromProfileBar Component
 *
 * Sticky bar at the bottom of the profile drawer. With profile data selected,
 * generate pitch bullets from it - optionally guided by a prompt - and add them
 * to (or replace) the pitch being edited. "Insert as-is" adds the raw selection.
 */
export const GenerateFromProfileBar: React.FC<GenerateFromProfileBarProps> = ({
  advisorName,
  items,
  onClearSelection,
  anglePrompt,
  onAddToPitch,
  onReplacePitch,
}) => {
  const [mode, setMode] = useState<BarMode>('idle');
  const [prompt, setPrompt] = useState('');
  const [bullets, setBullets] = useState<string[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  if (mode === 'idle' && items.length === 0) return null;

  const reset = () => {
    setMode('idle');
    setBullets([]);
    setPrompt('');
    onClearSelection();
  };

  const generate = async () => {
    const controller = new AbortController();
    abortRef.current = controller;
    setMode('loading');
    try {
      const result = await generateBulletsFromProfileData(advisorName, items, prompt, anglePrompt, controller.signal);
      setBullets(result);
      setMode('result');
    } catch (error) {
      if (!isAbortError(error)) console.error('Generation failed:', error);
      setMode('idle'); // Stopped - keep the selection and prompt
    } finally {
      abortRef.current = null;
    }
  };

  const count = `${items.length} item${items.length === 1 ? '' : 's'}`;

  return (
    <div
      className="flex flex-col gap-3 px-4 sm:px-6 py-4 bg-white border-t border-grey-scale-200"
      style={{ boxShadow: '0px -4px 12px rgba(0, 0, 0, 0.06)' }}
      aria-label="Generate pitch content from profile data"
    >
      {mode === 'result' ? (
        <>
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2" style={{ fontFamily: font, fontSize: '13px', fontWeight: 600, color: '#333333' }}>
              <img src={aiSparkleUrl} alt="" width={16} height={16} />
              Generated from {count}
            </span>
            <button onClick={generate} className="underline" style={{ fontFamily: font, fontSize: '12px', fontWeight: 600, color: '#0068bc' }}>
              Regenerate
            </button>
          </div>
          <ul className="flex flex-col gap-1.5 list-disc pl-5 max-h-40 overflow-y-auto rounded-lg py-2 pr-2" style={{ backgroundColor: '#f8f9fd' }}>
            {bullets.map((bullet) => (
              <li key={bullet} style={{ fontFamily: font, fontSize: '13px', lineHeight: '19px', fontWeight: 500, color: '#1c2024' }}>{bullet}</li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button onClick={reset} className="mr-auto underline" style={{ fontFamily: font, fontSize: '12px', fontWeight: 600, color: '#5c5c5c' }}>
              Discard
            </button>
            {onReplacePitch && (
              <ModalButton
                label="Replace Bullets"
                onClick={() => {
                  onReplacePitch(toListHtml(bullets));
                  reset();
                }}
              />
            )}
            <ModalButton
              label="Add to Pitch"
              primary
              onClick={() => {
                onAddToPitch(toListHtml(bullets));
                reset();
              }}
            />
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2">
            <span style={{ fontFamily: font, fontSize: '13px', fontWeight: 600, color: '#333333' }}>
              {mode === 'loading' ? `Generating from ${count}…` : `${count} selected`}
            </span>
            {mode === 'idle' && (
              <button onClick={onClearSelection} className="underline" style={{ fontFamily: font, fontSize: '12px', fontWeight: 600, color: '#5c5c5c' }}>
                Clear
              </button>
            )}
          </div>
          {mode === 'loading' ? (
            <div className="flex flex-col gap-1.5 py-1" aria-hidden="true">
              {['70%', '100%', '55%'].map((width) => (
                <div key={width} className="loader-bar-animated rounded-full" style={{ height: '12px', width }} />
              ))}
            </div>
          ) : (
            <TextField
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              multiline
              minRows={2}
              fullWidth
              size="small"
              placeholder="Optional: how should AI use this? e.g. Emphasize supply chain experience"
              inputProps={{ 'aria-label': 'Optional prompt' }}
              InputProps={{ sx: { fontSize: 13, lineHeight: '19px' } }}
            />
          )}
          <div className="flex items-center justify-end gap-2">
            {mode === 'loading' ? (
              <ModalButton label="Stop" onClick={() => abortRef.current?.abort()} />
            ) : (
              <>
                <ModalButton
                  label="Insert As-Is"
                  onClick={() => {
                    onAddToPitch(itemsAsIs(items));
                    reset();
                  }}
                />
                <ModalButton label="Generate Into Pitch" primary onClick={generate} />
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default GenerateFromProfileBar;
