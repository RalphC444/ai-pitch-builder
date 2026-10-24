import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import ReactDOM from 'react-dom';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { TextStyles } from '../design-system/typography/TextStyles';
import { AngleBadge } from '../badges/AngleBadge';
import { VettedBadge } from '../badges/VettedBadge';
import { UnvettedBadge } from '../badges/UnvettedBadge';
import { EditIcon } from '../icons/EditIcon';
import { DeleteIcon } from '../icons/DeleteIcon';
import { SaveIcon } from '../icons/SaveIcon';
import { DiscardIcon } from '../icons/DiscardIcon';
import { EraseIcon } from '../icons/EraseIcon';
import { OpenProfileDetailsIcon } from '../icons/OpenProfileDetailsIcon';
import { QuillEditor } from '../editor/QuillEditor';
import type { QuillEditorRef, RewriteEventData, SourcesEventData, EditorBounds } from '../editor/QuillEditor';
import { Loader } from '../loader';
import { AIRewriteWidget, AISourcesWidget, SourceItem } from '../ai';
import type { SourceResponse, AIRewriteSuggestion } from '../ai';
import { generateRewriteSuggestions, selectRelevantSources } from '../../services/aiService';

// Link Tooltip Component (rendered via portal)
const LinkTooltip: React.FC<{ url: string; position: { top: number; left: number } }> = ({ url, position }) => {
  return ReactDOM.createPortal(
    <div
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        transform: 'translateX(-50%)',
        backgroundColor: '#333333',
        color: '#ffffff',
        padding: '8px 12px',
        borderRadius: '8px',
        fontSize: '14px',
        fontFamily: "'Poppins', sans-serif",
        fontWeight: 400,
        lineHeight: '20px',
        maxWidth: '300px',
        wordBreak: 'break-all',
        zIndex: 99999,
        pointerEvents: 'none',
        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
      }}
    >
      {url}
    </div>,
    document.body
  );
};

export type VettedStatus = 'vetted' | 'unvetted';

export interface Angle {
  number: number; // Assigned number for the angle (1, 2, 3, etc.)
  label: string;
}

export interface ProfileCardProps {
  /**
   * Advisor name
   */
  name: string;
  /**
   * List of angle badges to display
   */
  angles?: Angle[];
  /**
   * Vetted status
   */
  status: VettedStatus;
  /**
   * Content/pitch text to display (HTML string or React node)
   */
  content?: string | React.ReactNode;
  /**
   * HTML content string for editor (takes precedence over content in edit mode)
   */
  contentHtml?: string | null;
  /**
   * Whether this card is in edit mode
   */
  isEditing?: boolean;
  /**
   * Whether this card should be dimmed (when another card is editing)
   */
  isDimmed?: boolean;
  /**
   * Callback when edit button is clicked
   */
  onEdit?: () => void;
  /**
   * Callback when save button is clicked
   */
  onSave?: (content: string | null) => void;
  /**
   * Callback when delete button is clicked
   */
  onDelete?: () => void;
  /**
   * Callback when discard button is clicked (edit mode)
   */
  onDiscard?: () => void;
  /**
   * Callback when clear button is clicked (edit mode)
   */
  onClear?: () => void;
  /**
   * Callback when open profile details button is clicked (edit mode)
   */
  onOpenProfileDetails?: () => void;
  /**
   * Content to inject into the editor (will be appended)
   */
  injectContent?: string | null;
  /**
   * Callback after content is injected (to clear the inject content)
   */
  onInjectComplete?: () => void;
  /**
   * Whether the content is loading (shows skeleton loader)
   */
  isContentLoading?: boolean;
  /**
   * Profile details for AI rewrite sources (bio, job history, screeners)
   */
  profileDetails?: {
    biography?: string;
    jobHistory?: Array<{
      id: string;
      companyName: string;
      role: string;
      dateRange: string;
    }>;
    screeners?: Array<{
      id: string;
      question: string;
      answer?: string;
      responseDate?: string;
      isKeyQuestion?: boolean;
    }>;
    pastScreeners?: Array<{
      id: string;
      question: string;
      answer?: string;
      responseDate?: string;
      isKeyQuestion?: boolean;
    }>;
  };
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * ProfileCard Component (View Mode)
 * 
 * Displays advisor profile information in a card format.
 * Shows name, angle badges, vetted status, and content.
 * Includes edit and delete actions.
 * 
 * @example
 * <ProfileCard
 *   name="Colin Anderson"
 *   angles={[
 *     { icon: <NumericIcon number={1} />, label: "Formers: Detroit Pistons" }
 *   ]}
 *   status="unvetted"
 *   content="Advisor pitch content here..."
 *   onEdit={() => console.log('Edit')}
 *   onDelete={() => console.log('Delete')}
 * />
 */
export const ProfileCard: React.FC<ProfileCardProps> = ({
  name,
  angles = [],
  status,
  content,
  contentHtml,
  isEditing = false,
  isDimmed = false,
  onEdit,
  onSave,
  onDelete,
  onDiscard,
  onClear,
  onOpenProfileDetails,
  injectContent,
  onInjectComplete,
  isContentLoading = false,
  profileDetails,
  className = '',
}) => {
  const [editorContent, setEditorContent] = useState<string>('');
  // Store original content to restore on discard - use ref to persist across renders
  const originalContentRef = useRef<string>('');
  const isInitializedRef = useRef<boolean>(false);
  
  // Ref for view mode content to attach link tooltips
  const viewContentRef = useRef<HTMLDivElement>(null);
  
  // Ref for Quill editor to replace text
  const editorRef = useRef<QuillEditorRef>(null);
  
  // Tooltip state for links in view mode
  const [linkTooltip, setLinkTooltip] = useState<{ url: string; position: { top: number; left: number } } | null>(null);

  // AI Rewrite Widget state
  const [isRewriteWidgetOpen, setIsRewriteWidgetOpen] = useState(false);
  const [rewriteSuggestions, setRewriteSuggestions] = useState<AIRewriteSuggestion[]>([]);
  const [isRewriteLoading, setIsRewriteLoading] = useState(false);
  const [rewriteError, setRewriteError] = useState<string | undefined>();
  const [rewriteSelectionRange, setRewriteSelectionRange] = useState<{ index: number; length: number } | null>(null);
  const [rewriteEditorBounds, setRewriteEditorBounds] = useState<EditorBounds | undefined>();

  // AI Sources Widget state
  const [isSourcesWidgetOpen, setIsSourcesWidgetOpen] = useState(false);
  const [sourcesEditorBounds, setSourcesEditorBounds] = useState<EditorBounds | undefined>();
  const [selectedTextForSources, setSelectedTextForSources] = useState<string>('');

  // Attach tooltip event listeners to links in view mode
  useEffect(() => {
    if (!isEditing && viewContentRef.current) {
      const links = viewContentRef.current.querySelectorAll('a');
      
      const handleMouseEnter = (e: MouseEvent) => {
        const link = e.target as HTMLAnchorElement;
        const rect = link.getBoundingClientRect();
        const url = link.href || link.getAttribute('href') || '';
        
        if (url) {
          setLinkTooltip({
            url,
            position: {
              top: rect.bottom + 8,
              left: rect.left + rect.width / 2,
            },
          });
        }
      };
      
      const handleMouseLeave = () => {
        setLinkTooltip(null);
      };
      
      // Prevent link navigation in view mode, just show tooltip
      const handleClick = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // Still allow the parent onClick to enter edit mode
      };
      
      links.forEach(link => {
        link.addEventListener('mouseenter', handleMouseEnter);
        link.addEventListener('mouseleave', handleMouseLeave);
        link.addEventListener('click', handleClick);
      });
      
      return () => {
        links.forEach(link => {
          link.removeEventListener('mouseenter', handleMouseEnter);
          link.removeEventListener('mouseleave', handleMouseLeave);
          link.removeEventListener('click', handleClick);
        });
      };
    }
  }, [isEditing, contentHtml, content]);

  // Transform profile details to SourceResponse format for AI suggestions
  const aiSources: SourceResponse[] = useMemo(() => {
    const sources: SourceResponse[] = [];
    
    if (!profileDetails) return sources;
    
    // Add biography as source if available
    if (profileDetails.biography && profileDetails.biography.trim().length > 0) {
      sources.push({
        type: 'bio',
        bioText: profileDetails.biography,
      });
    }
    
    // Add job history as sources
    if (profileDetails.jobHistory && profileDetails.jobHistory.length > 0) {
      profileDetails.jobHistory.forEach(job => {
        sources.push({
          type: 'job_history',
          companyName: job.companyName,
          role: job.role,
          dateRange: job.dateRange,
        });
      });
    }
    
    // Add screeners as sources (business/angle screeners - no Project ID)
    if (profileDetails.screeners && profileDetails.screeners.length > 0) {
      profileDetails.screeners
        .filter(screener => screener.answer && screener.answer.trim().length > 0)
        .forEach(screener => {
          sources.push({
            type: 'screener',
            question: screener.question,
            answer: screener.answer,
          });
        });
    }
    
    // Add past screeners as sources (with Project ID)
    if (profileDetails.pastScreeners && profileDetails.pastScreeners.length > 0) {
      profileDetails.pastScreeners
        .filter(screener => screener.answer && screener.answer.trim().length > 0)
        .forEach(screener => {
          sources.push({
            type: 'past_screener',
            question: screener.question,
            answer: screener.answer,
            projectId: `123456 - ${name}`, // Format: "123456 - Profile Name"
            date: screener.responseDate,
          });
        });
    }
    
    return sources;
  }, [profileDetails, name]);

  // Initialize editor content when entering edit mode
  useEffect(() => {
    if (isEditing) {
      // Use contentHtml if available (for editor), otherwise try content if it's a string
      const htmlContent = contentHtml || (typeof content === 'string' ? content : '');
      // Only set editor content if not already initialized (to preserve edits)
      if (!isInitializedRef.current) {
        setEditorContent(htmlContent);
        originalContentRef.current = htmlContent;
        isInitializedRef.current = true;
      }
    } else {
      // Reset refs when exiting edit mode
      originalContentRef.current = '';
      isInitializedRef.current = false;
    }
  }, [isEditing, content, contentHtml]);

  // Handle content injection - append to current editor content
  useEffect(() => {
    if (isEditing && injectContent) {
      setEditorContent(prev => {
        // Append the injected content to the current editor content
        const newContent = prev.trim() ? `${prev}${injectContent}` : injectContent;
        return newContent;
      });
      // Notify parent that injection is complete
      if (onInjectComplete) {
        onInjectComplete();
      }
    }
  }, [isEditing, injectContent, onInjectComplete]);

  // Convert React node content to HTML string for initial display
  const getContentAsString = (): string => {
    if (typeof content === 'string') {
      return content;
    }
    // For React nodes, we'll need to extract HTML
    // This is a simplified approach - in production you might want a more robust solution
    return '';
  };

  const handleSave = () => {
    if (onSave) {
      // Check if content is empty (after stripping HTML tags)
      const textContent = editorContent.replace(/<[^>]*>/g, '').trim();
      // If empty, pass null; otherwise pass the content
      onSave(textContent.length === 0 ? null : editorContent);
    }
  };

  const handleClear = () => {
    setEditorContent('');
    if (onClear) {
      onClear();
    }
  };

  const handleDiscard = () => {
    // Reset editor content to original content (discards any changes including clear)
    setEditorContent(originalContentRef.current);
    if (onDiscard) {
      onDiscard();
    }
  };

  // === AI Rewrite Widget Handlers ===
  
  // Handle rewrite button click from editor
  const handleRewriteClick = useCallback(async (data: RewriteEventData) => {
    setRewriteSelectionRange(data.selectionRange);
    setRewriteEditorBounds(data.editorBounds);
    setIsRewriteWidgetOpen(true);
    setIsRewriteLoading(true);
    setRewriteError(undefined);
    setRewriteSuggestions([]);

    try {
      const result = await generateRewriteSuggestions(data.selectedText, aiSources);
      
      if (result.error && result.suggestions.length === 0) {
        setRewriteError(result.error);
      } else {
        setRewriteSuggestions(result.suggestions);
        if (result.error) {
          console.warn('Partial AI error:', result.error);
        }
      }
    } catch (error) {
      console.error('AI rewrite error:', error);
      setRewriteError(error instanceof Error ? error.message : 'Failed to generate suggestions');
    } finally {
      setIsRewriteLoading(false);
    }
  }, [aiSources]);

  // Handle selecting a rewrite suggestion
  const handleSelectSuggestion = useCallback((suggestion: AIRewriteSuggestion) => {
    if (editorRef.current && rewriteSelectionRange) {
      editorRef.current.replaceText(
        rewriteSelectionRange.index,
        rewriteSelectionRange.length,
        suggestion.text
      );
      setIsRewriteWidgetOpen(false);
      setRewriteSuggestions([]);
      setRewriteSelectionRange(null);
    }
  }, [rewriteSelectionRange]);

  // Handle closing rewrite widget
  const handleCloseRewriteWidget = useCallback(() => {
    setIsRewriteWidgetOpen(false);
    setRewriteSuggestions([]);
    setRewriteError(undefined);
    setRewriteSelectionRange(null);
  }, []);

  // === AI Sources Widget Handlers ===
  
  // Handle sources button click from editor
  const handleSourcesClick = useCallback((data: SourcesEventData) => {
    setSelectedTextForSources(data.selectedText);
    setSourcesEditorBounds(data.editorBounds);
    setIsSourcesWidgetOpen(true);
  }, []);

  // Handle closing sources widget
  const handleCloseSourcesWidget = useCallback(() => {
    setIsSourcesWidgetOpen(false);
  }, []);

  // Transform sources to SourceItem[] for the sources widget
  // Uses the same relevance algorithm as AI rewrite
  const sourcesForWidget: SourceItem[] = useMemo(() => {
    if (!aiSources || aiSources.length === 0) return [];
    
    const relevantSources = selectRelevantSources(selectedTextForSources, aiSources);
    
    return relevantSources.map((source, index) => {
      const baseItem: SourceItem = {
        id: `source-${index}`,
        type: source.type,
      };
      
      if (source.type === 'bio') {
        return { ...baseItem, bioText: source.bioText };
      }
      
      if (source.type === 'job_history') {
        return {
          ...baseItem,
          companyName: source.companyName,
          role: source.role,
          dateRange: source.dateRange,
        };
      }
      
      if (source.type === 'screener') {
        return {
          ...baseItem,
          question: source.question,
          answer: source.answer,
        };
      }
      
      if (source.type === 'past_screener') {
        return {
          ...baseItem,
          question: source.question,
          answer: source.answer,
          projectId: source.projectId,
          projectName: source.projectName,
          date: source.date,
        };
      }
      
      return baseItem;
    });
  }, [aiSources, selectedTextForSources]);

  // Close widgets when exiting edit mode
  useEffect(() => {
    if (!isEditing) {
      setIsRewriteWidgetOpen(false);
      setIsSourcesWidgetOpen(false);
    }
  }, [isEditing]);

  return (
    <div 
      className={`flex flex-col gap-4 p-5 sm:p-8 rounded-2xl transition-opacity duration-300 ${className}`}
      style={{
        opacity: isDimmed ? 0.4 : 1,
        backgroundColor: isEditing ? '#fcfcfd' : '#ffffff', // cool-grey-25 when editing, white otherwise
        border: isEditing ? '2px solid #0068bc' : '1px solid #ebebeb', // 2px blue-600 when editing, 1px grey-scale-200 otherwise
        overflow: 'visible', // Allow tooltips to overflow
        position: 'relative', // Establish positioning context
      }}
      role="article"
      aria-label={`Profile card for ${name}`}
    >
      {/* Header Section - Different layout for edit vs view mode */}
      {isEditing ? (
        // Edit Mode Header - Based on Figma MCP
        <div className="flex flex-col gap-3 w-full">
          {/* First Row: Name + Profile Details Icon on left, Actions (Search, Discard, Save) on right */}
          <div className="flex items-center justify-between gap-3 w-full">
            {/* Left Side: Name + Profile Details Icon */}
            <div className="flex items-center gap-2 min-w-0">
              {/* Advisor Name */}
              <span 
                className="font-semibold text-grey-scale-700 truncate"
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: '16px',
                  lineHeight: '24px',
                }}
              >
                {name}
              </span>
              
              {/* Profile Details Button */}
              {onOpenProfileDetails && (
                <ProfileActionButton
                  icon={<OpenProfileDetailsIcon />}
                  onClick={onOpenProfileDetails}
                  ariaLabel={`Open profile details for ${name}`}
                />
              )}
            </div>
            
            {/* Right Side: Actions (Clear, Discard, Save) */}
            <div className="flex items-center gap-3 sm:gap-4 shrink-0">
              {onClear && (
                <>
                  <ProfileActionButton
                    icon={<EraseIcon />}
                    onClick={handleClear}
                    ariaLabel={`Clear content for ${name}`}
                  />
                  {onDiscard && (
                    <div 
                      className="h-6 w-px bg-grey-scale-200" 
                      aria-hidden="true"
                    />
                  )}
                </>
              )}
              
              {onDiscard && (
                <ProfileActionButton
                  icon={<DiscardIcon />}
                  onClick={handleDiscard}
                  ariaLabel={`Discard changes for ${name}`}
                />
              )}
              
              {onSave && (
                <ProfileActionButton
                  icon={<SaveIcon />}
                  onClick={handleSave}
                  ariaLabel={`Save ${name}`}
                />
              )}
            </div>
          </div>
          
          {/* Second Row: Angle and Status Badges below the name (only in edit mode) */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Angle Badges */}
            {angles.map((angle, index) => (
              <AngleBadge
                key={index}
                number={angle.number}
                label={angle.label}
              />
            ))}
            
            {/* Status Badge */}
            {status === 'vetted' ? (
              <VettedBadge />
            ) : (
              <UnvettedBadge />
            )}
          </div>
        </div>
      ) : (
        // View Mode Header - Keep original layout
        // Phones: name + actions on the first row, badges wrap onto their own row below
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-x-2 gap-y-3 w-full">
          {/* Advisor Name */}
          <span 
            className="font-semibold text-grey-scale-700 shrink-0 order-1"
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: '16px',
              lineHeight: '24px',
            }}
          >
            {name}
          </span>
          
          {/* Angles and Status */}
          <div className="flex flex-wrap items-center gap-2 min-w-0 order-3 basis-full sm:order-2 sm:basis-auto sm:flex-1">
            {/* Angle Badges */}
            {angles.map((angle, index) => (
              <AngleBadge
                key={index}
                number={angle.number}
                label={angle.label}
              />
            ))}
            
            {/* Status Badge */}
            {status === 'vetted' ? (
              <VettedBadge />
            ) : (
              <UnvettedBadge />
            )}
          </div>
          
          {/* Right Side - Actions in Flex Row */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0 ml-auto order-2 sm:order-3">
            {onEdit && (
              <ProfileActionButton
                icon={<EditIcon />}
                onClick={onEdit}
                ariaLabel={`Edit ${name}`}
              />
            )}
            
            {onEdit && onDelete && (
              <div className="h-6 w-px bg-grey-scale-200" aria-hidden="true" />
            )}
            
            {onDelete && (
              <ProfileActionButton
                icon={<DeleteIcon />}
                onClick={onDelete}
                ariaLabel={`Delete ${name}`}
              />
            )}
          </div>
        </div>
      )}
      
      {/* Content Section - Left-aligned with Name, Full Width with Figma Typography */}
      {isEditing ? (
        // Edit mode: Show Quill editor with same styling as view mode
        <>
          <div 
            className="profile-card-editor"
            style={{
              width: '100%',
              overflow: 'visible', // Allow tooltips to overflow
              position: 'relative', // Establish positioning context
            }}
          >
            <QuillEditor
              ref={editorRef}
              key={`editor-${name}`} // Stable key - let ReactQuill handle value changes
              value={editorContent}
              onChange={setEditorContent}
              placeholder="Enter pitch content..."
              onRewriteClick={handleRewriteClick}
              onSourcesClick={handleSourcesClick}
            />
          </div>
          
          {/* AI Rewrite Widget - Floating, Draggable */}
          <AIRewriteWidget
            isOpen={isRewriteWidgetOpen}
            onClose={handleCloseRewriteWidget}
            suggestions={rewriteSuggestions}
            isLoading={isRewriteLoading}
            error={rewriteError}
            onSelectSuggestion={handleSelectSuggestion}
            editorBounds={rewriteEditorBounds}
            onThumbsUp={(id) => console.log('Thumbs up:', id)}
            onThumbsDown={(id) => console.log('Thumbs down:', id)}
          />
          
          {/* AI Sources Widget - Floating, Draggable */}
          <AISourcesWidget
            isOpen={isSourcesWidgetOpen}
            onClose={handleCloseSourcesWidget}
            sources={sourcesForWidget}
            selectedText={selectedTextForSources}
            editorBounds={sourcesEditorBounds}
            onFeedback={(isRelevant) => console.log('Sources feedback:', isRelevant)}
          />
        </>
      ) : isContentLoading ? (
        // Loading state: Show skeleton loader for content (Figma-sized)
        <Loader lines={4} animated />
      ) : (
        // View mode: Show contentHtml, content (React node), or placeholder if empty
        // Click on content area to enter edit mode
        <div 
          onClick={onEdit}
          style={{ 
            cursor: onEdit ? 'pointer' : 'default',
            width: '100%',
          }}
          role={onEdit ? 'button' : undefined}
          tabIndex={onEdit ? 0 : undefined}
          onKeyDown={onEdit ? (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onEdit();
            }
          } : undefined}
          aria-label={onEdit ? `Click to edit pitch for ${name}` : undefined}
        >
        {(() => {
          // Check if contentHtml has actual content (not just empty tags or whitespace)
          const hasContentHtml = contentHtml && contentHtml.replace(/<[^>]*>/g, '').trim().length > 0;
          // Check if content (React node) exists
          const hasContent = content !== null && content !== undefined;
          
          if (hasContentHtml) {
            return (
              <>
                <style>{`
                  .profile-card-content {
                    margin: 0 !important;
                    padding: 0 !important;
                  }
                  .profile-card-content ul {
                    margin: 0 !important;
                    padding: 0 !important;
                    width: 100% !important;
                    list-style-type: disc !important;
                    list-style-position: inside !important;
                  }
                  .profile-card-content ol {
                    margin: 0 !important;
                    padding: 0 !important;
                    width: 100% !important;
                    list-style-type: decimal !important;
                    list-style-position: inside !important;
                  }
                  .profile-card-content ul li,
                  .profile-card-content ol li {
                    margin: 0 !important;
                    padding: 0 !important;
                    list-style-position: inside !important;
                    display: list-item !important;
                  }
                  .profile-card-content ul li::marker,
                  .profile-card-content ol li::marker {
                    margin-right: 0 !important;
                  }
                  .profile-card-content p {
                    margin: 0 !important;
                    padding: 0 !important;
                  }
                  .profile-card-content > * {
                    margin: 0 !important;
                    padding: 0 !important;
                  }
                  .profile-card-content > *:first-child {
                    margin-top: 0 !important;
                  }
                  .profile-card-content > *:last-child {
                    margin-bottom: 0 !important;
                  }
                  .profile-card-content a {
                    color: #0082EB !important;
                    text-decoration: underline !important;
                    cursor: pointer !important;
                  }
                  .profile-card-content a:hover {
                    color: #0068bc !important;
                  }
                `}</style>
                <div 
                  ref={viewContentRef}
                  className="profile-card-content"
                  style={{
                    width: '100%',
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: '16px',
                    lineHeight: '24px',
                    fontWeight: 500, // Medium
                    color: '#000000',
                    margin: 0,
                    padding: 0,
                  }}
                  dangerouslySetInnerHTML={{ __html: contentHtml }}
                />
                {linkTooltip && <LinkTooltip url={linkTooltip.url} position={linkTooltip.position} />}
              </>
            );
          } else if (hasContent) {
            // Render React node content with same styling
            return (
              <>
                <style>{`
                  .profile-card-content {
                    margin: 0 !important;
                    padding: 0 !important;
                  }
                  .profile-card-content ul {
                    margin: 0 !important;
                    padding: 0 !important;
                    width: 100% !important;
                    list-style-type: disc !important;
                    list-style-position: inside !important;
                  }
                  .profile-card-content ol {
                    margin: 0 !important;
                    padding: 0 !important;
                    width: 100% !important;
                    list-style-type: decimal !important;
                    list-style-position: inside !important;
                  }
                  .profile-card-content ul li,
                  .profile-card-content ol li {
                    margin: 0 !important;
                    padding: 0 !important;
                    list-style-position: inside !important;
                    display: list-item !important;
                  }
                  .profile-card-content ul li::marker,
                  .profile-card-content ol li::marker {
                    margin-right: 0 !important;
                  }
                  .profile-card-content p {
                    margin: 0 !important;
                    padding: 0 !important;
                  }
                  .profile-card-content > * {
                    margin: 0 !important;
                    padding: 0 !important;
                  }
                  .profile-card-content > *:first-child {
                    margin-top: 0 !important;
                  }
                  .profile-card-content > *:last-child {
                    margin-bottom: 0 !important;
                  }
                  .profile-card-content a {
                    color: #0082EB !important;
                    text-decoration: underline !important;
                    cursor: pointer !important;
                  }
                  .profile-card-content a:hover {
                    color: #0068bc !important;
                  }
                `}</style>
                <div 
                  ref={viewContentRef}
                  className="profile-card-content"
                  style={{
                    width: '100%',
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: '16px',
                    lineHeight: '24px',
                    fontWeight: 500, // Medium
                    color: '#000000',
                    margin: 0,
                    padding: 0,
                  }}
                >
                  {content}
                </div>
                {linkTooltip && <LinkTooltip url={linkTooltip.url} position={linkTooltip.position} />}
              </>
            );
          } else {
            // Placeholder when no pitch content
            return (
              <span
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: '14px',
                  lineHeight: '20px',
                  fontWeight: 500,
                  color: 'rgba(0, 0, 0, 0.40)', // 40% opacity black - gray placeholder text
                  fontStyle: 'normal',
                }}
              >
                No Pitch Content
              </span>
            );
          }
        })()}
        </div>
      )}
    </div>
  );
};

/**
 * ProfileActionButton Component
 * 
 * Icon-only button for profile card actions (edit, delete).
 * No background, no padding, only color changes on hover and active.
 */
interface ProfileActionButtonProps {
  icon: React.ReactNode;
  onClick?: () => void;
  ariaLabel?: string;
  /** Short hover label, e.g. "Save pitch" */
  tooltip?: string;
}

/**
 * Card action icon button (MUI IconButton): grey by default, blue on hover / press.
 * Figma icons read their fill from style.color, so the colour is passed down.
 */
export const ProfileActionButton: React.FC<ProfileActionButtonProps> = ({
  icon,
  onClick,
  ariaLabel,
  tooltip,
}) => {
  const [isHighlighted, setIsHighlighted] = useState(false);
  const color = isHighlighted ? '#0068bc' : 'rgba(0, 0, 0, 0.64)';

  const button = (
    <IconButton
      onClick={onClick}
      aria-label={ariaLabel}
      size="small"
      onMouseEnter={() => setIsHighlighted(true)}
      onMouseLeave={() => setIsHighlighted(false)}
      onFocus={() => setIsHighlighted(true)}
      onBlur={() => setIsHighlighted(false)}
      sx={{ p: 0.5, m: -0.5 }}
    >
      {React.isValidElement(icon)
        ? React.cloneElement(icon as React.ReactElement<any>, {
            style: { color, width: '24px', height: '24px', minWidth: '24px', minHeight: '24px' },
            className: '',
          })
        : icon}
    </IconButton>
  );

  return tooltip ? <Tooltip title={tooltip}>{button}</Tooltip> : button;
};

export default ProfileCard;

