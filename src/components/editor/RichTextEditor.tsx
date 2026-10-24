import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import IconButton from '@mui/material/IconButton';
import FormatBoldRoundedIcon from '@mui/icons-material/FormatBoldRounded';
import FormatItalicRoundedIcon from '@mui/icons-material/FormatItalicRounded';
import FormatUnderlinedRoundedIcon from '@mui/icons-material/FormatUnderlinedRounded';
import InsertLinkRoundedIcon from '@mui/icons-material/InsertLinkRounded';

export interface RichTextEditorHandle {
  /** The editable element */
  element: HTMLDivElement | null;
  focus: () => void;
  /** Append HTML at the end of the content */
  appendHtml: (html: string) => void;
}

interface RichTextEditorProps {
  /** HTML content. Only pushed into the editor when it differs from what the user typed. */
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  /** Minimum height of the editable area */
  minHeight?: string;
  /** Extra toolbar controls after the format buttons (AI, translate...) */
  toolbarExtras?: React.ReactNode;
  /** Right-aligned toolbar content (e.g. "Show Profile Data") */
  toolbarEnd?: React.ReactNode;
  /** Typography of the editable area */
  fontSize?: string;
  lineHeight?: string;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  onBlur?: () => void;
  'aria-label'?: string;
  className?: string;
}

const FORMAT_BUTTONS = [
  { command: 'bold', Icon: FormatBoldRoundedIcon, label: 'Bold' },
  { command: 'italic', Icon: FormatItalicRoundedIcon, label: 'Italic' },
  { command: 'underline', Icon: FormatUnderlinedRoundedIcon, label: 'Underline' },
  { command: 'createLink', Icon: InsertLinkRoundedIcon, label: 'Insert link' },
];

/**
 * RichTextEditor Component
 *
 * contentEditable editor with a fixed top toolbar (Bold, Italic, Underline, Link + extras),
 * matching the Lexical-style editor in the Unified Email Experience Figma.
 */
export const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(({
  value,
  onChange,
  placeholder,
  minHeight = '160px',
  toolbarExtras,
  toolbarEnd,
  fontSize = '14px',
  lineHeight = '20px',
  onClick,
  onBlur,
  'aria-label': ariaLabel,
  className = '',
}, ref) => {
  const editorRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    element: editorRef.current,
    focus: () => editorRef.current?.focus(),
    appendHtml: (html: string) => {
      if (!editorRef.current) return;
      editorRef.current.insertAdjacentHTML('beforeend', html);
      onChange(editorRef.current.innerHTML);
    },
  }));

  // Sync external value without clobbering the caret while typing
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const runCommand = (command: string) => {
    editorRef.current?.focus();
    if (command === 'createLink') {
      const url = window.prompt('Link URL');
      if (!url) return;
      document.execCommand('createLink', false, url);
    } else {
      document.execCommand(command);
    }
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  return (
    <div className={`flex flex-col min-w-0 ${className}`}>
      {/* Toolbar */}
      <div
        className="flex items-center gap-[3px] px-2 bg-white flex-wrap"
        style={{ minHeight: '41px', border: '1px solid #d6d6d6', borderTopLeftRadius: '10px', borderTopRightRadius: '10px' }}
        role="toolbar"
        aria-label="Formatting"
      >
        {FORMAT_BUTTONS.map((button) => (
          <IconButton
            key={button.command}
            onMouseDown={(event) => event.preventDefault()} // Keep the text selection
            onClick={() => runCommand(button.command)}
            aria-label={button.label}
            title={button.label}
            size="small"
            sx={{ borderRadius: '10px', width: 34, height: 36 }}
          >
            <button.Icon sx={{ fontSize: 20 }} />
          </IconButton>
        ))}
        {toolbarExtras && (
          <>
            <div className="h-6 w-px mx-1" style={{ backgroundColor: '#eeeeee' }} aria-hidden="true" />
            {toolbarExtras}
          </>
        )}
        {toolbarEnd && <div className="ml-auto pl-2">{toolbarEnd}</div>}
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        className="rich-text-editor bg-white focus:outline-none overflow-y-auto"
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label={ariaLabel}
        data-placeholder={placeholder}
        onInput={(event) => onChange((event.target as HTMLDivElement).innerHTML)}
        onClick={onClick}
        onBlur={onBlur}
        style={{
          minHeight,
          padding: '15px',
          border: '1px solid #d6d6d6',
          borderTop: 'none',
          borderBottomLeftRadius: '10px',
          borderBottomRightRadius: '10px',
          fontFamily: "'Poppins', sans-serif",
          fontSize,
          lineHeight,
          fontWeight: 500,
          color: '#000000',
        }}
      />
    </div>
  );
});

RichTextEditor.displayName = 'RichTextEditor';

export default RichTextEditor;
