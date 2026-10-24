import React, { useState, useMemo, useEffect } from 'react';
import { ProfileCard } from '../../components/profile/ProfileCard';
import { PageHeader } from '../../components/header/PageHeader';
import { RemoveAdvisorModal } from '../../components/modal/RemoveAdvisorModal';
import { ProfileDrawer, ProfileDetailsData } from '../../components/drawer';
import { useToast } from '../../components/toast';
import { useMediaQuery, COMPACT_QUERY } from '../../hooks/useMediaQuery';
import type { Profile } from '../../data/profiles';

interface PitchBuilderV1Props {
  /** Profiles shared with the other experiences */
  profiles: Profile[];
  setProfiles: React.Dispatch<React.SetStateAction<Profile[]>>;
  /** Initial app loading state */
  isLoading: boolean;
  /** Profiles whose pitches are being regenerated from an angle prompt */
  regeneratingIds: Set<string>;
  /** Called when a pitch is changed by hand (so regeneration can ask before overwriting) */
  onPitchEdited: (profileId: string) => void;
  /** Continue to the email composer */
  onComposeEmail: () => void;
}

/**
 * PitchBuilderV1
 *
 * The original pitch curation experience, kept as "V1" behind the navigation kebab menu.
 */
export const PitchBuilderV1: React.FC<PitchBuilderV1Props> = ({
  profiles,
  setProfiles,
  isLoading,
  regeneratingIds,
  onPitchEdited,
  onComposeEmail,
}) => {
  
  // Edit state - track which profile is being edited
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAdvisor, setSelectedAdvisor] = useState<{ id: string; name: string } | null>(null);

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedProfileDetails, setSelectedProfileDetails] = useState<ProfileDetailsData | null>(null);
  const [selectedProfileIndex, setSelectedProfileIndex] = useState<number>(0);
  
  // Content to inject into the active editor
  const [pendingInjectContent, setPendingInjectContent] = useState<string | null>(null);

  // On phones/tablets the drawer is an overlay sheet, so the page keeps its normal layout
  const isCompact = useMediaQuery(COMPACT_QUERY);
  const isDrawerInline = isDrawerOpen && !isCompact;

  // Lock page scroll while the overlay drawer is open
  useEffect(() => {
    if (!isDrawerOpen || !isCompact) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isDrawerOpen, isCompact]);

  // Close drawer when no pitch is in edit mode
  useEffect(() => {
    if (editingProfileId === null) {
      setIsDrawerOpen(false);
      setSelectedProfileDetails(null);
    }
  }, [editingProfileId]);

  // Toast hook
  const { showToast } = useToast();

  // Sorted profiles - sorted by angle number, then by status (unvetted before vetted)
  const sortedProfiles = useMemo(() => {
    return [...profiles].sort((a, b) => {
      // Get the first angle number for each profile
      const angleA = a.angles[0]?.number || 999;
      const angleB = b.angles[0]?.number || 999;
      
      // First sort by angle number
      if (angleA !== angleB) {
        return angleA - angleB;
      }
      
      // Then sort by status: unvetted (0) comes before vetted (1)
      const statusA = a.status === 'unvetted' ? 0 : 1;
      const statusB = b.status === 'unvetted' ? 0 : 1;
      return statusA - statusB;
    });
  }, [profiles]);

  // Save pitch content to local storage
  const savePitchToLocalStorage = (advisorId: string, advisorName: string, contentHtml: string) => {
    const savedPitch = {
      advisorId,
      advisorName,
      contentHtml: contentHtml, // Save HTML from Quill editor
      savedAt: new Date().toISOString(),
    };
    
    // Get existing saved pitches or initialize empty array
    const existingPitches = JSON.parse(localStorage.getItem('savedPitches') || '[]');
    
    // Check if pitch for this advisor already exists
    const existingIndex = existingPitches.findIndex((p: any) => p.advisorId === advisorId);
    
    if (existingIndex >= 0) {
      // Update existing pitch
      existingPitches[existingIndex] = savedPitch;
    } else {
      // Add new pitch
      existingPitches.push(savedPitch);
    }
    
    // Save back to local storage
    localStorage.setItem('savedPitches', JSON.stringify(existingPitches));
    console.log('Pitch saved to local storage:', savedPitch);
  };

  // Remove advisor from profiles
  const removeAdvisor = (advisorId: string) => {
    setProfiles((prevProfiles) => prevProfiles.filter((profile) => profile.id !== advisorId));
  };

  // Handle "Remove Only" action
  const handleRemoveOnly = () => {
    if (selectedAdvisor) {
      removeAdvisor(selectedAdvisor.id);
      setIsModalOpen(false);
      setSelectedAdvisor(null);
      showToast('Advisor Was Removed');
    }
  };

  // Handle "Save & Remove" action
  const handleSaveAndRemove = () => {
    if (selectedAdvisor) {
      const advisor = profiles.find((p) => p.id === selectedAdvisor.id);
      if (advisor) {
        // Use contentHtml (from Quill editor) instead of content
        const contentToSave = advisor.contentHtml || '';
        savePitchToLocalStorage(advisor.id, advisor.name, contentToSave);
        removeAdvisor(advisor.id);
      }
      setIsModalOpen(false);
      setSelectedAdvisor(null);
      showToast('Advisor Was Removed');
    }
  };

  // Handle edit button click
  const handleEdit = (profileId: string) => {
    setEditingProfileId(profileId);
  };

  // Handle save button click
  const handleSave = (profileId: string, content: string | null) => {
    if (content !== profiles.find((profile) => profile.id === profileId)?.contentHtml) {
      onPitchEdited(profileId);
    }
    setProfiles((prevProfiles) =>
      prevProfiles.map((profile) =>
        profile.id === profileId
          ? { ...profile, contentHtml: content }
          : profile
      )
    );
    setEditingProfileId(null);
    showToast('Pitch Saved');
  };

  // Handle discard button click (edit mode)
  const handleDiscard = (profileId: string) => {
    setEditingProfileId(null);
    showToast('Changes Discarded');
  };

  // Handle clear button click (edit mode)
  const handleClear = (profileId: string) => {
    onPitchEdited(profileId);
    setProfiles((prevProfiles) =>
      prevProfiles.map((profile) =>
        profile.id === profileId
          ? { ...profile, contentHtml: '' }
          : profile
      )
    );
    showToast('Content Cleared');
  };

  // Handle inject content from drawer into active editor
  const handleInjectContent = (htmlContent: string) => {
    if (editingProfileId) {
      // Set pending inject content - ProfileCard will handle appending to its editor
      setPendingInjectContent(htmlContent);
      showToast('Content Added to Pitch');
    }
  };

  // Clear pending inject content after it's been processed
  const handleInjectComplete = () => {
    setPendingInjectContent(null);
  };

  // Handle open profile details button click (edit mode) - toggles drawer
  const handleOpenProfileDetails = (profileId: string) => {
    // If drawer is open and showing the same profile, close it
    if (isDrawerOpen && selectedProfileDetails?.id === profileId) {
      setIsDrawerOpen(false);
      setSelectedProfileDetails(null);
      return;
    }
    
    const profileIndex = sortedProfiles.findIndex(p => p.id === profileId);
    const profile = sortedProfiles[profileIndex];
    
    if (profile) {
      // Use profile details if available, otherwise create basic details from profile info
      const profileDetails: ProfileDetailsData = profile.profileDetails || {
        id: profile.id,
        name: profile.name,
        isCustomRecruit: false,
        biography: 'No biography available.',
        jobHistory: [],
        screeners: [],
      };
      
      setSelectedProfileDetails(profileDetails);
      setSelectedProfileIndex(profileIndex);
      setIsDrawerOpen(true);
    }
  };

  // Navigate to previous profile in drawer
  const handleDrawerNavigatePrevious = () => {
    if (selectedProfileIndex > 0) {
      const newIndex = selectedProfileIndex - 1;
      const profile = sortedProfiles[newIndex];
      const profileDetails: ProfileDetailsData = profile.profileDetails || {
        id: profile.id,
        name: profile.name,
        isCustomRecruit: false,
        biography: 'No biography available.',
        jobHistory: [],
        screeners: [],
      };
      setSelectedProfileDetails(profileDetails);
      setSelectedProfileIndex(newIndex);
    }
  };

  // Navigate to next profile in drawer
  const handleDrawerNavigateNext = () => {
    if (selectedProfileIndex < sortedProfiles.length - 1) {
      const newIndex = selectedProfileIndex + 1;
      const profile = sortedProfiles[newIndex];
      const profileDetails: ProfileDetailsData = profile.profileDetails || {
        id: profile.id,
        name: profile.name,
        isCustomRecruit: false,
        biography: 'No biography available.',
        jobHistory: [],
        screeners: [],
      };
      setSelectedProfileDetails(profileDetails);
      setSelectedProfileIndex(newIndex);
    }
  };

  // Close drawer
  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    setSelectedProfileDetails(null);
  };
  return (
    <div 
      className="App min-h-screen bg-cool-grey-100"
      style={{
        overflow: 'visible', // Allow tooltips to overflow
        position: 'relative', // Establish positioning context
      }}
    >
      {/* Sticky Page Header */}
      <PageHeader
        title="Curate Advisor Pitches"
        isDrawerOpen={isDrawerInline}
        toolbarButtons={[
          {
            label: 'Save Pitches',
            onClick: () => console.log('Save Pitches'),
          },
          {
            label: 'Save & Compose Email',
            onClick: onComposeEmail,
            primary: true, // This is the primary blue button
          },
        ]}
      />

      {/* Main Content - Responsive widths, or full width when drawer is open */}
      <main 
        className={isDrawerInline ? 'content-area-full' : 'mx-auto content-area-1992'}
        style={{
          paddingTop: '24px', // Space below sticky header
          paddingBottom: '24px',
          overflow: 'visible', // Allow tooltips to overflow
          position: 'relative', // Establish positioning context
        }}
      >
        {/* Content wrapper */}
        <div 
          className={isDrawerInline ? '' : 'content-wrapper'}
          style={{
            overflow: 'visible', // Allow tooltips to overflow
            position: 'relative', // Establish positioning context
          }}
        >
          {/* Profile Cards Container - White background with drawer inside */}
          <div 
            className={`bg-white rounded-2xl ${isDrawerInline ? 'flex flex-row gap-6 pl-6 pb-6' : 'p-3 sm:p-6 flex flex-col gap-4'}`}
            style={{
              overflow: 'visible', // Allow tooltips to overflow
              position: 'relative', // Establish positioning context
            }}
          >
            {/* Profile Cards List */}
            <div 
              className={`flex flex-col gap-3 sm:gap-4 ${isDrawerInline ? 'flex-1 pt-6' : ''}`}
              style={{
                ...(isDrawerInline ? { minWidth: 0 } : {}), // Allow flex shrink when drawer open
              }}
            >
              {sortedProfiles.map((profile) => (
                <ProfileCard
                  key={profile.id}
                  name={profile.name}
                  angles={profile.angles}
                  status={profile.status}
                  content={profile.content}
                  contentHtml={profile.contentHtml}
                  isEditing={editingProfileId === profile.id}
                  isDimmed={editingProfileId !== null && editingProfileId !== profile.id}
                  isContentLoading={isLoading || regeneratingIds.has(profile.id)}
                  onEdit={() => handleEdit(profile.id)}
                  onSave={(content) => handleSave(profile.id, content)}
                  onDelete={() => {
                    setSelectedAdvisor({ id: profile.id, name: profile.name });
                    setIsModalOpen(true);
                  }}
                  onDiscard={() => handleDiscard(profile.id)}
                  onClear={() => handleClear(profile.id)}
                  onOpenProfileDetails={() => handleOpenProfileDetails(profile.id)}
                  injectContent={editingProfileId === profile.id ? pendingInjectContent : null}
                  onInjectComplete={handleInjectComplete}
                  profileDetails={profile.profileDetails ? {
                    biography: profile.profileDetails.biography,
                    jobHistory: profile.profileDetails.jobHistory,
                    screeners: profile.profileDetails.screeners,
                    pastScreeners: profile.profileDetails.pastScreeners,
                  } : undefined}
                />
              ))}
            </div>

            {/* Inline Profile Details Drawer - Sticky on scroll */}
            <ProfileDrawer
              isOpen={isDrawerOpen}
              onClose={handleDrawerClose}
              profile={selectedProfileDetails}
              onNavigatePrevious={handleDrawerNavigatePrevious}
              onNavigateNext={handleDrawerNavigateNext}
              hasPrevious={selectedProfileIndex > 0}
              hasNext={selectedProfileIndex < sortedProfiles.length - 1}
              onInjectContent={handleInjectContent}
            />
          </div>
        </div>
      </main>

      {/* Remove Advisor Modal */}
      <RemoveAdvisorModal
        isOpen={isModalOpen}
        advisorName={selectedAdvisor?.name}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedAdvisor(null);
        }}
        onRemoveOnly={handleRemoveOnly}
        onSaveAndRemove={handleSaveAndRemove}
      />
    </div>
  );
};

export default PitchBuilderV1;

