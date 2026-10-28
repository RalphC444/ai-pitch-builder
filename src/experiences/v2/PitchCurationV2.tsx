import React, { useEffect, useMemo, useState } from 'react';
import { PitchCardV2 } from './PitchCardV2';
import { WorkflowHeader } from '../WorkflowHeader';
import { CampaignIcon } from '../../components/icons/CampaignIcon';
import { ToolbarIconTextButton } from '../../components/toolbar/ToolbarIconTextButton';
import { ModalButton } from '../../components/modal';
import { NavActions } from '../../components/navigation/NavActions';
import { useMediaQuery, MOBILE_QUERY } from '../../hooks/useMediaQuery';
import { RemoveAdvisorModal } from '../../components/modal/RemoveAdvisorModal';
import { ProfileDrawer, ProfileDetailsData } from '../../components/drawer';
import { useToast } from '../../components/toast';
import { getConfidenceLevel, getPitchAnalysis, PitchAnalysis, SavedAnalyses } from '../../data/pitchAnalysis';
import type { AnglePrompt } from '../../data/anglePrompts';
import type { Profile } from '../../data/profiles';
import aiSparkleUrl from '../../assets/ai.svg';

interface PitchCurationV2Props {
  profiles: Profile[];
  setProfiles: React.Dispatch<React.SetStateAction<Profile[]>>;
  prompts: Record<number, AnglePrompt>;
  savedAnalyses: SavedAnalyses;
  onAnalysisSaved: (profileId: string, html: string, analysis: PitchAnalysis) => void;
  isLoading: boolean;
  regeneratingIds: Set<string>;
  onPitchEdited: (profileId: string) => void;
  onOpenPromptSettings: () => void;
  onNext: () => void;
  /** Back to the Express List */
  onBack: () => void;
}

const font = "'Poppins', sans-serif";

const toProfileDetails = (profile: Profile): ProfileDetailsData => profile.profileDetails || {
  id: profile.id,
  name: profile.name,
  isCustomRecruit: false,
  biography: 'No biography available.',
  jobHistory: [],
  screeners: [],
};

/**
 * PitchCurationV2
 *
 * The ideal (V2) Pitch Curation step from the Unified Email Experience Figma:
 * stepper, advisor pitch cards with the in-context AI editing companion, and
 * "Next: Review & Send" into the email composer.
 */
export const PitchCurationV2: React.FC<PitchCurationV2Props> = ({
  profiles,
  setProfiles,
  prompts,
  savedAnalyses,
  onAnalysisSaved,
  isLoading,
  regeneratingIds,
  onPitchEdited,
  onOpenPromptSettings,
  onNext,
  onBack,
}) => {
  const { showToast } = useToast();
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [advisorToRemove, setAdvisorToRemove] = useState<Profile | null>(null);
  const [drawerProfileId, setDrawerProfileId] = useState<string | null>(null);
  const [pendingInjectContent, setPendingInjectContent] = useState<{ html: string; mode: 'append' | 'replace' } | null>(null);

  // Sorted by angle, then unvetted before vetted (same order as V1)
  const sortedProfiles = useMemo(() => [...profiles].sort((a, b) => {
    const angleA = a.angles[0]?.number || 999;
    const angleB = b.angles[0]?.number || 999;
    if (angleA !== angleB) return angleA - angleB;
    return (a.status === 'unvetted' ? 0 : 1) - (b.status === 'unvetted' ? 0 : 1);
  }), [profiles]);

  const analyses = useMemo(() => {
    const result: Record<string, PitchAnalysis> = {};
    sortedProfiles.forEach((profile) => {
      result[profile.id] = getPitchAnalysis(profile, prompts, savedAnalyses);
    });
    return result;
  }, [sortedProfiles, prompts, savedAnalyses]);

  // Drafts land one card at a time once loading finishes (a short stagger after the first)
  const [revealedCount, setRevealedCount] = useState(isLoading ? 0 : Number.MAX_SAFE_INTEGER);
  useEffect(() => {
    if (isLoading) {
      setRevealedCount(0);
      return undefined;
    }
    if (revealedCount >= sortedProfiles.length) return undefined;
    const timer = setTimeout(() => setRevealedCount((count) => count + 1), revealedCount === 0 ? 0 : 90);
    return () => clearTimeout(timer);
  }, [isLoading, revealedCount, sortedProfiles.length]);
  const isDrafting = isLoading || revealedCount < sortedProfiles.length;

  // Pitches whose score isn't green (same rule as the score dot) - drives the status line
  const needsLookCount = sortedProfiles.filter((profile) => {
    const analysis = analyses[profile.id];
    return analysis && getConfidenceLevel(analysis.score) !== 'high';
  }).length;
  const advisorCount = `${sortedProfiles.length} advisor${sortedProfiles.length === 1 ? '' : 's'}`;
  const pitchStatus = isDrafting
    ? `${advisorCount} · Drafting pitches…`
    : needsLookCount === 0
    ? `${advisorCount} · All pitches look good`
    : `${advisorCount} · ${needsLookCount} need${needsLookCount === 1 ? 's' : ''} a look`;

  // Leave edit mode if the pitch being edited starts regenerating
  useEffect(() => {
    if (editingProfileId && regeneratingIds.has(editingProfileId)) setEditingProfileId(null);
  }, [editingProfileId, regeneratingIds]);

  const drawerIndex = sortedProfiles.findIndex((profile) => profile.id === drawerProfileId);
  const drawerProfile = drawerIndex >= 0 ? sortedProfiles[drawerIndex] : null;

  const handleSave = (profile: Profile, html: string, analysis: PitchAnalysis) => {
    if (html !== (profile.contentHtml || '')) onPitchEdited(profile.id);
    setProfiles((previous) => previous.map((item) => (item.id === profile.id ? { ...item, contentHtml: html } : item)));
    onAnalysisSaved(profile.id, html, analysis);
    setEditingProfileId(null);
    setDrawerProfileId(null);
    showToast('Pitch Saved');
  };

  const removeAdvisor = (saveFirst: boolean) => {
    if (!advisorToRemove) return;
    if (saveFirst) {
      const existing = JSON.parse(localStorage.getItem('savedPitches') || '[]').filter((pitch: { advisorId: string }) => pitch.advisorId !== advisorToRemove.id);
      existing.push({ advisorId: advisorToRemove.id, advisorName: advisorToRemove.name, contentHtml: advisorToRemove.contentHtml || '', savedAt: new Date().toISOString() });
      localStorage.setItem('savedPitches', JSON.stringify(existing));
    }
    setProfiles((previous) => previous.filter((profile) => profile.id !== advisorToRemove.id));
    if (editingProfileId === advisorToRemove.id) setEditingProfileId(null);
    setAdvisorToRemove(null);
    showToast('Advisor Was Removed');
  };

  return (
    <main className="content-wrapper flex flex-col gap-6 pt-6 sm:pt-[34px] pb-12">
      <WorkflowHeader
        activeStep={0}
        title="Review these AI drafts"
        subtitle="Fix anything flagged, then continue to the email."
        onBack={onBack}
        backLabel="Back to Express List"
      />

      <section className="bg-white flex flex-col gap-4 p-3 sm:p-6" style={{ borderRadius: '15px' }} aria-label="Advisor pitches">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-1" style={{ fontFamily: font, fontSize: '16.7px', lineHeight: '22px', fontWeight: 600, color: '#000000' }}>
            <CampaignIcon style={{ color: '#000000' }} />
            {pitchStatus}
          </h2>
          <div className="bg-white rounded-3xl p-1 shrink-0" style={{ filter: 'drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.08))' }}>
            <ToolbarIconTextButton
              icon={<img src={aiSparkleUrl} alt="" width={20} height={20} />}
              label="Edit Prompt"
              onClick={onOpenPromptSettings}
              aria-label="Edit prompt"
              className="whitespace-nowrap"
            />
          </div>
        </div>

        {sortedProfiles.map((profile, index) => (
          <PitchCardV2
            key={profile.id}
            profile={profile}
            analysis={analyses[profile.id]}
            anglePrompt={prompts[profile.angles[0]?.number]}
            isEditing={editingProfileId === profile.id}
            isLoading={isLoading || index >= revealedCount || regeneratingIds.has(profile.id)}
            onEdit={() => setEditingProfileId(profile.id)}
            onDelete={() => setAdvisorToRemove(profile)}
            onSave={(html, analysis) => handleSave(profile, html, analysis)}
            onDiscard={() => {
              setEditingProfileId(null);
              setDrawerProfileId(null);
              showToast('Changes Discarded');
            }}
            onShowProfileDetails={() => setDrawerProfileId(drawerProfileId === profile.id ? null : profile.id)}
            injectContent={editingProfileId === profile.id ? pendingInjectContent : null}
            onInjectComplete={() => setPendingInjectContent(null)}
          />
        ))}
      </section>

      <NavActions>
        <ModalButton label={isMobile ? 'Next' : 'Next: Review & Send'} primary onClick={onNext} />
      </NavActions>

      <ProfileDrawer
        isOpen={!!drawerProfile}
        onClose={() => setDrawerProfileId(null)}
        profile={drawerProfile ? toProfileDetails(drawerProfile) : null}
        onNavigatePrevious={() => drawerIndex > 0 && setDrawerProfileId(sortedProfiles[drawerIndex - 1].id)}
        onNavigateNext={() => drawerIndex < sortedProfiles.length - 1 && setDrawerProfileId(sortedProfiles[drawerIndex + 1].id)}
        hasPrevious={drawerIndex > 0}
        hasNext={drawerIndex < sortedProfiles.length - 1}
        onInjectContent={(html) => {
          if (!editingProfileId) {
            showToast('Edit a pitch to add content to it');
            return;
          }
          setPendingInjectContent({ html, mode: 'append' });
          showToast('Content Added to Pitch');
        }}
        onReplaceContent={(html) => {
          if (!editingProfileId) {
            showToast('Edit a pitch to change it');
            return;
          }
          setPendingInjectContent({ html, mode: 'replace' });
          showToast('Pitch Bullets Replaced');
        }}
        anglePrompt={drawerProfile ? prompts[drawerProfile.angles[0]?.number] : undefined}
        forceOverlay
      />

      <RemoveAdvisorModal
        isOpen={!!advisorToRemove}
        advisorName={advisorToRemove?.name}
        onClose={() => setAdvisorToRemove(null)}
        onRemoveOnly={() => removeAdvisor(false)}
        onSaveAndRemove={() => removeAdvisor(true)}
      />
    </main>
  );
};

export default PitchCurationV2;
