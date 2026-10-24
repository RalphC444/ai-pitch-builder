/**
 * Extra content blocks a Project Manager can add to the email, between the
 * advisor pitches and the closing message.
 */

export type BlockType = 'text' | 'heading' | 'bulleted' | 'callout' | 'divider';

export interface ContentBlock {
  id: string;
  type: BlockType;
  /** Rich text HTML (plain text for headings, empty for dividers) */
  html: string;
}

export const BLOCK_TYPES: Array<{ type: BlockType; label: string; description: string }> = [
  { type: 'text', label: 'Text', description: 'Just start writing' },
  { type: 'heading', label: 'Heading', description: 'A section title' },
  { type: 'bulleted', label: 'Bulleted list', description: 'A simple list' },
  { type: 'callout', label: 'Callout', description: 'Make a point stand out' },
  { type: 'divider', label: 'Divider', description: 'Separate sections' },
];

const EMPTY_HTML: Record<BlockType, string> = {
  text: '',
  heading: '',
  bulleted: '<ul><li><br></li></ul>',
  callout: '',
  divider: '',
};

let blockCount = 0;

export const createBlock = (type: BlockType): ContentBlock => {
  blockCount += 1;
  return { id: `block-${Date.now()}-${blockCount}`, type, html: EMPTY_HTML[type] };
};

/** Turn a block into another type, keeping its text where that makes sense */
export const convertBlock = (block: ContentBlock, type: BlockType): ContentBlock => {
  if (type === 'divider') return { ...block, type, html: '' };
  const text = block.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (type === 'bulleted') return { ...block, type, html: `<ul><li>${text || '<br>'}</li></ul>` };
  return { ...block, type, html: text };
};

export const escapeHtml = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
