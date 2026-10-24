import React, { useRef, useEffect, useCallback, useState, useImperativeHandle, forwardRef } from 'react';
import ReactDOM from 'react-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.bubble.css';
import type { SourceResponse } from '../ai';

// Link Tooltip Component for editor (rendered via portal)
const EditorLinkTooltip: React.FC<{ url: string; position: { top: number; left: number } }> = ({ url, position }) => {
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
        zIndex: 999999,
        pointerEvents: 'none',
        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
      }}
    >
      {url}
    </div>,
    document.body
  );
};

export interface EditorBounds {
  top: number;
  left: number;
  right: number;
  bottom: number;
}

export interface RewriteEventData {
  selectedText: string;
  editorBounds: EditorBounds;
  selectionRange: { index: number; length: number };
}

export interface SourcesEventData {
  selectedText: string;
  editorBounds: EditorBounds;
}

export interface QuillEditorRef {
  /** Replace text at a specific range with new text */
  replaceText: (index: number, length: number, newText: string) => void;
  /** Get the current selection */
  getSelection: () => { index: number; length: number } | null;
  /** Get selected text */
  getSelectedText: () => string;
}

export interface QuillEditorProps {
  /**
   * Initial content value (HTML string or Delta)
   */
  value: string;
  /**
   * Callback when content changes
   */
  onChange: (content: string) => void;
  /**
   * Placeholder text
   */
  placeholder?: string;
  /**
   * Whether editor is read-only
   */
  readOnly?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Additional inline styles
   */
  style?: React.CSSProperties;
  /**
   * Callback for Rewrite button click - provides selected text and editor bounds
   */
  onRewriteClick?: (data: RewriteEventData) => void;
  /**
   * Callback for Sources button click - provides selected text and editor bounds
   */
  onSourcesClick?: (data: SourcesEventData) => void;
  /**
   * Source responses (screener Q&As) - kept for backwards compatibility
   * @deprecated Use onRewriteClick and onSourcesClick instead
   */
  sources?: SourceResponse[];
}

/**
 * QuillEditor Component
 *
 * Rich text editor using Quill with bubble toolbar.
 * Uses Quill's default bubble toolbar implementation.
 * 
 * AI widgets (Rewrite and Sources) are now external - use onRewriteClick and onSourcesClick 
 * callbacks to handle these actions and render widgets separately.
 *
 * @example
 * <QuillEditor
 *   ref={editorRef}
 *   value={content}
 *   onChange={(newContent) => setContent(newContent)}
 *   placeholder="Enter pitch content..."
 *   onRewriteClick={(data) => openRewriteWidget(data)}
 *   onSourcesClick={(data) => openSourcesWidget(data)}
 * />
 */
export const QuillEditor = forwardRef<QuillEditorRef, QuillEditorProps>(({
  value,
  onChange,
  placeholder = '',
  readOnly = false,
  className = '',
  style,
  onRewriteClick,
  onSourcesClick,
  sources,
}, ref) => {
  const quillRef = useRef<ReactQuill>(null);
  const customButtonsInjectedRef = useRef(false);
  
  // Link hover tooltip state
  const [linkTooltip, setLinkTooltip] = useState<{ url: string; position: { top: number; left: number } } | null>(null);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    replaceText: (index: number, length: number, newText: string) => {
      if (quillRef.current) {
        const editor = quillRef.current.getEditor();
        editor.deleteText(index, length);
        editor.insertText(index, newText);
      }
    },
    getSelection: () => {
      if (quillRef.current) {
        const editor = quillRef.current.getEditor();
        return editor.getSelection();
      }
      return null;
    },
    getSelectedText: () => {
      if (quillRef.current) {
        const editor = quillRef.current.getEditor();
        const selection = editor.getSelection();
        if (selection && selection.length > 0) {
          return editor.getText(selection.index, selection.length);
        }
      }
      return '';
    },
  }));

  // Configure toolbar according to Quill API manual
  // All items in ONE array = ONE row of buttons in ONE .ql-formats container
  const toolbarOptions = [
    ['bold', 'italic', 'underline', 'background', 'link', { 'list': 'ordered'}, { 'list': 'bullet' }],
  ];

  const modules = {
    toolbar: toolbarOptions,
    clipboard: {
      matchVisual: false,
    },
  };

  // Configure bounds to allow tooltips to overflow
  const editorBounds = typeof document !== 'undefined' ? document.body : undefined;

  const formats = [
    'bold',
    'italic',
    'underline',
    'background',
    'list',
    'link',
    'indent', // Allow nested bullets with Tab key
  ];

  // Get selected text from editor
  const getSelectedText = useCallback(() => {
    if (quillRef.current) {
      const editor = quillRef.current.getEditor();
      const selection = editor.getSelection();
      if (selection && selection.length > 0) {
        return editor.getText(selection.index, selection.length);
      }
    }
    return '';
  }, []);

  // Get editor bounds for widget positioning
  const getEditorBounds = useCallback((): EditorBounds | null => {
    if (quillRef.current) {
      const editor = quillRef.current.getEditor();
      const rect = editor.root.getBoundingClientRect();
      return {
        top: rect.top,
        left: rect.left,
        right: rect.right,
        bottom: rect.bottom,
      };
    }
    return null;
  }, []);

  // Handle Rewrite button click - emits event to parent
  const handleRewrite = useCallback(() => {
    const selectedText = getSelectedText();
    
    if (!selectedText || selectedText.trim().length === 0) {
      console.log('No text selected for rewrite');
      return;
    }

    if (quillRef.current && onRewriteClick) {
      const editor = quillRef.current.getEditor();
      const selection = editor.getSelection();
      const bounds = getEditorBounds();
      
      if (selection && bounds) {
        onRewriteClick({
          selectedText,
          editorBounds: bounds,
          selectionRange: { index: selection.index, length: selection.length },
        });
      }
    }
  }, [getSelectedText, getEditorBounds, onRewriteClick]);

  // Handle Sources button click - emits event to parent
  const handleSources = useCallback(() => {
    const selectedText = getSelectedText();
    const bounds = getEditorBounds();
    
    if (onSourcesClick && bounds) {
      onSourcesClick({
        selectedText,
        editorBounds: bounds,
      });
    }
  }, [getSelectedText, getEditorBounds, onSourcesClick]);

  useEffect(() => {
    // Apply editor content styles and setup custom handlers
    if (quillRef.current) {
      const editor = quillRef.current.getEditor();
      if (editor && editor.root) {
        const editorElement = editor.root;
        
        // Apply custom styles to match Figma
        editorElement.style.fontFamily = "'Poppins', sans-serif";
        editorElement.style.fontSize = '16px';
        editorElement.style.lineHeight = '23px';
        editorElement.style.fontWeight = '500';
        editorElement.style.color = '#000000';
        editorElement.style.padding = '0';
        editorElement.style.margin = '0';
        
        // Add custom highlight handler to toolbar
        const toolbar = editor.getModule('toolbar');
        if (toolbar) {
          toolbar.addHandler('background', function(this: any) {
            const selection = editor.getSelection();
            if (selection) {
              const format = editor.getFormat(selection);
              if (format.background) {
                // Remove highlight
                editor.format('background', false);
              } else {
                // Apply yellow highlight
                editor.format('background', '#ffeb3b'); // Standard yellow highlight color
              }
            }
          });
        }
        
        // Add Tab key handler for list indentation
        editorElement.addEventListener('keydown', (e: KeyboardEvent) => {
          if (e.key === 'Tab') {
            const selection = editor.getSelection();
            if (selection) {
              const format = editor.getFormat(selection);
              // Only handle Tab if we're in a list
              if (format.list) {
                e.preventDefault();
                if (e.shiftKey) {
                  // Outdent
                  editor.format('indent', '-1');
                } else {
                  // Indent
                  editor.format('indent', '+1');
                }
              }
            }
          }
        })
      }
    }
  }, []);

  // Add link hover tooltip functionality and hide Quill's default link preview
  useEffect(() => {
    if (quillRef.current) {
      const editor = quillRef.current.getEditor();
      if (editor && editor.root) {
        const editorElement = editor.root;
        
        const handleLinkMouseEnter = (e: MouseEvent) => {
          const target = e.target as HTMLElement;
          if (target.tagName === 'A') {
            const link = target as HTMLAnchorElement;
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
          }
        };
        
        const handleLinkMouseLeave = (e: MouseEvent) => {
          const target = e.target as HTMLElement;
          if (target.tagName === 'A') {
            setLinkTooltip(null);
          }
        };
        
        // Use event delegation for links
        editorElement.addEventListener('mouseover', handleLinkMouseEnter);
        editorElement.addEventListener('mouseout', handleLinkMouseLeave);
        
        // Hide Quill's default link preview tooltip (not editing mode)
        const hideQuillLinkTooltip = () => {
          const tooltips = document.querySelectorAll('.ql-bubble .ql-tooltip');
          tooltips.forEach((tooltip) => {
            const htmlTooltip = tooltip as HTMLElement;
            // Only hide if it's a link preview (has preview element) and NOT in editing mode
            if (htmlTooltip.querySelector('.ql-preview') && !htmlTooltip.classList.contains('ql-editing')) {
              htmlTooltip.style.display = 'none';
              htmlTooltip.style.visibility = 'hidden';
              htmlTooltip.style.opacity = '0';
            }
          });
        };
        
        // Remove browser's default tooltip (title attribute) from links in editor
        const removeBrowserTooltips = () => {
          const links = editorElement.querySelectorAll('a');
          links.forEach((link) => {
            const htmlLink = link as HTMLElement;
            // Remove title attribute to prevent browser tooltip
            htmlLink.removeAttribute('title');
            // Prevent default tooltip behavior
            htmlLink.addEventListener('mouseenter', (e) => {
              e.preventDefault();
            }, { capture: true });
          });
        };
        
        // Check periodically and on mutations
        const interval = setInterval(() => {
          hideQuillLinkTooltip();
          removeBrowserTooltips();
        }, 100);
        const observer = new MutationObserver(() => {
          hideQuillLinkTooltip();
          removeBrowserTooltips();
        });
        observer.observe(editorElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['title', 'href'] });
        
        return () => {
          editorElement.removeEventListener('mouseover', handleLinkMouseEnter);
          editorElement.removeEventListener('mouseout', handleLinkMouseLeave);
          clearInterval(interval);
          observer.disconnect();
        };
      }
    }
  }, [value]); // Re-attach when content changes

  // Inject custom buttons into Quill toolbar
  useEffect(() => {
    const injectCustomButtons = () => {
      const tooltips = document.querySelectorAll('.ql-tooltip:not(.ql-hidden)');
      tooltips.forEach((tooltip) => {
        const isEditing = tooltip.classList.contains('ql-editing');
        const customButtons = tooltip.querySelector('.custom-toolbar-buttons');
        
        // If link menu is open (editing mode), hide/remove custom buttons
        if (isEditing && customButtons) {
          (customButtons as HTMLElement).style.display = 'none';
          return;
        }
        
        // If not editing and buttons don't exist, create them
        if (!isEditing && !customButtons) {
          const formatsContainer = tooltip.querySelector('.ql-formats');
          if (!formatsContainer) return;

        // Create custom buttons container
        const customContainer = document.createElement('div');
        customContainer.className = 'custom-toolbar-buttons';
        customContainer.style.cssText = 'display: flex; align-items: center; gap: 2px; overflow: visible;';

        // Rewrite button
        const rewriteBtn = document.createElement('button');
        rewriteBtn.type = 'button';
        rewriteBtn.className = 'custom-toolbar-btn';
        rewriteBtn.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style="overflow: visible; display: block;">
            <mask id="mask_rewrite_${Date.now()}" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20">
              <rect width="20" height="20" fill="#D9D9D9"/>
            </mask>
            <g mask="url(#mask_rewrite_${Date.now()})">
              <path d="M5.5 16H6.5625L14.375 8.1875L13.3125 7.125L5.5 14.9375V16ZM4 17.5V14.3125L14.375 3.9375C14.5278 3.78472 14.6933 3.67361 14.8716 3.60417C15.0499 3.53472 15.2374 3.5 15.4341 3.5C15.6308 3.5 15.8194 3.53472 16 3.60417C16.1806 3.67361 16.3472 3.78472 16.5 3.9375L17.5625 5C17.7153 5.15278 17.8264 5.31944 17.8958 5.5C17.9653 5.68056 18 5.86487 18 6.05296C18 6.25357 17.9651 6.44478 17.8954 6.62658C17.8256 6.8084 17.7147 6.97454 17.5625 7.125L7.1875 17.5H4ZM13.8344 7.66556L13.3125 7.125L14.375 8.1875L13.8344 7.66556Z" fill="currentColor"/>
              <path d="M6 2.5C6 4.70914 4.20914 6.5 2 6.5C4.20914 6.5 6 8.29086 6 10.5C6 8.29086 7.79086 6.5 10 6.5C7.79086 6.5 6 4.70914 6 2.5Z" fill="currentColor"/>
            </g>
          </svg>
          <span>Rewrite</span>
        `;
        rewriteBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          handleRewrite();
        });

        // Sources button
        const sourcesBtn = document.createElement('button');
        sourcesBtn.type = 'button';
        sourcesBtn.className = 'custom-toolbar-btn';
        sourcesBtn.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <mask id="mask_sources_${Date.now()}" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20">
              <rect width="20" height="20" fill="#D9D9D9"/>
            </mask>
            <g mask="url(#mask_sources_${Date.now()})">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M14.5 2.5C14.9125 2.5 15.2658 2.64668 15.5596 2.94043C15.8533 3.23418 16 3.5875 16 4V8.91602C15.5329 8.71192 15.0286 8.57689 14.5 8.52441V8H3.5V11H9.6709C9.40521 11.4591 9.20949 11.9636 9.10059 12.5H3.5V15H9.22852C9.40014 15.5465 9.66365 16.0523 10 16.5H3.5C3.09722 16.5 2.74685 16.3504 2.44824 16.0518C2.14963 15.7531 2 15.4028 2 15V4C2 3.5875 2.14963 3.23418 2.44824 2.94043C2.7468 2.64685 3.09734 2.5 3.5 2.5H14.5ZM3.5 6.5H14.5V4H3.5V6.5Z" fill="currentColor"/>
              <path d="M14 9.5C14 11.7091 12.2091 13.5 10 13.5C12.2091 13.5 14 15.2909 14 17.5C14 15.2909 15.7909 13.5 18 13.5C15.7909 13.5 14 11.7091 14 9.5Z" fill="currentColor"/>
            </g>
          </svg>
          <span>Sources</span>
        `;
        sourcesBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          handleSources();
        });

        // Separator
        const separator = document.createElement('div');
        separator.className = 'custom-toolbar-separator';

        // Add buttons to container
        customContainer.appendChild(rewriteBtn);
        customContainer.appendChild(sourcesBtn);
        customContainer.appendChild(separator);

          // Insert before the formats container - use parent node if needed
          const parent = formatsContainer.parentNode;
          if (parent) {
            parent.insertBefore(customContainer, formatsContainer);
          } else {
            // Fallback: prepend to tooltip
            tooltip.prepend(customContainer);
          }
        } else if (!isEditing && customButtons) {
          // Show buttons again when not in editing mode
          (customButtons as HTMLElement).style.display = 'flex';
        }
      });
    };

    // Custom SVG icons (inline content from assets) - with 64% opacity
    const customIcons = {
      bold: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><mask id="mask0_bold_${Date.now()}" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="2" y="2" width="20" height="20"><rect x="2" y="2" width="20" height="20" fill="#D9D9D9"/></mask><g mask="url(#mask0_bold_${Date.now()})"><path d="M7.66797 17.8337V6.16699H12.2721C13.1749 6.16699 14.0082 6.44477 14.7721 7.00033C15.536 7.55588 15.918 8.32671 15.918 9.31283C15.918 10.0212 15.7582 10.5663 15.4388 10.9482C15.1194 11.3302 14.8207 11.6045 14.543 11.7712C14.8902 11.9239 15.2756 12.2087 15.6992 12.6253C16.1228 13.042 16.3346 13.667 16.3346 14.5003C16.3346 15.7364 15.8832 16.601 14.9805 17.0941C14.0777 17.5871 13.2305 17.8337 12.4388 17.8337H7.66797ZM10.1888 15.5003H12.3555C13.0221 15.5003 13.4284 15.3302 13.5742 14.9899C13.7201 14.6496 13.793 14.4031 13.793 14.2503C13.793 14.0975 13.7201 13.851 13.5742 13.5107C13.4284 13.1705 13.0013 13.0003 12.293 13.0003H10.1888V15.5003ZM10.1888 10.7503H12.1263C12.5846 10.7503 12.918 10.6323 13.1263 10.3962C13.3346 10.16 13.4388 9.89616 13.4388 9.60449C13.4388 9.27116 13.3207 9.00033 13.0846 8.79199C12.8485 8.58366 12.543 8.47949 12.168 8.47949H10.1888V10.7503Z" fill="currentColor"/></g></svg>`,
      italic: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><mask id="mask0_italic_${Date.now()}" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="2" y="2" width="20" height="20"><rect x="2" y="2" width="20" height="20" fill="#D9D9D9"/></mask><g mask="url(#mask0_italic_${Date.now()})"><path d="M6.58203 17.8337V15.7503H9.91536L12.4154 8.25033H9.08203V6.16699H17.4154V8.25033H14.4987L11.9987 15.7503H14.9154V17.8337H6.58203Z" fill="currentColor"/></g></svg>`,
      underline: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><mask id="mask0_underline_${Date.now()}" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="2" y="2" width="20" height="20"><rect x="2" y="2" width="20" height="20" fill="#D9D9D9"/></mask><g mask="url(#mask0_underline_${Date.now()})"><path d="M6.16797 19.5V17.8333H17.8346V19.5H6.16797ZM12.0013 16.1667C10.5985 16.1667 9.50825 15.7292 8.73047 14.8542C7.95269 13.9792 7.5638 12.8194 7.5638 11.375V4.5H9.70964V11.5C9.70964 12.2778 9.90408 12.9097 10.293 13.3958C10.6819 13.8819 11.2513 14.125 12.0013 14.125C12.7513 14.125 13.3207 13.8819 13.7096 13.3958C14.0985 12.9097 14.293 12.2778 14.293 11.5V4.5H16.4388V11.375C16.4388 12.8194 16.0499 13.9792 15.2721 14.8542C14.4944 15.7292 13.4041 16.1667 12.0013 16.1667Z" fill="currentColor"/></g></svg>`,
      highlight: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><mask id="mask0_highlight_${Date.now()}" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="2" y="2" width="20" height="20"><path d="M2 2H22V22H2V2Z" fill="#D9D9D9"/></mask><g mask="url(#mask0_highlight_${Date.now()})"><path d="M4.15625 20.309L4.15631 18.6914H19.823L19.8229 20.309H4.15625ZM13.6563 12.0247L11.4896 9.85807L8.15631 13.1914L10.3021 15.3581L13.6563 12.0247ZM12.6771 8.69141L14.823 10.8372L18.1563 7.52474L15.9896 5.35807L12.6771 8.69141ZM10.9271 8.08724L15.4271 12.5872L11.4896 16.5456C11.1563 16.8789 10.7639 17.0456 10.3126 17.0456C9.86117 17.0456 9.46881 16.8789 9.13547 16.5456L8.57297 17.0247H4.40631L7.03131 14.4206C6.69797 14.0872 6.52436 13.6879 6.51047 13.2227C6.49658 12.7574 6.65631 12.3581 6.98964 12.0247L10.9271 8.08724ZM10.9271 8.08724L14.823 4.19141C15.1563 3.85807 15.5487 3.69141 16.0001 3.69141C16.4514 3.69141 16.8438 3.85807 17.1771 4.19141L19.3438 6.33724C19.6771 6.67057 19.8438 7.06293 19.8438 7.51432C19.8438 7.96571 19.6771 8.35807 19.3438 8.69141L15.4271 12.5872L10.9271 8.08724Z" fill="currentColor"/></g></svg>`,
      link: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><mask id="mask0_link_${Date.now()}" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#D9D9D9"/></mask><g mask="url(#mask0_link_${Date.now()})"><path d="M10.7984 16.8002H7.19844C5.87044 16.8002 4.73844 16.3316 3.80244 15.3944C2.86644 14.4574 2.39844 13.3241 2.39844 11.9944C2.39844 10.6649 2.86644 9.53353 3.80244 8.6002C4.73844 7.66686 5.87044 7.2002 7.19844 7.2002H10.7984V9.0002H7.19844C6.3651 9.0002 5.65677 9.29186 5.07344 9.8752C4.4901 10.4585 4.19844 11.1669 4.19844 12.0002C4.19844 12.8335 4.4901 13.5419 5.07344 14.1252C5.65677 14.7085 6.3651 15.0002 7.19844 15.0002H10.7984V16.8002ZM8.39844 12.9002V11.1002H15.5984V12.9002H8.39844ZM13.1984 16.8002V15.0002H16.7984C17.6318 15.0002 18.3401 14.7085 18.9234 14.1252C19.5068 13.5419 19.7984 12.8335 19.7984 12.0002C19.7984 11.1669 19.5068 10.4585 18.9234 9.8752C18.3401 9.29186 17.6318 9.0002 16.7984 9.0002H13.1984V7.2002H16.7984C18.1264 7.2002 19.2584 7.66878 20.1944 8.60594C21.1304 9.54295 21.5984 10.6763 21.5984 12.0059C21.5984 13.3354 21.1304 14.4669 20.1944 15.4002C19.2584 16.3335 18.1264 16.8002 16.7984 16.8002H13.1984Z" fill="currentColor"/></g></svg>`,
      numeric: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><mask id="mask0_numeric_${Date.now()}" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="2" y="2" width="20" height="20"><path d="M2 2H22V22H2V2Z" fill="#D9D9D9"/></mask><g mask="url(#mask0_numeric_${Date.now()})"><path d="M2.63281 22V20.5H5.13281V19.75H3.63281V18.25H5.13281V17.5H2.63281V16H5.63281C5.91615 16 6.15365 16.0958 6.34531 16.2875C6.53698 16.4792 6.63281 16.7167 6.63281 17V18C6.63281 18.2833 6.53698 18.5208 6.34531 18.7125C6.15365 18.9042 5.91615 19 5.63281 19C5.91615 19 6.15365 19.0958 6.34531 19.2875C6.53698 19.4792 6.63281 19.7167 6.63281 20V21C6.63281 21.2833 6.53698 21.5208 6.34531 21.7125C6.15365 21.9042 5.91615 22 5.63281 22H2.63281ZM2.63281 15V12.25C2.63281 11.9667 2.72865 11.7292 2.92031 11.5375C3.11198 11.3458 3.34948 11.25 3.63281 11.25H5.13281V10.5H2.63281V9H5.63281C5.91615 9 6.15365 9.09583 6.34531 9.2875C6.53698 9.47917 6.63281 9.71667 6.63281 10V11.75C6.63281 12.0333 6.53698 12.2708 6.34531 12.4625C6.15365 12.6542 5.91615 12.75 5.63281 12.75H4.13281V13.5H6.63281V15H2.63281ZM4.13281 8V3.5H2.63281V2H5.63281V8H4.13281ZM8.63281 19V17H20.6328V19H8.63281ZM8.63281 13V11H20.6328V13H8.63281ZM8.63281 7V5H20.6328V7H8.63281Z" fill="currentColor"/></g></svg>`,
      bullet: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><mask id="mask0_bullet_${Date.now()}" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="2" y="2" width="20" height="20"><path d="M2 2H22V22H2V2Z" fill="#D9D9D9"/></mask><g mask="url(#mask0_bullet_${Date.now()})"><mask id="mask1_bullet_${Date.now()}" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="2" y="2" width="20" height="20"><rect x="2" y="2" width="20" height="20" fill="#D9D9D9"/></mask><g mask="url(#mask1_bullet_${Date.now()})"><path d="M9.5 17.833V16.1663H19.5V17.833H9.5ZM9.5 12.833V11.1663H19.5V12.833H9.5ZM9.5 7.83301V6.16634H19.5V7.83301H9.5ZM6.16667 18.6663C5.70833 18.6663 5.31597 18.5031 4.98958 18.1768C4.66319 17.8504 4.5 17.458 4.5 16.9997C4.5 16.5413 4.66319 16.149 4.98958 15.8226C5.31597 15.4962 5.70833 15.333 6.16667 15.333C6.625 15.333 7.01736 15.4962 7.34375 15.8226C7.67014 16.149 7.83333 16.5413 7.83333 16.9997C7.83333 17.458 7.67014 17.8504 7.34375 18.1768C7.01736 18.5031 6.625 18.6663 6.16667 18.6663ZM6.16667 13.6663C5.70833 13.6663 5.31597 13.5031 4.98958 13.1768C4.66319 12.8504 4.5 12.458 4.5 11.9997C4.5 11.5413 4.66319 11.149 4.98958 10.8226C5.31597 10.4962 5.70833 10.333 6.16667 10.333C6.625 10.333 7.01736 10.4962 7.34375 10.8226C7.67014 11.149 7.83333 11.5413 7.83333 11.9997C7.83333 12.458 7.67014 12.8504 7.34375 13.1768C7.01736 13.5031 6.625 13.6663 6.16667 13.6663ZM6.16667 8.66634C5.70833 8.66634 5.31597 8.50315 4.98958 8.17676C4.66319 7.85037 4.5 7.45801 4.5 6.99967C4.5 6.54134 4.66319 6.14898 4.98958 5.82259C5.31597 5.4962 5.70833 5.33301 6.16667 5.33301C6.625 5.33301 7.01736 5.4962 7.34375 5.82259C7.67014 6.14898 7.83333 6.54134 7.83333 6.99967C7.83333 7.45801 7.67014 7.85037 7.34375 8.17676C7.01736 8.50315 6.625 8.66634 6.16667 8.66634Z" fill="currentColor"/></g></g></svg>`,
    };

    // Replace Quill's default formatting icons with custom SVGs
    const replaceFormattingIcons = () => {
      const tooltips = document.querySelectorAll('.ql-tooltip:not(.ql-hidden):not(.ql-editing)');
      tooltips.forEach((tooltip) => {
        // Replace Bold icon
        const boldBtn = tooltip.querySelector('button.ql-bold');
        if (boldBtn && !boldBtn.hasAttribute('data-icon-replaced')) {
          const svg = boldBtn.querySelector('svg');
          if (svg) {
            svg.outerHTML = customIcons.bold;
            boldBtn.setAttribute('data-icon-replaced', 'true');
          }
        }

        // Replace Italic icon
        const italicBtn = tooltip.querySelector('button.ql-italic');
        if (italicBtn && !italicBtn.hasAttribute('data-icon-replaced')) {
          const svg = italicBtn.querySelector('svg');
          if (svg) {
            svg.outerHTML = customIcons.italic;
            italicBtn.setAttribute('data-icon-replaced', 'true');
          }
        }

        // Replace Underline icon
        const underlineBtn = tooltip.querySelector('button.ql-underline');
        if (underlineBtn && !underlineBtn.hasAttribute('data-icon-replaced')) {
          const svg = underlineBtn.querySelector('svg');
          if (svg) {
            svg.outerHTML = customIcons.underline;
            underlineBtn.setAttribute('data-icon-replaced', 'true');
          }
        }

        // Replace Background/Highlight icon - now a simple toggle button
        const backgroundBtn = tooltip.querySelector('button.ql-background') as HTMLElement | null;
        if (backgroundBtn && !backgroundBtn.hasAttribute('data-icon-replaced')) {
          // Find the SVG
          const svg = backgroundBtn.querySelector('svg') as SVGSVGElement | null;
          if (svg) {
            svg.outerHTML = customIcons.highlight;
            backgroundBtn.setAttribute('data-icon-replaced', 'true');
          } else {
            // If no SVG exists, create one and replace
            const tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            backgroundBtn.appendChild(tempSvg);
            tempSvg.outerHTML = customIcons.highlight;
            backgroundBtn.setAttribute('data-icon-replaced', 'true');
          }
        }

        // Replace Link icon
        const linkBtn = tooltip.querySelector('button.ql-link');
        if (linkBtn && !linkBtn.hasAttribute('data-icon-replaced')) {
          const svg = linkBtn.querySelector('svg');
          if (svg) {
            svg.outerHTML = customIcons.link;
            linkBtn.setAttribute('data-icon-replaced', 'true');
          }
        }

        // Replace List icons
        const listBtns = tooltip.querySelectorAll('button.ql-list');
        listBtns.forEach((btn) => {
          if (!btn.hasAttribute('data-icon-replaced')) {
            const svg = btn.querySelector('svg');
            if (svg) {
              const value = btn.getAttribute('value');
              if (value === 'ordered') {
                svg.outerHTML = customIcons.numeric;
              } else if (value === 'bullet') {
                svg.outerHTML = customIcons.bullet;
              }
              btn.setAttribute('data-icon-replaced', 'true');
            }
          }
        });
      });
    };

    // Check periodically for tooltip appearance
    const interval = setInterval(() => {
      injectCustomButtons();
      replaceFormattingIcons();
    }, 100);
    return () => clearInterval(interval);
  }, [handleRewrite, handleSources]);

  const handleChange = (content: string) => {
    onChange(content);
  };

  return (
    <div 
      className={`quill-editor-wrapper ${className}`}
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #d6d6d6', // grey-scale-300
        borderRadius: '16px',
        padding: '24px',
        width: '100%',
        height: '458px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'visible', // Allow toolbar to overflow
        position: 'relative', // Establish positioning context
        ...style, // Merge with any additional styles passed as prop
      }}
    >
      <style>{`
        /* Editor content styles only - no toolbar CSS */
        .quill-editor-wrapper .ql-container {
          font-family: 'Poppins', sans-serif !important;
          font-size: 16px !important;
          line-height: 23px !important;
          font-weight: 500 !important;
          color: #000000 !important;
          border: none !important;
          height: 100% !important;
          width: 100% !important;
          display: flex !important;
          flex-direction: column !important;
          overflow: visible !important; /* Allow toolbar to overflow */
          flex: 1 !important; /* Fill available space */
        }
        .quill-editor-wrapper .ql-editor {
          padding: 0 !important;
          margin: 0 !important;
          min-height: auto !important;
          font-family: 'Poppins', sans-serif !important;
          font-size: 16px !important;
          line-height: 23px !important;
          font-weight: 500 !important;
          color: #000000 !important;
          border: none !important;
          outline: none !important;
          flex: 1 !important;
          overflow-y: auto !important; /* Editor content scrolls internally */
          height: 100% !important;
        }
        /* Toolbar styles are handled globally in index.css */
        /* Hide toolbar when it has ql-hidden class (no selection) */
        .ql-bubble .ql-tooltip.ql-hidden {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
        }
        .quill-editor-wrapper .ql-editor:focus {
          outline: none !important;
        }
        /* Placeholder styling only */
        .quill-editor-wrapper .ql-editor.ql-blank::before {
          font-family: 'Poppins', sans-serif !important;
          font-size: 16px !important;
          line-height: 23px !important;
          font-style: normal !important;
          font-weight: 500 !important;
          color: rgba(0, 0, 0, 0.4) !important;
          left: 0 !important;
          right: 0 !important;
        }
        /* Base list styling - allow Quill's indent classes to work for nested bullets */
        .quill-editor-wrapper .ql-editor ul,
        .quill-editor-wrapper .ql-editor ol {
          padding-left: 1.5em !important;
          margin-left: 0 !important;
        }
        /* Nested list items use Quill's .ql-indent-X classes for indentation */
        .quill-editor-wrapper .ql-editor li:not([class*="ql-indent"]) {
          padding-left: 0 !important;
        }
        .quill-editor-wrapper .ql-editor li.ql-indent-1 {
          padding-left: 1.5em !important;
        }
        .quill-editor-wrapper .ql-editor li.ql-indent-2 {
          padding-left: 3em !important;
        }
        .quill-editor-wrapper .ql-editor li.ql-indent-3 {
          padding-left: 4.5em !important;
        }
        .quill-editor-wrapper .ql-editor li.ql-indent-4 {
          padding-left: 6em !important;
        }
        .quill-editor-wrapper .ql-editor li.ql-indent-5 {
          padding-left: 7.5em !important;
        }
        /* Ensure all formatting displays correctly */
        /* Ensure bold text is visible */
        .quill-editor-wrapper .ql-editor strong,
        .quill-editor-wrapper .ql-editor b {
          font-weight: 700 !important;
        }
        /* Ensure italic text is visible */
        .quill-editor-wrapper .ql-editor em,
        .quill-editor-wrapper .ql-editor i {
          font-style: italic !important;
        }
        /* Ensure underline is visible */
        .quill-editor-wrapper .ql-editor u {
          text-decoration: underline !important;
        }
        /* Ensure links are visible */
        .quill-editor-wrapper .ql-editor a {
          color: #0068bc !important;
          text-decoration: underline !important;
        }
      `}</style>
      <ReactQuill
        ref={quillRef}
        theme="bubble"
        value={value}
        onChange={handleChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        readOnly={readOnly}
        bounds={editorBounds}
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      />
      
      {/* Link hover tooltip */}
      {linkTooltip && <EditorLinkTooltip url={linkTooltip.url} position={linkTooltip.position} />}
    </div>
  );
});

// Display name for debugging
QuillEditor.displayName = 'QuillEditor';

export default QuillEditor;
