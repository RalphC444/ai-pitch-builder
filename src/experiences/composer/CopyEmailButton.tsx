import React, { useEffect, useRef, useState } from 'react';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import { useToast } from '../../components/toast';
import { ElevatedIconButton } from '../../components/buttons/ElevatedIconButton';

interface CopyEmailButtonProps {
  /** The rendered email body to copy */
  getContent: () => HTMLElement | null;
}

/** Copy as rich text where the browser allows it, with plain text alongside */
const copyElement = async (element: HTMLElement) => {
  const html = element.innerHTML;
  // innerText adds a blank line per empty paragraph - keep at most one
  const text = element.innerText.replace(/\n{3,}/g, '\n\n').trim();
  if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([text], { type: 'text/plain' }),
      }),
    ]);
    return;
  }
  await navigator.clipboard.writeText(text);
};

/**
 * CopyEmailButton
 *
 * Floating copy icon for the email preview (like the copy button on code
 * blocks): copies the email body, then shows a check for a moment.
 */
export const CopyEmailButton: React.FC<CopyEmailButtonProps> = ({ getContent }) => {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const handleCopy = async () => {
    const element = getContent();
    if (!element) return;
    try {
      await copyElement(element);
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("Couldn't copy - select the email text and copy it instead");
    }
  };

  return (
    <ElevatedIconButton
      label={copied ? 'Email copied' : 'Copy email'}
      icon={copied ? <CheckRoundedIcon fontSize="small" /> : <ContentCopyRoundedIcon fontSize="small" />}
      onClick={handleCopy}
      isDone={copied}
      tooltipPlacement="left"
    />
  );
};

export default CopyEmailButton;
