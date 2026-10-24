import React, { useState, useRef, useEffect } from 'react';
import { Loader } from '../loader';
import { CloseIcon } from '../icons/CloseIcon';

export type SourceType = 'bio' | 'job_history' | 'screener' | 'past_screener';

export interface SourceResponse {
  type: SourceType;
  // For bio
  bioText?: string;
  // For job history
  companyName?: string;
  role?: string;
  dateRange?: string;
  // For screeners (current and past)
  question?: string;
  answer?: string;
  // Only for past_screener - shows Project ID
  projectId?: string;
  projectName?: string;
  date?: string;
}

export interface AIRewriteSuggestion {
  id: string;
  text: string;
  sources?: SourceResponse[];
}

export interface AIRewriteWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  suggestions: AIRewriteSuggestion[];
  isLoading: boolean;
  error?: string;
  onSelectSuggestion: (suggestion: AIRewriteSuggestion) => void;
  onThumbsUp?: (suggestionId: string) => void;
  onThumbsDown?: (suggestionId: string) => void;
  /** Position hint from editor bounds */
  editorBounds?: { top: number; left: number; right: number; bottom: number };
}

// AI Sparkle icon for header (from ai.svg)
const AISparkleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <mask id="mask0_ai_header" style={{maskType: 'alpha'}} maskUnits="userSpaceOnUse" x="0" y="0" width="18" height="18">
      <rect width="18" height="18" fill="#D9D9D9"/>
    </mask>
    <g mask="url(#mask0_ai_header)">
      <path d="M9 -1C9 4.52285 4.52284 9 -1 9C4.52284 9 9 13.4771 9 19C9 13.4771 13.4772 9 19 9C13.4772 9 9 4.52285 9 -1Z" fill="url(#paint0_linear_ai_header)"/>
    </g>
    <defs>
      <linearGradient id="paint0_linear_ai_header" x1="9" y1="-1" x2="9" y2="19" gradientUnits="userSpaceOnUse">
        <stop offset="0.24" stopColor="#339BEF"/>
        <stop offset="0.5625" stopColor="#8D98FF"/>
        <stop offset="1" stopColor="#D3BBFF"/>
      </linearGradient>
    </defs>
  </svg>
);


// Inject icon (exact same as screeners in drawer)
const InjectIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <mask id="mask_inject_ai_widget" style={{maskType: 'alpha'}} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
      <rect width="24" height="24" fill="#D9D9D9"/>
    </mask>
    <g mask="url(#mask_inject_ai_widget)">
      <path d="M12 8L7 13L8.4 14.4L11 11.825V22H13V11.825L15.6 14.4L17 13L12 8ZM3.65 17.5C3.11667 16.6833 2.70833 15.8083 2.425 14.875C2.14167 13.9417 2 12.9833 2 12C2 10.6167 2.2625 9.31667 2.7875 8.1C3.3125 6.88333 4.025 5.825 4.925 4.925C5.825 4.025 6.88333 3.3125 8.1 2.7875C9.31667 2.2625 10.6167 2 12 2C13.3833 2 14.6833 2.2625 15.9 2.7875C17.1167 3.3125 18.175 4.025 19.075 4.925C19.975 5.825 20.6875 6.88333 21.2125 8.1C21.7375 9.31667 22 10.6167 22 12C22 12.9833 21.8583 13.9417 21.575 14.875C21.2917 15.8083 20.8833 16.6833 20.35 17.5L18.9 16.05C19.2667 15.4333 19.5417 14.7833 19.725 14.1C19.9083 13.4167 20 12.7167 20 12C20 9.76667 19.225 7.875 17.675 6.325C16.125 4.775 14.2333 4 12 4C9.76667 4 7.875 4.775 6.325 6.325C4.775 7.875 4 9.76667 4 12C4 12.7167 4.09167 13.4167 4.275 14.1C4.45833 14.7833 4.73333 15.4333 5.1 16.05L3.65 17.5Z" fill="currentColor"/>
    </g>
  </svg>
);

// Drag handle icon
const DragHandleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="5" cy="4" r="1.5" fill="currentColor"/>
    <circle cx="11" cy="4" r="1.5" fill="currentColor"/>
    <circle cx="5" cy="8" r="1.5" fill="currentColor"/>
    <circle cx="11" cy="8" r="1.5" fill="currentColor"/>
    <circle cx="5" cy="12" r="1.5" fill="currentColor"/>
    <circle cx="11" cy="12" r="1.5" fill="currentColor"/>
  </svg>
);

// Thumbs up icon (from thumbup.svg)
const ThumbsUpIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <mask id="mask_thumbup_ai" style={{maskType: 'alpha'}} maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20">
      <rect width="20" height="20" fill="#D9D9D9"/>
    </mask>
    <g mask="url(#mask_thumbup_ai)">
      <path d="M15 17H5.5V7L11.5 1L12.1667 1.45833C12.4028 1.625 12.5833 1.83681 12.7083 2.09375C12.8333 2.35069 12.8681 2.61806 12.8125 2.89583L12.7917 3L12 7H17.5C17.9167 7 18.2708 7.14583 18.5625 7.4375C18.8542 7.72917 19 8.08333 19 8.5V9.6875C19 9.79861 18.9896 9.89931 18.9688 9.98958C18.9479 10.0799 18.9167 10.1736 18.875 10.2708L16.3944 16.0875C16.2703 16.3625 16.0833 16.5833 15.8333 16.75C15.5833 16.9167 15.3056 17 15 17ZM7 15.5H15L17.5 9.6875V8.5H10.1667L11.1875 3.4375L7 7.625V15.5ZM5.5 7V8.5H2.5V15.5H5.5V17H1V7H5.5Z" fill="currentColor"/>
    </g>
  </svg>
);

// Thumbs down icon (from thumbdown.svg)
const ThumbsDownIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <mask id="mask_thumbdown_ai" style={{maskType: 'alpha'}} maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20">
      <rect width="20" height="20" fill="#D9D9D9"/>
    </mask>
    <g mask="url(#mask_thumbdown_ai)">
      <path d="M5 3H14.5V13L8.5 19L7.83333 18.5417C7.59722 18.375 7.41667 18.1632 7.29167 17.9062C7.16667 17.6493 7.13194 17.3819 7.1875 17.1042L7.20833 17L8 13H2.5C2.08333 13 1.72917 12.8542 1.4375 12.5625C1.14583 12.2708 1 11.9167 1 11.5V10.3125C1 10.2014 1.01042 10.1007 1.03125 10.0104C1.05208 9.92014 1.08333 9.82639 1.125 9.72917L3.60417 3.91667C3.71528 3.63889 3.89931 3.41667 4.15625 3.25C4.41319 3.08333 4.69444 3 5 3ZM13 4.5H5L2.5 10.3125V11.5H9.83333L8.8125 16.5625L13 12.375V4.5ZM14.5 13V11.5H17.5V4.5H14.5V3H19V13H14.5Z" fill="currentColor"/>
    </g>
  </svg>
);

// Chevron icon (can be rotated for up/down)
const ChevronIcon: React.FC<{ className?: string; direction?: 'up' | 'down' }> = ({ className, direction = 'down' }) => (
  <svg 
    width="16" 
    height="16" 
    viewBox="0 0 16 16" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
    style={{ transform: direction === 'up' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
  >
    <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/**
 * AIRewriteWidget Component
 * 
 * A draggable floating widget that displays AI-generated rewrite suggestions.
 * Matches Figma design.
 */
export const AIRewriteWidget: React.FC<AIRewriteWidgetProps> = ({
  isOpen,
  onClose,
  suggestions,
  isLoading,
  error,
  onSelectSuggestion,
  onThumbsUp,
  onThumbsDown,
  editorBounds,
}) => {
  const widgetRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [initialized, setInitialized] = useState(false);
  
  // Track which suggestion cards have expanded sources
  const [expandedSuggestions, setExpandedSuggestions] = useState<Set<string>>(new Set());
  
  // Reset expanded state when new suggestions are generated
  useEffect(() => {
    if (!isLoading && suggestions.length > 0) {
      setExpandedSuggestions(new Set()); // Reset to collapsed
    }
  }, [suggestions, isLoading]);
  
  // Close button hover/active states (matching modal)
  const [isCloseHovered, setIsCloseHovered] = useState(false);
  const [isCloseActive, setIsCloseActive] = useState(false);
  
  const toggleSourceExpansion = (suggestionId: string) => {
    setExpandedSuggestions(prev => {
      const next = new Set(prev);
      if (next.has(suggestionId)) {
        next.delete(suggestionId);
      } else {
        next.add(suggestionId);
      }
      return next;
    });
  };
  
  const getCloseBackgroundColor = () => {
    if (isCloseActive) {
      return 'rgba(0, 130, 235, 0.16)'; // blue-600 at 16%
    }
    if (isCloseHovered) {
      return 'rgba(0, 0, 0, 0.04)'; // grey at 4%
    }
    return 'transparent';
  };

  const getCloseIconColor = () => {
    if (isCloseActive) {
      return '#0082EB'; // blue-600
    }
    return 'rgba(0, 0, 0, 0.64)'; // black at 64%
  };

  // Initialize position when widget opens
  useEffect(() => {
    if (isOpen && !initialized) {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const widgetWidth = 600;
      
      // Position at right side of screen
      let x = viewportWidth - widgetWidth - 48;
      let y = 150;
      
      // If we have editor bounds, position relative to editor
      if (editorBounds) {
        x = Math.min(editorBounds.right - widgetWidth + 100, viewportWidth - widgetWidth - 20);
        y = Math.max(editorBounds.top, 100);
      }
      
      setPosition({ x: Math.max(20, x), y: Math.max(80, y) });
      setInitialized(true);
    }
    
    if (!isOpen) {
      setInitialized(false);
    }
  }, [isOpen, editorBounds, initialized]);

  // Handle drag start
  const handleMouseDown = (e: React.MouseEvent) => {
    if (widgetRef.current) {
      const rect = widgetRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsDragging(true);
    }
  };

  // Handle drag move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        
        const maxX = window.innerWidth - (widgetRef.current?.offsetWidth || 600);
        const maxY = window.innerHeight - (widgetRef.current?.offsetHeight || 300);
        
        setPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY))
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  if (!isOpen) return null;

  return (
    <div
      ref={widgetRef}
      className="ai-rewrite-widget"
      style={{
        position: 'fixed',
        top: position.y,
        left: position.x,
        zIndex: 10000,
        width: '600px',
        maxHeight: '600px',
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.16), 0px 2px 8px rgba(0, 0, 0, 0.08)',
        overflow: 'hidden',
        cursor: isDragging ? 'grabbing' : 'default',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header - Draggable */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AISparkleIcon />
          <span
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: '16px',
              fontWeight: 600,
              color: '#333333',
            }}
          >
            AI Rewrite Suggestions
          </span>
        </div>
        <button
          onClick={onClose}
          className="flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 rounded-full"
          style={{
            width: '32px',
            height: '32px',
            padding: '8px',
            borderRadius: '1000px',
            backgroundColor: getCloseBackgroundColor(),
            flexShrink: 0,
            border: 'none',
            cursor: 'pointer',
          }}
          aria-label="Close AI suggestions"
          onMouseEnter={() => setIsCloseHovered(true)}
          onMouseLeave={() => {
            setIsCloseHovered(false);
            setIsCloseActive(false);
          }}
          onMouseDown={() => setIsCloseActive(true)}
          onMouseUp={() => setIsCloseActive(false)}
          onFocus={() => setIsCloseHovered(true)}
          onBlur={() => {
            setIsCloseHovered(false);
            setIsCloseActive(false);
          }}
        >
          <CloseIcon style={{ color: getCloseIconColor() }} />
        </button>
      </div>

      {/* Content - Scrollable */}
      <div style={{ padding: '0 20px 20px 20px', overflowY: 'auto', flex: 1 }}>
        {isLoading ? (
          <div style={{ padding: '16px 0' }}>
            <Loader lines={3} width="400px" animated />
          </div>
        ) : error ? (
          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              color: '#dc2626',
              fontFamily: "'Poppins', sans-serif",
              fontSize: '14px',
            }}
          >
            <p>{error}</p>
            <button
              onClick={onClose}
              style={{
                marginTop: '12px',
                padding: '8px 16px',
                backgroundColor: '#f3f4f6',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontFamily: "'Poppins', sans-serif",
                fontSize: '14px',
              }}
            >
              Close
            </button>
          </div>
        ) : suggestions.length === 0 ? (
          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              color: 'rgba(0, 0, 0, 0.64)',
              fontFamily: "'Poppins', sans-serif",
              fontSize: '14px',
            }}
          >
            No suggestions available.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {suggestions.slice(0, 2).map((suggestion) => {
              // Check if any suggestion is expanded
              const anyExpanded = expandedSuggestions.size > 0;
              const thisIsExpanded = expandedSuggestions.has(suggestion.id);
              
              // Hide this suggestion if another one is expanded
              if (anyExpanded && !thisIsExpanded) {
                return null;
              }
              
              return (
              <div
                key={suggestion.id}
                style={{
                  padding: '16px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #ebebeb',
                  borderRadius: '12px',
                }}
              >
                {/* Suggestion text with apply button */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <p
                    style={{
                      flex: 1,
                      fontFamily: "'Poppins', sans-serif",
                      fontSize: '14px',
                      lineHeight: '22px',
                      color: '#333333',
                      margin: 0,
                    }}
                  >
                    {suggestion.text}
                  </p>
                  
                  {/* Inject button - exact same styling as screeners drawer */}
                  <button
                    onClick={() => onSelectSuggestion(suggestion)}
                    className="flex-shrink-0 flex items-center justify-center transition-colors hover:opacity-80"
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '1000px',
                      backgroundColor: 'rgba(0, 130, 235, 0.08)',
                      color: '#0082EB',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                    aria-label="Apply this suggestion"
                  >
                    <InjectIcon />
                  </button>
                </div>

                {/* Footer with response count and feedback */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '12px',
                  }}
                >
                  {/* Response count dropdown - max 4 sources */}
                  <button
                    onClick={() => toggleSourceExpansion(suggestion.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: "'Poppins', sans-serif",
                      fontSize: '13px',
                      color: 'rgba(0, 0, 0, 0.64)',
                      padding: '4px 0',
                    }}
                  >
                    {Math.min(suggestion.sources?.length || 1, 4)} Response(s)
                    <ChevronIcon direction={expandedSuggestions.has(suggestion.id) ? 'up' : 'down'} />
                  </button>

                  {/* Feedback buttons */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => onThumbsUp?.(suggestion.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        color: 'rgba(0, 0, 0, 0.40)',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)';
                        e.currentTarget.style.color = 'rgba(0, 0, 0, 0.64)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'rgba(0, 0, 0, 0.40)';
                      }}
                      aria-label="Good suggestion"
                    >
                      <ThumbsUpIcon />
                    </button>
                    <button
                      onClick={() => onThumbsDown?.(suggestion.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        color: 'rgba(0, 0, 0, 0.40)',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)';
                        e.currentTarget.style.color = 'rgba(0, 0, 0, 0.64)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'rgba(0, 0, 0, 0.40)';
                      }}
                      aria-label="Bad suggestion"
                    >
                      <ThumbsDownIcon />
                    </button>
                  </div>
                </div>
                
                {/* Expanded Sources Section - Max 4 sources */}
                {expandedSuggestions.has(suggestion.id) && suggestion.sources && suggestion.sources.length > 0 && (
                  <div
                    style={{
                      marginTop: '12px',
                      borderTop: '1px solid #ebebeb',
                      paddingTop: '12px',
                    }}
                  >
                    {suggestion.sources.slice(0, 4).map((source, sourceIndex, slicedArray) => (
                      <div
                        key={sourceIndex}
                        style={{
                          paddingTop: sourceIndex > 0 ? '12px' : '0',
                          paddingBottom: sourceIndex < slicedArray.length - 1 ? '12px' : '0',
                          borderBottom: sourceIndex < slicedArray.length - 1 ? '1px solid #ebebeb' : 'none',
                        }}
                      >
                        {/* Bio Source */}
                        {source.type === 'bio' && (
                          <>
                            <p
                              style={{
                                fontFamily: "'Poppins', sans-serif",
                                fontSize: '14px',
                                fontWeight: 500,
                                color: '#000000',
                                margin: '0 0 4px 0',
                              }}
                            >
                              Advisor Bio
                            </p>
                            <p
                              style={{
                                fontFamily: "'Poppins', sans-serif",
                                fontSize: '14px',
                                lineHeight: '22px',
                                color: '#000000',
                                margin: 0,
                              }}
                            >
                              {source.bioText}
                            </p>
                          </>
                        )}

                        {/* Job History Source */}
                        {source.type === 'job_history' && (
                          <>
                            <p
                              style={{
                                fontFamily: "'Poppins', sans-serif",
                                fontSize: '14px',
                                fontWeight: 500,
                                color: '#000000',
                                margin: '0 0 4px 0',
                              }}
                            >
                              Job History
                            </p>
                            <p
                              style={{
                                fontFamily: "'Poppins', sans-serif",
                                fontSize: '14px',
                                lineHeight: '22px',
                                color: '#000000',
                                margin: 0,
                              }}
                            >
                              <span style={{ fontWeight: 500 }}>{source.companyName}</span> — {source.role}
                              {source.dateRange && <span style={{ color: 'rgba(0, 0, 0, 0.48)' }}> ({source.dateRange})</span>}
                            </p>
                          </>
                        )}

                        {/* Current Screener Source (no Project ID) */}
                        {source.type === 'screener' && (
                          <>
                            <p
                              style={{
                                fontFamily: "'Poppins', sans-serif",
                                fontSize: '14px',
                                lineHeight: '22px',
                                color: '#000000',
                                margin: '0 0 4px 0',
                              }}
                            >
                              Q: {source.question}
                            </p>
                            <p
                              style={{
                                fontFamily: "'Poppins', sans-serif",
                                fontSize: '14px',
                                lineHeight: '22px',
                                color: '#000000',
                                margin: 0,
                              }}
                            >
                              A: {source.answer}
                            </p>
                          </>
                        )}

                        {/* Past Screener Source (with Project ID) */}
                        {source.type === 'past_screener' && (
                          <>
                            {/* Project ID and Date row - only for past screeners */}
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '8px',
                              }}
                            >
                              <span
                                style={{
                                  fontFamily: "'Poppins', sans-serif",
                                  fontSize: '14px',
                                  fontWeight: 400,
                                  color: '#000000',
                                }}
                              >
                                Project ID:{' '}
                                <a
                                  href="#"
                                  style={{
                                    color: '#0082EB',
                                    textDecoration: 'underline',
                                  }}
                                  onClick={(e) => e.preventDefault()}
                                >
                                  {source.projectId} - {source.projectName}
                                </a>
                              </span>
                              {source.date && (
                                <span
                                  style={{
                                    fontFamily: "'Poppins', sans-serif",
                                    fontSize: '14px',
                                    color: 'rgba(0, 0, 0, 0.48)',
                                  }}
                                >
                                  Date: {source.date}
                                </span>
                              )}
                            </div>
                            
                            {/* Question */}
                            <p
                              style={{
                                fontFamily: "'Poppins', sans-serif",
                                fontSize: '14px',
                                lineHeight: '22px',
                                color: '#000000',
                                margin: '0 0 4px 0',
                              }}
                            >
                              Q: {source.question}
                            </p>
                            
                            {/* Answer */}
                            <p
                              style={{
                                fontFamily: "'Poppins', sans-serif",
                                fontSize: '14px',
                                lineHeight: '22px',
                                color: '#000000',
                                margin: 0,
                              }}
                            >
                              A: {source.answer}
                            </p>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIRewriteWidget;
