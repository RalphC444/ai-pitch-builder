import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListSubheader from '@mui/material/ListSubheader';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DragIndicatorRoundedIcon from '@mui/icons-material/DragIndicatorRounded';
import NotesRoundedIcon from '@mui/icons-material/NotesRounded';
import TitleRoundedIcon from '@mui/icons-material/TitleRounded';
import FormatListBulletedRoundedIcon from '@mui/icons-material/FormatListBulletedRounded';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import HorizontalRuleRoundedIcon from '@mui/icons-material/HorizontalRuleRounded';
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import type { SvgIconComponent } from '@mui/icons-material';
import { BLOCK_TYPES, BlockType, ContentBlock, convertBlock, createBlock } from '../../data/contentBlocks';

interface ContentBlocksProps {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
}

const font = "'Poppins', sans-serif";

const BLOCK_ICONS: Record<BlockType, SvgIconComponent> = {
  text: NotesRoundedIcon,
  heading: TitleRoundedIcon,
  bulleted: FormatListBulletedRoundedIcon,
  callout: LightbulbOutlinedIcon,
  divider: HorizontalRuleRoundedIcon,
};

const PLACEHOLDERS: Partial<Record<BlockType, string>> = {
  text: "Type '/' for blocks",
  heading: 'Heading',
  callout: 'Write a callout',
};

/** Which menu is open: add a block after an index, or a block's own actions */
type MenuState =
  | { kind: 'add'; anchor: HTMLElement; afterIndex: number; replaceId?: string }
  | { kind: 'block'; anchor: HTMLElement; id: string };

const isEmptyHtml = (html: string) => html.replace(/<br\s*\/?>/g, '').replace(/<[^>]+>/g, '').trim() === '';

/** contentEditable that only writes its HTML from props when it changes from outside (keeps the caret) */
const Editable: React.FC<{
  html: string;
  onChange: (html: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  onKeyDown?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  elementRef: (element: HTMLDivElement | null) => void;
  ariaLabel: string;
}> = ({ html, onChange, placeholder, style, onKeyDown, elementRef, ariaLabel }) => {
  const ref = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (ref.current && ref.current.innerHTML !== html) ref.current.innerHTML = html;
  }, [html]);

  return (
    <div
      ref={(element) => {
        ref.current = element;
        elementRef(element);
      }}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-multiline="true"
      aria-label={ariaLabel}
      data-placeholder={placeholder}
      className="content-block-editable outline-none min-w-0 flex-1"
      style={style}
      onInput={(event) => onChange(event.currentTarget.innerHTML)}
      onKeyDown={onKeyDown}
    />
  );
};

/**
 * ContentBlocks
 *
 * Notion-style blocks for the email: hover a block for + (add below) and the
 * drag handle (reorder, turn into, duplicate, delete). Type "/" in an empty
 * block to pick a block type; Enter starts a new block; Backspace on an empty
 * block removes it.
 */
export const ContentBlocks: React.FC<ContentBlocksProps> = ({ blocks, onChange }) => {
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const editorRefs = useRef(new Map<string, HTMLDivElement>());
  const rowRefs = useRef(new Map<string, HTMLDivElement>());

  // Focus a block once it has rendered (new block, or after a delete)
  useEffect(() => {
    if (!focusId) return;
    const element = editorRefs.current.get(focusId);
    if (element) {
      element.focus();
      const range = document.createRange();
      range.selectNodeContents(element);
      range.collapse(false);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
    setFocusId(null);
  }, [focusId, blocks]);

  const update = (id: string, changes: Partial<ContentBlock>) =>
    onChange(blocks.map((block) => (block.id === id ? { ...block, ...changes } : block)));

  const insertAt = (index: number, type: BlockType) => {
    const block = createBlock(type);
    const next = [...blocks];
    next.splice(index, 0, block);
    onChange(next);
    if (type !== 'divider') setFocusId(block.id);
  };

  const remove = (id: string, focusPrevious = false) => {
    const index = blocks.findIndex((block) => block.id === id);
    onChange(blocks.filter((block) => block.id !== id));
    const previous = blocks.slice(0, index).reverse().find((block) => block.type !== 'divider');
    if (focusPrevious && previous) setFocusId(previous.id);
  };

  const move = (id: string, toIndex: number) => {
    const from = blocks.findIndex((block) => block.id === id);
    if (from < 0) return;
    const next = [...blocks];
    const [block] = next.splice(from, 1);
    next.splice(Math.max(0, Math.min(next.length, toIndex > from ? toIndex - 1 : toIndex)), 0, block);
    onChange(next);
  };

  const chooseType = (type: BlockType) => {
    if (!menu || menu.kind !== 'add') return;
    if (menu.replaceId) {
      // "/" in an empty block turns that block into the chosen type
      const block = blocks.find((item) => item.id === menu.replaceId);
      if (block) {
        update(block.id, convertBlock({ ...block, html: '' }, type));
        if (type !== 'divider') setFocusId(block.id);
      }
    } else {
      insertAt(menu.afterIndex + 1, type);
    }
    setMenu(null);
  };

  const handleKeyDown = (block: ContentBlock, index: number) => (event: React.KeyboardEvent<HTMLDivElement>) => {
    const empty = isEmptyHtml(event.currentTarget.innerHTML);
    if (event.key === '/' && empty && block.type !== 'bulleted') {
      event.preventDefault();
      setMenu({ kind: 'add', anchor: event.currentTarget, afterIndex: index, replaceId: block.id });
    } else if (event.key === 'Enter' && !event.shiftKey && block.type !== 'bulleted') {
      event.preventDefault();
      insertAt(index + 1, 'text');
    } else if (event.key === 'Backspace' && empty) {
      event.preventDefault();
      remove(block.id, true);
    }
  };

  const renderEditor = (block: ContentBlock, index: number) => {
    const shared = {
      html: block.html,
      onChange: (html: string) => update(block.id, { html }),
      onKeyDown: handleKeyDown(block, index),
      elementRef: (element: HTMLDivElement | null) => {
        if (element) editorRefs.current.set(block.id, element);
        else editorRefs.current.delete(block.id);
      },
      placeholder: PLACEHOLDERS[block.type],
      ariaLabel: `${BLOCK_TYPES.find((item) => item.type === block.type)?.label} block`,
    };
    switch (block.type) {
      case 'heading':
        return <Editable {...shared} style={{ fontSize: '20px', lineHeight: '28px', fontWeight: 600, color: '#000000' }} />;
      case 'bulleted':
        return <Editable {...shared} style={{ fontSize: '14px', lineHeight: '24px', color: '#1c2024' }} />;
      case 'callout':
        return (
          <div className="flex items-start gap-2.5 flex-1 min-w-0 rounded-lg px-3 py-2.5" style={{ backgroundColor: '#fff8db' }}>
            <LightbulbOutlinedIcon sx={{ fontSize: 20, color: '#8a6d00', mt: '2px' }} />
            <Editable {...shared} style={{ fontSize: '14px', lineHeight: '24px', color: '#1c2024' }} />
          </div>
        );
      case 'divider':
        return (
          <div
            ref={(element) => {
              if (element) editorRefs.current.set(block.id, element);
            }}
            tabIndex={0}
            role="separator"
            aria-label="Divider block - Backspace to remove"
            className="flex-1 py-3 outline-none rounded focus-visible:ring-2 focus-visible:ring-[#0068bc]/40"
            onKeyDown={(event) => {
              if (event.key === 'Backspace' || event.key === 'Delete') remove(block.id, true);
            }}
          >
            <div className="h-px w-full" style={{ backgroundColor: '#d5d5d5' }} />
          </div>
        );
      default:
        return <Editable {...shared} style={{ fontSize: '14px', lineHeight: '24px', color: '#1c2024' }} />;
    }
  };

  const blockMenuBlock = menu?.kind === 'block' ? blocks.find((block) => block.id === menu.id) : undefined;
  const blockMenuIndex = blockMenuBlock ? blocks.indexOf(blockMenuBlock) : -1;

  return (
    <div className="flex flex-col" style={{ fontFamily: font }}>
      {blocks.map((block, index) => (
        <div
          key={block.id}
          ref={(element) => {
            if (element) rowRefs.current.set(block.id, element);
            else rowRefs.current.delete(block.id);
          }}
          className="content-block-row group relative flex items-start gap-1 -ml-1 sm:-ml-14 py-0.5"
          onDragOver={(event) => {
            if (!dragId) return;
            event.preventDefault();
            const rect = event.currentTarget.getBoundingClientRect();
            setDropIndex(event.clientY < rect.top + rect.height / 2 ? index : index + 1);
          }}
          onDrop={(event) => {
            event.preventDefault();
            if (dragId && dropIndex !== null) move(dragId, dropIndex);
            setDragId(null);
            setDropIndex(null);
          }}
          style={{ opacity: dragId === block.id ? 0.4 : 1 }}
        >
          {dropIndex === index && dragId && <div className="absolute left-0 right-0 -top-px h-0.5 rounded" style={{ backgroundColor: '#0068bc' }} aria-hidden="true" />}
          {dropIndex === index + 1 && index === blocks.length - 1 && dragId && <div className="absolute left-0 right-0 -bottom-px h-0.5 rounded" style={{ backgroundColor: '#0068bc' }} aria-hidden="true" />}

          {/* Gutter: + and drag handle, shown on hover / focus (always on touch screens) */}
          <div className="content-block-gutter flex items-center shrink-0 pt-0.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
            <Tooltip title="Add a block below">
              <IconButton size="small" aria-label="Add a block below" onClick={(event) => setMenu({ kind: 'add', anchor: event.currentTarget, afterIndex: index })} sx={{ p: 0.25, color: '#8b8d98' }}>
                <AddRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Drag to move · click for options">
              <IconButton
                size="small"
                aria-label="Block options"
                draggable
                onDragStart={(event) => {
                  setDragId(block.id);
                  const row = rowRefs.current.get(block.id);
                  if (row) event.dataTransfer.setDragImage(row, 24, 16);
                  event.dataTransfer.effectAllowed = 'move';
                }}
                onDragEnd={() => {
                  setDragId(null);
                  setDropIndex(null);
                }}
                onClick={(event) => setMenu({ kind: 'block', anchor: event.currentTarget, id: block.id })}
                sx={{ p: 0.25, color: '#8b8d98', cursor: 'grab' }}
              >
                <DragIndicatorRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </div>

          <div className="flex-1 min-w-0 py-1">{renderEditor(block, index)}</div>
        </div>
      ))}

      {/* Quiet "add" row at the end */}
      <button
        type="button"
        onClick={(event) => setMenu({ kind: 'add', anchor: event.currentTarget, afterIndex: blocks.length - 1 })}
        className="flex items-center gap-2 self-stretch rounded-lg px-2 py-2 -mx-2 text-left transition-colors hover:bg-black/[0.04]"
        style={{ fontSize: '14px', color: '#8b8d98' }}
      >
        <AddRoundedIcon fontSize="small" />
        {blocks.length ? 'Add a block' : "Add a block - text, heading, list, callout or divider"}
      </button>

      {/* Block type picker (from +, "/" or the add row) */}
      <Menu
        open={menu?.kind === 'add'}
        anchorEl={menu?.anchor}
        onClose={() => setMenu(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { sx: { width: 280, borderRadius: '12px', boxShadow: '0 12px 32px rgba(16, 24, 40, 0.14)' } } }}
      >
        <ListSubheader sx={{ lineHeight: '32px', fontSize: 12, fontWeight: 600 }}>Basic blocks</ListSubheader>
        {BLOCK_TYPES.map(({ type, label, description }) => {
          const Icon = BLOCK_ICONS[type];
          return (
            <MenuItem key={type} onClick={() => chooseType(type)} sx={{ gap: 1.5, py: 0.75 }}>
              <span className="flex items-center justify-center rounded-md shrink-0" style={{ width: 36, height: 36, border: '1px solid #e3e6eb', backgroundColor: '#ffffff', color: '#333333' }}>
                <Icon fontSize="small" />
              </span>
              <span className="flex flex-col">
                <span style={{ fontSize: 14, fontWeight: 500, color: '#1c2024' }}>{label}</span>
                <span style={{ fontSize: 12, color: '#8b8d98' }}>{description}</span>
              </span>
            </MenuItem>
          );
        })}
      </Menu>

      {/* Block actions (from the drag handle) */}
      <Menu
        open={menu?.kind === 'block' && !!blockMenuBlock}
        anchorEl={menu?.anchor}
        onClose={() => setMenu(null)}
        slotProps={{ paper: { sx: { width: 220, borderRadius: '12px', boxShadow: '0 12px 32px rgba(16, 24, 40, 0.14)' } } }}
      >
        <ListSubheader sx={{ lineHeight: '32px', fontSize: 12, fontWeight: 600 }}>Turn into</ListSubheader>
        {BLOCK_TYPES.filter(({ type }) => type !== blockMenuBlock?.type).map(({ type, label }) => {
          const Icon = BLOCK_ICONS[type];
          return (
            <MenuItem
              key={type}
              onClick={() => {
                if (blockMenuBlock) update(blockMenuBlock.id, convertBlock(blockMenuBlock, type));
                setMenu(null);
              }}
              sx={{ gap: 1.5, fontSize: 14 }}
            >
              <Icon fontSize="small" sx={{ color: '#5c5c5c' }} />
              {label}
            </MenuItem>
          );
        })}
        <Divider />
        <MenuItem disabled={blockMenuIndex <= 0} onClick={() => { if (blockMenuBlock) move(blockMenuBlock.id, blockMenuIndex - 1); setMenu(null); }} sx={{ gap: 1.5, fontSize: 14 }}>
          <ArrowUpwardRoundedIcon fontSize="small" sx={{ color: '#5c5c5c' }} /> Move up
        </MenuItem>
        <MenuItem disabled={blockMenuIndex >= blocks.length - 1} onClick={() => { if (blockMenuBlock) move(blockMenuBlock.id, blockMenuIndex + 2); setMenu(null); }} sx={{ gap: 1.5, fontSize: 14 }}>
          <ArrowDownwardRoundedIcon fontSize="small" sx={{ color: '#5c5c5c' }} /> Move down
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (blockMenuBlock) {
              const copy = { ...createBlock(blockMenuBlock.type), html: blockMenuBlock.html };
              const next = [...blocks];
              next.splice(blockMenuIndex + 1, 0, copy);
              onChange(next);
            }
            setMenu(null);
          }}
          sx={{ gap: 1.5, fontSize: 14 }}
        >
          <ContentCopyRoundedIcon fontSize="small" sx={{ color: '#5c5c5c' }} /> Duplicate
        </MenuItem>
        <MenuItem onClick={() => { if (blockMenuBlock) remove(blockMenuBlock.id); setMenu(null); }} sx={{ gap: 1.5, fontSize: 14, color: '#c41e2f' }}>
          <DeleteOutlineRoundedIcon fontSize="small" /> Delete
        </MenuItem>
      </Menu>
    </div>
  );
};

export default ContentBlocks;
