import React, { useState, useRef, useEffect } from 'react';
import { CloseIcon } from '../icons/CloseIcon';

export interface SourceItem {
  id: string;
  type: 'bio' | 'job_history' | 'screener' | 'past_screener' | 'angle_screener' | 'business_screener';
  // For bio
  bioText?: string;
  // For job history
  companyName?: string;
  role?: string;
  dateRange?: string;
  // For screeners
  question?: string;
  answer?: string;
  isKeyQuestion?: boolean;
  // For past screeners
  projectId?: string;
  projectName?: string;
  date?: string;
}

export interface AISourcesWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  sources: SourceItem[];
  selectedText?: string;
  onFeedback?: (isRelevant: boolean) => void;
  /** Position hint from editor bounds */
  editorBounds?: { top: number; left: number; right: number; bottom: number };
}

// Star icon for key questions
const StarIcon: React.FC<{ className?: string; filled?: boolean }> = ({ className, filled = true }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {filled ? (
      <path d="M8 1.5L9.79 5.78L14.5 6.25L10.93 9.47L11.94 14.09L8 11.77L4.06 14.09L5.07 9.47L1.5 6.25L6.21 5.78L8 1.5Z" fill="#F5A623"/>
    ) : (
      <path d="M8 1.5L9.79 5.78L14.5 6.25L10.93 9.47L11.94 14.09L8 11.77L4.06 14.09L5.07 9.47L1.5 6.25L6.21 5.78L8 1.5Z" stroke="#F5A623" strokeWidth="1.5" fill="none"/>
    )}
  </svg>
);

// Thumbs up icon
const ThumbsUpIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <mask id="mask_thumbup_sources" style={{maskType: 'alpha'}} maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20">
      <rect width="20" height="20" fill="#D9D9D9"/>
    </mask>
    <g mask="url(#mask_thumbup_sources)">
      <path d="M15 17H5.5V7L11.5 1L12.1667 1.45833C12.4028 1.625 12.5833 1.83681 12.7083 2.09375C12.8333 2.35069 12.8681 2.61806 12.8125 2.89583L12.7917 3L12 7H17.5C17.9167 7 18.2708 7.14583 18.5625 7.4375C18.8542 7.72917 19 8.08333 19 8.5V9.6875C19 9.79861 18.9896 9.89931 18.9688 9.98958C18.9479 10.0799 18.9167 10.1736 18.875 10.2708L16.3944 16.0875C16.2703 16.3625 16.0833 16.5833 15.8333 16.75C15.5833 16.9167 15.3056 17 15 17ZM7 15.5H15L17.5 9.6875V8.5H10.1667L11.1875 3.4375L7 7.625V15.5ZM5.5 7V8.5H2.5V15.5H5.5V17H1V7H5.5Z" fill="currentColor"/>
    </g>
  </svg>
);

// Thumbs down icon
const ThumbsDownIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <mask id="mask_thumbdown_sources" style={{maskType: 'alpha'}} maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20">
      <rect width="20" height="20" fill="#D9D9D9"/>
    </mask>
    <g mask="url(#mask_thumbdown_sources)">
      <path d="M5 3H14.5V13L8.5 19L7.83333 18.5417C7.59722 18.375 7.41667 18.1632 7.29167 17.9062C7.16667 17.6493 7.13194 17.3819 7.1875 17.1042L7.20833 17L8 13H2.5C2.08333 13 1.72917 12.8542 1.4375 12.5625C1.14583 12.2708 1 11.9167 1 11.5V10.3125C1 10.2014 1.01042 10.1007 1.03125 10.0104C1.05208 9.92014 1.08333 9.82639 1.125 9.72917L3.60417 3.91667C3.71528 3.63889 3.89931 3.41667 4.15625 3.25C4.41319 3.08333 4.69444 3 5 3ZM13 4.5H5L2.5 10.3125V11.5H9.83333L8.8125 16.5625L13 12.375V4.5ZM14.5 13V11.5H17.5V4.5H14.5V3H19V13H14.5Z" fill="currentColor"/>
    </g>
  </svg>
);

/**
 * AISourcesWidget Component
 * 
 * A draggable floating widget that displays sources for selected content.
 * Matches Figma design - similar to AIRewriteWidget.
 */
export const AISourcesWidget: React.FC<AISourcesWidgetProps> = ({
  isOpen,
  onClose,
  sources,
  selectedText,
  onFeedback,
  editorBounds,
}) => {
  const widgetRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [initialized, setInitialized] = useState(false);
  
  // Feedback state
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  
  // Close button hover/active states (matching modal)
  const [isCloseHovered, setIsCloseHovered] = useState(false);
  const [isCloseActive, setIsCloseActive] = useState(false);
  
  // Handle thumbs up - close immediately
  const handleThumbsUp = () => {
    onFeedback?.(true);
    onClose();
  };
  
  // Handle thumbs down - show feedback input
  const handleThumbsDown = () => {
    setShowFeedbackInput(true);
  };
  
  // Handle feedback submission
  const handleSubmitFeedback = () => {
    // In future, this would send feedback to backend
    console.log('Feedback submitted:', feedbackText);
    onFeedback?.(false);
    setFeedbackText('');
    setShowFeedbackInput(false);
    onClose();
  };
  
  // Reset feedback state when widget closes
  useEffect(() => {
    if (!isOpen) {
      setShowFeedbackInput(false);
      setFeedbackText('');
    }
  }, [isOpen]);
  
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
      className="ai-sources-widget"
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
        <span
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: '16px',
            fontWeight: 600,
            color: '#333333',
          }}
        >
          Sources For Selected Content
        </span>
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
          aria-label="Close sources"
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
        {/* Feedback section */}
        {!showFeedbackInput ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px',
            }}
          >
            <span
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: '14px',
                fontWeight: 500,
                color: '#333333',
              }}
            >
              Are these screeners relevant:
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleThumbsUp}
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
                aria-label="Yes, relevant"
              >
                <ThumbsUpIcon />
              </button>
              <button
                onClick={handleThumbsDown}
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
                aria-label="No, not relevant"
              >
                <ThumbsDownIcon />
              </button>
            </div>
          </div>
        ) : (
          /* Feedback input section - shown after thumbs down */
          <div
            style={{
              marginBottom: '16px',
              padding: '16px',
              backgroundColor: '#f8f9fa',
              borderRadius: '12px',
            }}
          >
            <p
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: '14px',
                fontWeight: 500,
                color: '#333333',
                margin: '0 0 12px 0',
              }}
            >
              What would make these sources more relevant?
            </p>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Enter your feedback..."
              style={{
                width: '100%',
                minHeight: '80px',
                padding: '12px',
                fontFamily: "'Poppins', sans-serif",
                fontSize: '14px',
                lineHeight: '22px',
                color: '#333333',
                border: '1px solid #ebebeb',
                borderRadius: '8px',
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#0082EB';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#ebebeb';
              }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px',
                marginTop: '12px',
              }}
            >
              <button
                onClick={() => {
                  setShowFeedbackInput(false);
                  setFeedbackText('');
                }}
                style={{
                  padding: '8px 16px',
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#666666',
                  backgroundColor: 'transparent',
                  border: '1px solid #ebebeb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f0f0f0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitFeedback}
                disabled={feedbackText.trim().length === 0}
                style={{
                  padding: '8px 16px',
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#ffffff',
                  backgroundColor: feedbackText.trim().length > 0 ? '#0082EB' : '#cccccc',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: feedbackText.trim().length > 0 ? 'pointer' : 'not-allowed',
                }}
                onMouseEnter={(e) => {
                  if (feedbackText.trim().length > 0) {
                    e.currentTarget.style.backgroundColor = '#0070d4';
                  }
                }}
                onMouseLeave={(e) => {
                  if (feedbackText.trim().length > 0) {
                    e.currentTarget.style.backgroundColor = '#0082EB';
                  }
                }}
              >
                Submit
              </button>
            </div>
          </div>
        )}

        {/* Sources list */}
        {sources.length === 0 ? (
          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              color: 'rgba(0, 0, 0, 0.64)',
              fontFamily: "'Poppins', sans-serif",
              fontSize: '14px',
            }}
          >
            No sources available for this content.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {sources.map((source, index) => (
              <div
                key={source.id}
                style={{
                  paddingTop: index > 0 ? '16px' : '0',
                  paddingBottom: index < sources.length - 1 ? '16px' : '0',
                  borderBottom: index < sources.length - 1 ? '1px solid #ebebeb' : 'none',
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

                {/* Business/Angle Screener Source (no Project ID) */}
                {(source.type === 'screener' || source.type === 'business_screener' || source.type === 'angle_screener') && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {/* Key question star */}
                    {source.isKeyQuestion && (
                      <div style={{ flexShrink: 0, paddingTop: '2px' }}>
                        <StarIcon filled />
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
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
                    </div>
                  </div>
                )}

                {/* Past Screener Source (with Project ID and Date) */}
                {source.type === 'past_screener' && (
                  <>
                    {/* Project ID and Date row */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {/* Key question star */}
                        {source.isKeyQuestion && (
                          <StarIcon filled />
                        )}
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
                            {source.projectId}
                          </a>
                        </span>
                      </div>
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
    </div>
  );
};

export default AISourcesWidget;

