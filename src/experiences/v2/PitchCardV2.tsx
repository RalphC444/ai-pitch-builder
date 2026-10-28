import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Button from '@mui/material/Button';
import { ProfileActionButton } from '../../components/profile/ProfileCard';
import { Tag } from '../../components/badges/Tag';
import { AngleTags } from '../../components/badges/AngleTags';
import { EditIcon } from '../../components/icons/EditIcon';
import { DeleteIcon } from '../../components/icons/DeleteIcon';
import { EraseIcon } from '../../components/icons/EraseIcon';
import { DiscardIcon } from '../../components/icons/DiscardIcon';
import { SaveIcon } from '../../components/icons/SaveIcon';
import { TranslationIcon } from '../../components/icons/TranslationIcon';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import { ToolbarDropdownButton } from '../../components/toolbar/ToolbarDropdownButton';
import { RichTextEditor, RichTextEditorHandle } from '../../components/editor/RichTextEditor';
import { PitchSkeleton } from '../../components/loader/PitchSkeleton';
import { useToast } from '../../components/toast';
import { useMediaQuery, MOBILE_QUERY } from '../../hooks/useMediaQuery';
import { QualityScoreIndicator } from './PitchQuality';
import { QualityPanel } from './QualityPanel';
import { IssuePopover } from './IssuePopover';
import {
  analyzePitch,
  PitchAnalysis,
  PitchIssue,
  PitchSuggestion,
  replaceBullet,
  resolveIssue,
} from '../../data/pitchAnalysis';
import type { AnglePrompt } from '../../data/anglePrompts';
import { getCurrentRoleText, hasCurrentRoleLine, Profile, withCurrentRoleLine } from '../../data/profiles';
import aiSparkleUrl from '../../assets/ai.svg';

interface PitchCardV2Props {
  profile: Profile;
  analysis: PitchAnalysis;
  anglePrompt?: AnglePrompt;
  isEditing: boolean;
  isLoading: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onSave: (html: string, analysis: PitchAnalysis) => void;
  onDiscard: () => void;
  onShowProfileDetails: () => void;
  /** HTML from the profile drawer to add to the pitch being edited, or to replace its bullets */
  injectContent?: { html: string; mode: 'append' | 'replace' } | null;
  onInjectComplete?: () => void;
}

const font = "'Poppins', sans-serif";

const TRANSLATE_LANGUAGES = ['Spanish', 'French', 'German', 'Japanese', 'Mandarin'];

/** Pitch quality shows a loading state this long after the last change, then rescores */
const SCORING_DELAY_MS = 4000;

/** Caret position as a character offset into the editor's text */
const getCaretOffset = (root: HTMLElement): number | null => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || !root.contains(selection.anchorNode)) return null;
  const caret = selection.getRangeAt(0);
  const range = document.createRange();
  range.selectNodeContents(root);
  range.setEnd(caret.endContainer, caret.endOffset);
  return range.toString().length;
};

/** Put the caret back at a character offset after the editor HTML was replaced */
const restoreCaret = (root: HTMLElement, offset: number) => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let remaining = offset;
  let node = walker.nextNode();
  while (node) {
    const length = node.textContent?.length || 0;
    if (remaining <= length) {
      const range = document.createRange();
      range.setStart(node, remaining);
      range.collapse(true);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      return;
    }
    remaining -= length;
    node = walker.nextNode();
  }
};

/**
 * Wrap each bullet's text in a span carrying its confidence, so it gets the
 * colored underline and can be clicked to open the AI popover
 */
const decorateHtml = (html: string, analysis: PitchAnalysis): string => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('li').forEach((item, index) => {
    const issue = analysis.issues[index];
    if (!issue || !item.textContent?.trim()) return;
    const span = doc.createElement('span');
    span.className = 'pitch-statement';
    span.dataset.issueId = issue.id;
    span.dataset.level = issue.level;
    if (issue.resolved) span.dataset.resolved = 'true';
    while (item.firstChild) span.appendChild(item.firstChild);
    item.appendChild(span);
  });
  return doc.body.innerHTML;
};

/**
 * Remove the decoration spans, leaving the plain pitch HTML
 */
const stripDecorations = (html: string): string => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('span.pitch-statement').forEach((span) => {
    span.replaceWith(...Array.from(span.childNodes));
  });
  return doc.body.innerHTML;
};

/**
 * Re-analyze edited content, keeping "resolved" on statements whose text didn't change
 */
const reanalyze = (profile: Profile, html: string, prompt: AnglePrompt | undefined, previous: PitchAnalysis): PitchAnalysis => {
  const next = analyzePitch({ ...profile, contentHtml: html }, prompt);
  const resolvedTexts = new Map(previous.issues.filter((issue) => issue.resolved).map((issue) => [issue.text, issue]));
  const issues = next.issues.map((issue) => {
    const resolved = resolvedTexts.get(issue.text);
    return resolved ? { ...issue, confidence: resolved.confidence, level: resolved.level, resolved: true, message: resolved.message } : issue;
  });
  return analyzePitchSummary(issues, next);
};

const analyzePitchSummary = (issues: PitchIssue[], base: PitchAnalysis): PitchAnalysis => {
  const counts = { high: 0, medium: 0, low: 0 };
  issues.forEach((issue) => { counts[issue.level] += 1; });
  const score = issues.length ? Math.round(issues.reduce((total, issue) => total + issue.confidence, 0) / issues.length) : 0;
  return { ...base, issues, counts, score };
};

/**
 * PitchCardV2 Component
 *
 * Advisor pitch card for the ideal (V2) experience. In edit mode each statement is
 * underlined by confidence; clicking one opens the in-context AI editing companion,
 * with the Pitch Quality panel alongside.
 */
export const PitchCardV2: React.FC<PitchCardV2Props> = ({
  profile,
  analysis,
  anglePrompt,
  isEditing,
  isLoading,
  onEdit,
  onDelete,
  onSave,
  onDiscard,
  onShowProfileDetails,
  injectContent,
  onInjectComplete,
}) => {
  const { showToast } = useToast();
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const editorRef = useRef<RichTextEditorHandle>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const [draftAnalysis, setDraftAnalysis] = useState<PitchAnalysis>(analysis);
  const [draftHtml, setDraftHtml] = useState('');
  const [activeIssueId, setActiveIssueId] = useState<string | null>(null);
  const [popoverPosition, setPopoverPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const [isQualityPanelOpen, setIsQualityPanelOpen] = useState(false);
  const [isScoring, setIsScoring] = useState(false);
  const scoringTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const analysisRef = useRef(draftAnalysis);
  analysisRef.current = draftAnalysis;

  const cancelScoring = () => {
    if (scoringTimerRef.current) clearTimeout(scoringTimerRef.current);
    scoringTimerRef.current = null;
  };

  // Start a fresh draft each time edit mode opens
  useEffect(() => {
    if (isEditing) {
      setDraftAnalysis(analysis);
      // The "Current:" role line is part of the editable pitch, above the bullets
      setDraftHtml(decorateHtml(withCurrentRoleLine(profile, profile.contentHtml), analysis));
      // Pitch grading opens with the editor
      setIsQualityPanelOpen(true);
    } else {
      setActiveIssueId(null);
      setIsQualityPanelOpen(false);
      cancelScoring();
      setIsScoring(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  useEffect(() => cancelScoring, []);

  /**
   * Live feedback: show pitch quality as loading, and rescore once edits have
   * paused for SCORING_DELAY_MS. Each new change restarts the wait.
   */
  const scheduleRescore = useCallback(() => {
    setIsScoring(true);
    cancelScoring();
    scoringTimerRef.current = setTimeout(() => {
      scoringTimerRef.current = null;
      const root = editorRef.current?.element;
      if (!root) {
        setIsScoring(false);
        return;
      }
      const plain = stripDecorations(root.innerHTML);
      const next = reanalyze(profile, plain, anglePrompt, analysisRef.current);
      const decorated = decorateHtml(plain, next);
      if (root.innerHTML !== decorated) {
        // Refresh the underlines without moving the caret
        const caret = getCaretOffset(root);
        root.innerHTML = decorated;
        if (caret !== null) restoreCaret(root, caret);
      }
      setDraftHtml(decorated);
      setDraftAnalysis(next);
      setIsScoring(false);
    }, SCORING_DELAY_MS);
  }, [profile, anglePrompt]);

  const handleEditorChange = (html: string) => {
    setDraftHtml(html);
    scheduleRescore();
  };

  // Append content injected from the profile drawer, then rescore
  useEffect(() => {
    const root = editorRef.current?.element;
    if (!injectContent || !isEditing || !root) return;
    if (injectContent.mode === 'replace') {
      // Keep the "Current:" role line, swap out the bullets
      root.innerHTML = withCurrentRoleLine(profile, injectContent.html);
      setActiveIssueId(null);
    } else {
      root.insertAdjacentHTML('beforeend', injectContent.html);
    }
    setDraftHtml(root.innerHTML);
    scheduleRescore();
    onInjectComplete?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [injectContent]);

  const openIssues = useMemo(
    () => draftAnalysis.issues.filter((issue) => issue.level !== 'high' && !issue.resolved),
    [draftAnalysis],
  );
  const activeIssue = draftAnalysis.issues.find((issue) => issue.id === activeIssueId) || null;

  // Anchor the popover just below the clicked statement
  const positionPopover = useCallback((issueId: string) => {
    const container = bodyRef.current;
    const target = editorRef.current?.element?.querySelector<HTMLElement>(`[data-issue-id="${issueId}"]`);
    if (!container || !target) return;
    const containerRect = container.getBoundingClientRect();
    const rect = target.getBoundingClientRect();
    const width = Math.min(440, containerRect.width);
    setPopoverPosition({
      top: rect.bottom - containerRect.top + 8,
      left: Math.max(0, Math.min(rect.left - containerRect.left, containerRect.width - width)),
      width,
    });
  }, []);

  const openIssue = useCallback((issueId: string) => {
    setActiveIssueId(issueId);
    positionPopover(issueId);
  }, [positionPopover]);

  // Keep the popover under its statement when the text reflows (e.g. after Apply)
  useEffect(() => {
    if (!activeIssueId) return;
    const frame = requestAnimationFrame(() => positionPopover(activeIssueId));
    return () => cancelAnimationFrame(frame);
  }, [activeIssueId, draftHtml, positionPopover]);

  // Highlight the active statement
  useEffect(() => {
    const root = editorRef.current?.element;
    if (!root) return;
    root.querySelectorAll<HTMLElement>('.pitch-statement').forEach((span) => {
      span.dataset.active = span.dataset.issueId === activeIssueId ? 'true' : 'false';
    });
  }, [activeIssueId, draftHtml]);

  const handleEditorClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>('.pitch-statement');
    const issue = draftAnalysis.issues.find((item) => item.id === target?.dataset.issueId);
    if (issue && (issue.level !== 'high' || issue.resolved)) {
      openIssue(issue.id);
    } else {
      setActiveIssueId(null);
    }
  };

  // The pitch as it was before the last Apply, for Undo
  const beforeApplyRef = useRef<{ html: string; analysis: PitchAnalysis } | null>(null);

  const applySuggestion = (issue: PitchIssue, suggestion: PitchSuggestion) => {
    beforeApplyRef.current = { html: draftHtml, analysis: draftAnalysis };
    const plain = replaceBullet(stripDecorations(draftHtml), issue.index, suggestion.text);
    const next = resolveIssue(draftAnalysis, issue.id, suggestion.text);
    setDraftAnalysis(next);
    setDraftHtml(decorateHtml(plain, next));
    scheduleRescore();
  };

  const undoApply = () => {
    const before = beforeApplyRef.current;
    if (!before) return;
    beforeApplyRef.current = null;
    setDraftHtml(before.html);
    setDraftAnalysis(before.analysis);
    scheduleRescore();
  };

  const goToIssue = (direction: 1 | -1) => {
    if (openIssues.length === 0) {
      setActiveIssueId(null);
      return;
    }
    const currentIndex = openIssues.findIndex((issue) => issue.id === activeIssueId);
    const nextIndex = currentIndex === -1
      ? 0
      : (currentIndex + direction + openIssues.length) % openIssues.length;
    openIssue(openIssues[nextIndex].id);
  };

  // Agent: apply the top suggestion to every open issue
  const fixAllWithAgent = () => {
    let plain = stripDecorations(draftHtml);
    let next = draftAnalysis;
    let applied = 0;
    openIssues.forEach((issue) => {
      const suggestion = issue.suggestions[0];
      if (!suggestion) return;
      plain = replaceBullet(plain, issue.index, suggestion.text);
      next = resolveIssue(next, issue.id, suggestion.text);
      applied += 1;
    });
    setDraftAnalysis(next);
    setDraftHtml(decorateHtml(plain, next));
    setActiveIssueId(null);
    if (applied) scheduleRescore();
    showToast(applied ? `Agent applied ${applied} fix${applied === 1 ? '' : 'es'}` : 'No open issues to fix');
  };

  const recheckQuality = () => scheduleRescore();

  const handleClear = () => {
    setDraftHtml('');
    setDraftAnalysis(analyzePitch({ ...profile, contentHtml: '' }, anglePrompt));
    setActiveIssueId(null);
    scheduleRescore();
  };

  const handleSave = () => {
    const plain = stripDecorations(editorRef.current?.element?.innerHTML ?? draftHtml);
    // Saving mid-wait: score the final content now rather than waiting
    const finalAnalysis = isScoring ? reanalyze(profile, plain, anglePrompt, draftAnalysis) : draftAnalysis;
    cancelScoring();
    onSave(plain, finalAnalysis);
  };

  const currentRoleText = getCurrentRoleText(profile);
  const header = (
    <div className="flex items-start justify-between gap-3 w-full">
      <div className="flex flex-col gap-1 min-w-0">
      <div className="flex flex-wrap items-center gap-2 min-w-0">
        <span style={{ fontFamily: font, fontSize: '16px', lineHeight: '22px', fontWeight: 600, color: '#333333' }}>
          {profile.name}
        </span>
        <AngleTags angles={profile.angles} />
        {profile.status === 'vetted' ? <Tag label="Vetted" tone="vetted" /> : <Tag label="Unvetted" tone="unvetted" />}
      </div>
      {!isLoading && (
        <QualityScoreIndicator
          analysis={isEditing ? draftAnalysis : analysis}
          isScoring={isEditing && isScoring}
          isPanelOpen={isEditing && isQualityPanelOpen}
          onTogglePanel={() => {
            if (isEditing) {
              setIsQualityPanelOpen((open) => !open);
            } else {
              // From view mode: open the pitch with the quality panel showing
              setIsQualityPanelOpen(true);
              onEdit();
            }
          }}
        />
      )}
      </div>
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        {isEditing ? (
          <>
            <ProfileActionButton key="clear" icon={<EraseIcon />} onClick={handleClear} ariaLabel={`Clear content for ${profile.name}`} tooltip="Clear pitch" />
            <div className="h-6 w-px bg-grey-scale-200" aria-hidden="true" />
            <ProfileActionButton key="discard" icon={<DiscardIcon />} onClick={onDiscard} ariaLabel={`Discard changes for ${profile.name}`} tooltip="Discard changes" />
            <ProfileActionButton key="save" icon={<SaveIcon />} onClick={handleSave} ariaLabel={`Save ${profile.name}`} tooltip="Save pitch" />
          </>
        ) : (
          <>
            <ProfileActionButton key="edit" icon={<EditIcon />} onClick={onEdit} ariaLabel={`Edit ${profile.name}`} tooltip="Edit pitch" />
            <div className="h-6 w-px bg-grey-scale-200" aria-hidden="true" />
            <ProfileActionButton key="delete" icon={<DeleteIcon />} onClick={onDelete} ariaLabel={`Delete ${profile.name}`} tooltip="Remove advisor" />
          </>
        )}
      </div>
    </div>
  );

  // View mode only - in edit mode the role line lives inside the editor
  const currentLine = currentRoleText && !hasCurrentRoleLine(profile.contentHtml) && (
    <p style={{ fontFamily: font, fontSize: '16px', lineHeight: '24px', fontWeight: 500, color: '#000000' }}>
      {currentRoleText}
    </p>
  );

  return (
    <article
      className={`bg-white flex flex-col gap-4 p-5 sm:p-8 w-full transition-colors ${isLoading ? '' : 'pitch-card-in'}`}
      style={{ border: isEditing ? '2px solid #0068bc' : '1px solid #ebebeb', borderRadius: '16px' }}
      aria-label={`Pitch for ${profile.name}`}
      aria-busy={isLoading}
    >
      {!isLoading && header}

      {isLoading ? (
        <PitchSkeleton />
      ) : isEditing ? (
        <>
          <div ref={bodyRef} className="relative flex flex-col lg:flex-row gap-3 w-full">
            <div className="flex flex-col gap-3 flex-1 min-w-0">
              <RichTextEditor
                ref={editorRef}
                value={draftHtml}
                onChange={handleEditorChange}
                onClick={handleEditorClick}
                minHeight={isMobile ? '220px' : '360px'}
                lineHeight="22px"
                placeholder="Enter pitch content..."
                aria-label={`Pitch content for ${profile.name}`}
                toolbarExtras={
                  <>
                    <ToolbarDropdownButton
                      icon={<img src={aiSparkleUrl} alt="" width={18} height={18} />}
                      chevronIcon={<ExpandMoreRoundedIcon fontSize="small" />}
                      aria-label="AI actions"
                      options={[
                        { label: 'Fix all issues with agent', value: 'fix-all', onClick: fixAllWithAgent },
                        { label: 'Re-check pitch quality', value: 'recheck', onClick: recheckQuality },
                      ]}
                    />
                    <ToolbarDropdownButton
                      icon={<TranslationIcon />}
                      chevronIcon={<ExpandMoreRoundedIcon fontSize="small" />}
                      aria-label="Translate"
                      options={TRANSLATE_LANGUAGES.map((language) => ({
                        label: language,
                        value: language,
                        onClick: () => showToast(`Translation to ${language} isn't available in this prototype`),
                      }))}
                    />
                  </>
                }
                toolbarEnd={
                  <Button onClick={onShowProfileDetails} size="small" sx={{ minHeight: 0, fontSize: 12, whiteSpace: 'nowrap', textDecoration: 'underline' }}>
                    Show Profile Data
                  </Button>
                }
              />
            </div>
            {isQualityPanelOpen && (
              <QualityPanel
                analysis={draftAnalysis}
                isScoring={isScoring}
                activeIssueId={activeIssueId}
                onSelectIssue={(issue) => openIssue(issue.id)}
                onViewSources={onShowProfileDetails}
              />
            )}

            {activeIssue && (popoverPosition || isMobile) && (
              <>
                {isMobile && (
                  <div className="fixed inset-0 bg-black/40" style={{ zIndex: 60 }} onClick={() => setActiveIssueId(null)} aria-hidden="true" />
                )}
                <IssuePopover
                  key={`${activeIssue.id}-${activeIssue.resolved ? 'applied' : 'open'}`}
                  issue={activeIssue}
                  profile={profile}
                  position={Math.max(1, openIssues.findIndex((issue) => issue.id === activeIssue.id) + 1)}
                  total={openIssues.length}
                  onPrevious={() => goToIssue(-1)}
                  onNext={() => goToIssue(1)}
                  onApply={(suggestion) => applySuggestion(activeIssue, suggestion)}
                  onUndo={beforeApplyRef.current ? undoApply : undefined}
                  onOpenProfileData={onShowProfileDetails}
                  onClose={() => setActiveIssueId(null)}
                  className={isMobile ? 'fixed inset-x-0 bottom-0' : 'absolute'}
                  style={
                    isMobile
                      ? { zIndex: 61, maxHeight: '85vh', borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }
                      : activeIssue.resolved
                      // Applied: a small bar docked in the editor's corner, clear of the text
                      ? { zIndex: 30, bottom: 12, left: 12 }
                      : { zIndex: 30, top: popoverPosition?.top, left: popoverPosition?.left, width: popoverPosition?.width, maxHeight: '70vh' }
                  }
                />
              </>
            )}
          </div>

        </>
      ) : (
        <div
          className="flex flex-col gap-4 cursor-pointer"
          onClick={onEdit}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onEdit();
            }
          }}
          aria-label={`Edit pitch for ${profile.name}`}
        >
          {currentLine}
          {profile.contentHtml ? (
            <div
              className="pitch-content"
              style={{ fontFamily: font, fontSize: '16px', lineHeight: '24px', fontWeight: 500, color: '#000000' }}
              dangerouslySetInnerHTML={{ __html: profile.contentHtml }}
            />
          ) : (
            <p style={{ fontFamily: font, fontSize: '14px', color: 'rgba(0, 0, 0, 0.4)' }}>No pitch yet - click to write one.</p>
          )}
        </div>
      )}
    </article>
  );
};

export default PitchCardV2;
