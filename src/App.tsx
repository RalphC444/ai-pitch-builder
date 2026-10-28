import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ListAltRoundedIcon from '@mui/icons-material/ListAltRounded';
import './App.css';
import { Navigation } from './components/navigation/Navigation';
import { TranslationIcon } from './components/icons/TranslationIcon';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import { Modal, ModalActions } from './components/modal';
import { PromptDrawer, PromptDrawerAngle } from './components/prompt/PromptDrawer';
import { KebabMenu } from './components/menu/KebabMenu';
import { useToast } from './components/toast';
import { PitchBuilderV1 } from './experiences/v1/PitchBuilderV1';
import { PitchCurationV2 } from './experiences/v2/PitchCurationV2';
import { EmailComposer, DEFAULT_EMAIL_DRAFT, SentEmail } from './experiences/composer/EmailComposer';
import { SendConfirmation } from './experiences/composer/SendConfirmation';
import { ExpressList } from './experiences/express/ExpressList';
import { ExpressActions } from './experiences/express/ExpressActions';
import { AGENTIC_PM_GREETING, ChatMessage } from './experiences/express/AgenticPM';
import { MOBILE_QUERY } from './hooks/useMediaQuery';
import { AdvisorFilter, createExpressRoster, ExpressAdvisor } from './data/expressList';
import { createInitialProfiles, Profile } from './data/profiles';
import { AnglePrompt, buildFallbackPitch, bulletsToHtml, DEFAULT_ANGLE_PROMPTS, generatePitchHtml, PromptAdvisor } from './data/anglePrompts';
import type { PitchAnalysis, SavedAnalyses } from './data/pitchAnalysis';
import type { AutonomyLevel, EmailDraft } from './data/agentReview';

type ExperienceVersion = 'v1' | 'v2';
type WorkflowStep = 'express' | 'curate' | 'compose' | 'sent';

interface PendingRegeneration {
  angleNumber: number;
  prompt: AnglePrompt;
  editedIds: string[];
  allIds: string[];
}

const readStorage = <T,>(key: string, fallback: T): T => {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : (JSON.parse(value) as T);
  } catch {
    return fallback;
  }
};

const writeStorage = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be unavailable (private mode) - preferences just won't persist
  }
};

const TRANSLATE_LANGUAGES = ['Spanish', 'French', 'German', 'Japanese', 'Mandarin'];

function App() {
  const { showToast } = useToast();

  const [version, setVersion] = useState<ExperienceVersion>(() => readStorage<ExperienceVersion>('experienceVersion', 'v2'));
  const [step, setStep] = useState<WorkflowStep>('express');
  const [isLoading, setIsLoading] = useState(false);
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Shared data across V1, V2 and the composer
  const [profiles, setProfiles] = useState<Profile[]>(createInitialProfiles);
  const [prompts, setPrompts] = useState<Record<number, AnglePrompt>>(DEFAULT_ANGLE_PROMPTS);
  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalyses>({});
  const [editedIds, setEditedIds] = useState<Set<string>>(new Set());
  const [regeneratingIds, setRegeneratingIds] = useState<Set<string>>(new Set());

  // Edit Prompt flow
  const [isPromptDrawerOpen, setIsPromptDrawerOpen] = useState(false);
  const [pendingRegeneration, setPendingRegeneration] = useState<PendingRegeneration | null>(null);

  // Express List (before the pitch workflow)
  const [roster, setRoster] = useState<ExpressAdvisor[]>(createExpressRoster);
  const [selectedAdvisorIds, setSelectedAdvisorIds] = useState<Set<string>>(() => new Set(createInitialProfiles().map((profile) => profile.id)));
  const [appliedFilters, setAppliedFilters] = useState<AdvisorFilter[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([AGENTIC_PM_GREETING]);
  const [isChatOpen, setIsChatOpen] = useState(() => !window.matchMedia(MOBILE_QUERY).matches);

  // Email
  const [emailDraft, setEmailDraft] = useState<EmailDraft>(DEFAULT_EMAIL_DRAFT);
  const [autonomy, setAutonomy] = useState<AutonomyLevel>(() => readStorage<AutonomyLevel>('agentAutonomy', 25));
  const [sentEmail, setSentEmail] = useState<SentEmail | null>(null);

  // Pitch drafting loader: runs each time advisors arrive in Pitch Curation
  const startPitchLoading = () => {
    if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
    setIsLoading(true);
    loadingTimerRef.current = setTimeout(() => setIsLoading(false), 500);
  };
  useEffect(() => () => {
    if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step, version]);

  const switchVersion = (next: ExperienceVersion) => {
    setVersion(next);
    writeStorage('experienceVersion', next);
    setStep((current) => (current === 'express' ? 'express' : 'curate'));
    showToast(next === 'v2' ? 'Switched to the ideal experience' : 'Switched to V1 (original pitch builder)');
  };

  const changeAutonomy = (level: AutonomyLevel) => {
    setAutonomy(level);
    writeStorage('agentAutonomy', level);
  };

  const markEdited = useCallback((profileId: string) => {
    setEditedIds((previous) => new Set(previous).add(profileId));
  }, []);

  const handleAnalysisSaved = useCallback((profileId: string, html: string, analysis: PitchAnalysis) => {
    setSavedAnalyses((previous) => ({ ...previous, [profileId]: { html, analysis } }));
  }, []);

  // Angles of the project, with advisor counts, for the prompt drawer
  const promptAngles = useMemo<PromptDrawerAngle[]>(() => {
    const angles = new Map<number, PromptDrawerAngle>();
    Object.values(prompts).forEach((prompt) => angles.set(prompt.angleNumber, { number: prompt.angleNumber, label: prompt.angleLabel, advisorCount: 0 }));
    profiles.forEach((profile) => {
      const angle = profile.angles[0];
      if (!angle) return;
      const entry = angles.get(angle.number) || { number: angle.number, label: angle.label, advisorCount: 0 };
      angles.set(angle.number, { ...entry, advisorCount: entry.advisorCount + 1 });
    });
    return Array.from(angles.values()).sort((a, b) => a.number - b.number);
  }, [profiles, prompts]);

  const previewAdvisors = useMemo(() => {
    const result: Record<number, PromptAdvisor | undefined> = {};
    profiles.forEach((profile) => {
      const number = profile.angles[0]?.number;
      if (number !== undefined && !result[number]) result[number] = { name: profile.name, details: profile.profileDetails };
    });
    return result;
  }, [profiles]);

  const regenerate = async (prompt: AnglePrompt, ids: string[]) => {
    if (ids.length === 0) {
      showToast('Prompt Saved');
      return;
    }
    setRegeneratingIds((previous) => new Set([...Array.from(previous), ...ids]));
    const targets = profiles.filter((profile) => ids.includes(profile.id));

    const results = await Promise.all(targets.map(async (profile) => {
      const { html, usedFallback } = await generatePitchHtml(prompt, { name: profile.name, details: profile.profileDetails });
      setProfiles((previous) => previous.map((item) => (item.id === profile.id ? { ...item, contentHtml: html } : item)));
      setRegeneratingIds((previous) => {
        const next = new Set(previous);
        next.delete(profile.id);
        return next;
      });
      return usedFallback;
    }));

    setEditedIds((previous) => new Set(Array.from(previous).filter((id) => !ids.includes(id))));
    const usedFallback = results.some(Boolean);
    showToast(`Regenerated ${ids.length} pitch${ids.length === 1 ? '' : 'es'}${usedFallback ? ' (offline draft)' : ''}`);
  };

  const handleSaveAndRegenerate = (angleNumber: number, prompt: AnglePrompt) => {
    setPrompts((previous) => ({ ...previous, [angleNumber]: prompt }));
    setIsPromptDrawerOpen(false);
    const allIds = profiles.filter((profile) => profile.angles[0]?.number === angleNumber).map((profile) => profile.id);
    const edited = allIds.filter((id) => editedIds.has(id));
    if (edited.length > 0) {
      setPendingRegeneration({ angleNumber, prompt, editedIds: edited, allIds });
    } else {
      regenerate(prompt, allIds);
    }
  };

  /**
   * Express List -> Pitch Curation: keep pitches already written, and give newly
   * selected advisors a starter pitch built from their profile and angle prompt
   */
  const sendToPitchCuration = (advisors: ExpressAdvisor[]) => {
    const nextProfiles = advisors.map((advisor) => {
      const existing = profiles.find((profile) => profile.id === advisor.id);
      const base: Profile = { ...(existing || advisor.profile), angles: advisor.profile.angles };
      if (base.contentHtml) return base;
      const prompt = prompts[base.angles[0]?.number] || DEFAULT_ANGLE_PROMPTS[1];
      return { ...base, contentHtml: bulletsToHtml(buildFallbackPitch(prompt, { name: base.name, details: base.profileDetails })) };
    });
    setProfiles(nextProfiles);
    startPitchLoading();
    setStep('curate');
    showToast(`Drafting pitches for ${advisors.length} advisor${advisors.length === 1 ? '' : 's'}`);
  };

  const goToCompose = () => {
    setSentEmail(null);
    setStep('compose');
  };

  const isV2 = version === 'v2';

  return (
    <div
      className="App min-h-screen bg-cool-grey-100"
      style={{
        overflow: 'visible', // Allow tooltips to overflow
        position: 'relative', // Establish positioning context
      }}
    >
      <Navigation
        requestNumber="#1085069"
        breadcrumbs={
          step === 'express'
            ? [{ label: 'Express List', icon: <ListAltRoundedIcon fontSize="small" /> }]
            : isV2 || step !== 'curate'
            ? [{ label: 'AI Pitch Builder' }]
            : undefined
        }
        versionBadge={isV2 || step === 'express' ? undefined : 'V1'}
        actions={step === 'express' ? (
          <ExpressActions
            roster={roster}
            setRoster={setRoster}
            selectedIds={selectedAdvisorIds}
            prompts={prompts}
            onAddAdvisors={() => showToast('Adding advisors opens advisor search')}
            onSend={sendToPitchCuration}
          />
        ) : undefined}
        translationDropdown={
          !isV2 && step === 'curate'
            ? {
              icon: <TranslationIcon />,
              chevronIcon: <ExpandMoreRoundedIcon fontSize="small" />,
              options: TRANSLATE_LANGUAGES.map((language) => ({
                label: language,
                value: language,
                onClick: () => showToast(`Translation to ${language} isn't available in this prototype`),
              })),
              'aria-label': 'Translation options',
            }
            : undefined
        }
        onClose={step === 'express' ? undefined : () => setStep('express')}
      />

      {/* Experience switcher - floating bottom right */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6" style={{ zIndex: 55 }}>
        <KebabMenu
          floating
          placement="top"
          heading="Experience"
          aria-label="Experience options"
          items={[
            {
              label: 'Ideal experience',
              badge: 'V2',
              description: 'Stepper workflow, in-context AI companion and review agent',
              checked: isV2,
              onClick: () => !isV2 && switchVersion('v2'),
            },
            {
              label: 'Original pitch builder',
              badge: 'V1',
              description: 'Earlier version kept for reference - superseded by V2',
              checked: !isV2,
              onClick: () => isV2 && switchVersion('v1'),
            },
          ]}
        />
      </div>

      {step === 'express' && (
        <ExpressList
          roster={roster}
          selectedIds={selectedAdvisorIds}
          setSelectedIds={setSelectedAdvisorIds}
          appliedFilters={appliedFilters}
          setAppliedFilters={setAppliedFilters}
          chatMessages={chatMessages}
          setChatMessages={setChatMessages}
          isChatOpen={isChatOpen}
          setIsChatOpen={setIsChatOpen}
        />
      )}

      {step === 'curate' && (isV2 ? (
        <PitchCurationV2
          profiles={profiles}
          setProfiles={setProfiles}
          prompts={prompts}
          savedAnalyses={savedAnalyses}
          onAnalysisSaved={handleAnalysisSaved}
          isLoading={isLoading}
          regeneratingIds={regeneratingIds}
          onPitchEdited={markEdited}
          onOpenPromptSettings={() => setIsPromptDrawerOpen(true)}
          onNext={goToCompose}
          onBack={() => setStep('express')}
        />
      ) : (
        <PitchBuilderV1
          profiles={profiles}
          setProfiles={setProfiles}
          isLoading={isLoading}
          regeneratingIds={regeneratingIds}
          onPitchEdited={markEdited}
          onComposeEmail={goToCompose}
        />
      ))}

      {step === 'compose' && (
        <EmailComposer
          draft={emailDraft}
          setDraft={setEmailDraft}
          profiles={profiles}
          setProfiles={setProfiles}
          prompts={prompts}
          savedAnalyses={savedAnalyses}
          setSavedAnalyses={setSavedAnalyses}
          autonomy={autonomy}
          onAutonomyChange={changeAutonomy}
          onBack={() => setStep('curate')}
          onSent={(email) => {
            setSentEmail(email);
            setStep('sent');
          }}
        />
      )}

      {step === 'sent' && sentEmail && (
        <SendConfirmation
          email={sentEmail}
          profiles={profiles}
          onBackToCompose={goToCompose}
          onStartOver={() => setStep('express')}
        />
      )}

      <PromptDrawer
        isOpen={isPromptDrawerOpen}
        onClose={() => setIsPromptDrawerOpen(false)}
        angles={promptAngles}
        prompts={prompts}
        previewAdvisors={previewAdvisors}
        onSaveAndRegenerate={handleSaveAndRegenerate}
      />

      <Modal
        isOpen={!!pendingRegeneration}
        onClose={() => setPendingRegeneration(null)}
        title="Replace edited pitches?"
      >
        <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: '14px', lineHeight: '20px', fontWeight: 500, color: 'rgba(0, 0, 0, 0.8)' }}>
          {pendingRegeneration?.editedIds.length} of {pendingRegeneration?.allIds.length} pitches in {pendingRegeneration?.prompt.angleLabel} were edited by hand.
          Regenerating will replace those edits with the new prompt's output.
        </p>
        <div style={{ paddingTop: '24px', width: '100%' }}>
          <ModalActions
            actions={[
              {
                label: 'Keep My Edits',
                onClick: () => {
                  if (!pendingRegeneration) return;
                  regenerate(pendingRegeneration.prompt, pendingRegeneration.allIds.filter((id) => !pendingRegeneration.editedIds.includes(id)));
                  setPendingRegeneration(null);
                },
              },
              {
                label: 'Regenerate All',
                primary: true,
                onClick: () => {
                  if (!pendingRegeneration) return;
                  regenerate(pendingRegeneration.prompt, pendingRegeneration.allIds);
                  setPendingRegeneration(null);
                },
              },
            ]}
          />
        </div>
      </Modal>
    </div>
  );
}

export default App;
