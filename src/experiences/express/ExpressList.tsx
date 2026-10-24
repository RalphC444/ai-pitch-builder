import React, { useMemo, useRef, useState } from 'react';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Tooltip from '@mui/material/Tooltip';
import ViewColumnOutlinedIcon from '@mui/icons-material/ViewColumnOutlined';
import { AgenticPM, AGENTIC_PM_ENABLED, ChatMessage } from './AgenticPM';
import { AdvisorDetailCard } from './AdvisorDetailCard';
import { QualifiedStatusChips } from './QualifiedStatusChips';
import {
  AdvisorFilter,
  EngagementScore,
  ExpressAdvisor,
  getCurrentJob,
  getFormerJob,
  getJobEnd,
  getJobStart,
  getScreenerResponses,
  matchesFilters,
  QUALIFIED_LABELS,
} from '../../data/expressList';

interface ExpressListProps {
  roster: ExpressAdvisor[];
  selectedIds: Set<string>;
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  appliedFilters: AdvisorFilter[];
  setAppliedFilters: React.Dispatch<React.SetStateAction<AdvisorFilter[]>>;
  chatMessages: ChatMessage[];
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
}

interface Column {
  key: string;
  label: string;
  /** Shorter header used in the default (essential columns) view */
  short?: string;
  /** Shown by default; the rest appear with "Show all columns" */
  essential?: boolean;
  width: number;
  align?: 'right';
  /** Long text: truncate with the full text in a tooltip */
  long?: boolean;
  render: (advisor: ExpressAdvisor) => React.ReactNode;
  sortValue: (advisor: ExpressAdvisor) => string | number;
}

const font = "'Poppins', sans-serif";
const CHECKBOX_WIDTH = 52;
const NAME_WIDTH = 220;
const DEFAULT_SORT = { key: 'company-current', direction: 'desc' as 'asc' | 'desc' };

const ENGAGEMENT_COLORS: Record<EngagementScore, { color: string; background: string }> = {
  Excellent: { color: '#0f6b37', background: '#e3f4ea' },
  'Very Good': { color: '#1a6b4f', background: '#e6f5ef' },
  Good: { color: '#005296', background: '#e6f0fa' },
  Fair: { color: '#9a4f00', background: '#fff1e0' },
  Poor: { color: '#9b1726', background: '#fde8ea' },
  'N/A': { color: '#5c5c5c', background: '#f0f4f8' },
};

/** "MM/YYYY" -> sortable number */
const dateValue = (value: string) => {
  if (/present/i.test(value)) return 999999;
  const match = value.match(/(\d{2})\/(\d{4})/);
  return match ? Number(match[2]) * 100 + Number(match[1]) : 0;
};

const formerColumns = (index: 1 | 2 | 3): Column[] => [
  { key: `company-former-${index}`, label: `Company Name - Former ${index}`, width: 240, render: (a) => getFormerJob(a, index)?.companyName || '', sortValue: (a) => getFormerJob(a, index)?.companyName || '' },
  { key: `title-former-${index}`, label: `Job Title - Former ${index}`, width: 240, render: (a) => getFormerJob(a, index)?.role || '', sortValue: (a) => getFormerJob(a, index)?.role || '' },
  { key: `end-former-${index}`, label: `End Date - Former ${index}`, width: 180, align: 'right', render: (a) => getJobEnd(getFormerJob(a, index)), sortValue: (a) => dateValue(getJobEnd(getFormerJob(a, index))) },
  { key: `start-former-${index}`, label: `Start Date - Former ${index}`, width: 180, align: 'right', render: (a) => getJobStart(getFormerJob(a, index)), sortValue: (a) => dateValue(getJobStart(getFormerJob(a, index))) },
];

const COLUMNS: Column[] = [
  { key: 'qualified', label: 'Qualified Status', short: 'Status', essential: true, width: 120, render: (a) => <QualifiedStatusChips advisor={a} />, sortValue: (a) => QUALIFIED_LABELS[a.qualifiedStatus] },
  { key: 'angle', label: 'Angle', essential: true, width: 80, align: 'right', render: (a) => a.profile.angles.map((angle) => angle.number).join(', '), sortValue: (a) => a.profile.angles[0]?.number || 0 },
  { key: 'company-current', label: 'Company Name - Current', short: 'Company', essential: true, width: 220, render: (a) => getCurrentJob(a)?.companyName || '', sortValue: (a) => getCurrentJob(a)?.companyName || '' },
  { key: 'title-current', label: 'Job Title - Current', short: 'Job Title', essential: true, width: 260, long: true, render: (a) => getCurrentJob(a)?.role || '', sortValue: (a) => getCurrentJob(a)?.role || '' },
  { key: 'start-current', label: 'Start Date - Current', width: 180, align: 'right', render: (a) => getJobStart(getCurrentJob(a)), sortValue: (a) => dateValue(getJobStart(getCurrentJob(a))) },
  { key: 'country', label: 'Country', essential: true, width: 150, render: (a) => a.country, sortValue: (a) => a.country },
  {
    key: 'screeners',
    label: 'Screener Responses - Current',
    width: 420,
    long: true,
    render: (a) => {
      const first = getScreenerResponses(a)[0];
      return first ? `Q: ${first.question}` : '';
    },
    sortValue: (a) => getScreenerResponses(a).length,
  },
  ...formerColumns(1),
  ...formerColumns(2),
  ...formerColumns(3),
  { key: 'rate', label: 'Hourly Rate', short: 'Rate', essential: true, width: 100, align: 'right', render: (a) => `$${a.hourlyRate}`, sortValue: (a) => a.hourlyRate },
  { key: 'score', label: 'Recommendation Score', width: 210, align: 'right', render: (a) => a.recommendationScore, sortValue: (a) => a.recommendationScore },
  { key: 'explanation', label: 'Recommendation Explanation', width: 380, long: true, render: (a) => a.recommendationExplanation, sortValue: (a) => a.recommendationExplanation },
  { key: 'biography', label: 'Advisor Biography', width: 420, long: true, render: (a) => a.profile.profileDetails?.biography || '', sortValue: (a) => a.profile.profileDetails?.biography || '' },
  { key: 'summary', label: 'Advisor Summary*', width: 380, long: true, render: (a) => a.summary, sortValue: (a) => a.summary },
  {
    key: 'engagement',
    label: 'Engagement Score',
    short: 'Engagement',
    essential: true,
    width: 150,
    render: (a) => (
      <Chip label={a.engagement} size="small" sx={{ height: 22, fontSize: 12, color: ENGAGEMENT_COLORS[a.engagement].color, backgroundColor: ENGAGEMENT_COLORS[a.engagement].background }} />
    ),
    sortValue: (a) => ['N/A', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'].indexOf(a.engagement),
  },
];

const COLUMN_LABELS: Record<string, string> = { name: 'Advisor Name', ...Object.fromEntries(COLUMNS.map((column) => [column.key, column.label])) };
const ESSENTIAL_COLUMNS = COLUMNS.filter((column) => column.essential);
const tableWidth = (columns: Column[]) => CHECKBOX_WIDTH + NAME_WIDTH + columns.reduce((total, column) => total + column.width, 0);

/**
 * Sticky-left cell styles for the checkbox and name columns. Body cells get their
 * solid background from the row (see ROW_BACKGROUNDS) so scrolled columns never
 * show through them.
 */
const stickySx = (left: number, isHeader: boolean, isLastSticky = false) => ({
  position: 'sticky',
  left,
  zIndex: isHeader ? 4 : 2,
  ...(isHeader ? { backgroundColor: '#f6f8fb' } : {}),
  ...(isLastSticky ? { boxShadow: 'inset -1px 0 0 #d6dbe3' } : {}),
});

/** Solid row colours (MUI's hover/selected tints are translucent) */
const ROW_BACKGROUNDS = { normal: '#ffffff', selected: '#f3f8fd', open: '#e1eefb', hover: '#eef4fb' };

/**
 * ExpressList
 *
 * The Express List CRM from the Unified Email Experience Figma: every advisor on
 * the project in one MUI table. Selected advisors are sent on to Pitch Curation.
 */
export const ExpressList: React.FC<ExpressListProps> = ({
  roster,
  selectedIds,
  setSelectedIds,
  appliedFilters,
  setAppliedFilters,
  chatMessages,
  setChatMessages,
  isChatOpen,
  setIsChatOpen,
}) => {
  const [sort, setSort] = useState(DEFAULT_SORT);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [showAllColumns, setShowAllColumns] = useState(false);
  const columns = showAllColumns ? COLUMNS : ESSENTIAL_COLUMNS;
  const headerLabel = (column: Column) => (showAllColumns ? column.label : column.short || column.label);
  const chatWasOpenRef = useRef(false);
  const showChat = AGENTIC_PM_ENABLED && isChatOpen;

  const visible = useMemo(() => {
    const filtered = roster.filter((advisor) => matchesFilters(advisor, appliedFilters));
    const valueOf = sort.key === 'name'
      ? (advisor: ExpressAdvisor) => advisor.profile.name.replace(/^Dr\.\s+/, '')
      : COLUMNS.find((column) => column.key === sort.key)?.sortValue || (() => '');
    return [...filtered].sort((a, b) => {
      const [x, y] = [valueOf(a), valueOf(b)];
      const order = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y));
      return sort.direction === 'asc' ? order : -order;
    });
  }, [roster, appliedFilters, sort]);

  const selected = roster.filter((advisor) => selectedIds.has(advisor.id));
  const allVisibleSelected = visible.length > 0 && visible.every((advisor) => selectedIds.has(advisor.id));
  const someVisibleSelected = visible.some((advisor) => selectedIds.has(advisor.id));
  const plural = (count: number) => `${count} advisor${count === 1 ? '' : 's'}`;

  const toggleRow = (id: string) => setSelectedIds((previous) => {
    const next = new Set(previous);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });

  const toggleAllVisible = () => setSelectedIds((previous) => {
    const next = new Set(previous);
    visible.forEach((advisor) => (allVisibleSelected ? next.delete(advisor.id) : next.add(advisor.id)));
    return next;
  });

  const openDetail = (id: string) => {
    if (!detailId) {
      chatWasOpenRef.current = isChatOpen;
      setIsChatOpen(false);
    }
    setDetailId(id);
  };

  const closeDetail = () => {
    setDetailId(null);
    if (chatWasOpenRef.current) setIsChatOpen(true);
  };

  const detailIndex = visible.findIndex((advisor) => advisor.id === detailId);
  const detailAdvisor = detailIndex >= 0 ? visible[detailIndex] : null;

  const clearFilters = () => {
    setAppliedFilters([]);
    setChatMessages((previous) => previous.map((message) => ({ ...message, applied: false })));
  };

  const sortBy = (key: string) => setSort((previous) => (
    previous.key === key ? { key, direction: previous.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'asc' }
  ));

  const sortLabel = (key: string, label: React.ReactNode) => (
    <TableSortLabel
      active={sort.key === key}
      direction={sort.key === key ? sort.direction : 'asc'}
      onClick={() => sortBy(key)}
      sx={{ whiteSpace: 'nowrap' }}
    >
      {label}
    </TableSortLabel>
  );

  return (
    <main className="flex flex-col" style={{ backgroundColor: '#f0f4f8', minHeight: 'calc(100vh - 64px)', fontFamily: font }}>
      {/* Subhead: count + active filter / sort, column toggle (main CTAs live in the top nav) */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 sm:px-10 py-3" style={{ minHeight: '64px' }}>
        <div className="flex flex-wrap items-center gap-2" style={{ fontSize: '14px', color: '#1c2024' }}>
          <span style={{ fontWeight: 600 }}>
            {visible.length === roster.length ? plural(roster.length) : `${visible.length} of ${plural(roster.length)}`}
          </span>
          {selected.length > 0 && <span style={{ color: '#5c5c5c' }}>· {selected.length} selected</span>}
          {appliedFilters.length > 0 && (
            <Chip
              size="small"
              label={`Filter: ${appliedFilters.map((filter) => filter.field.replace('Company Name - ', '')).join(', ')}`}
              onDelete={clearFilters}
            />
          )}
          {(sort.key !== DEFAULT_SORT.key || sort.direction !== DEFAULT_SORT.direction) && (
            <Chip
              size="small"
              label={`Sorted by ${COLUMN_LABELS[sort.key]} (${sort.direction === 'asc' ? 'Asc' : 'Desc'})`}
              onDelete={() => setSort(DEFAULT_SORT)}
            />
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={() => setShowAllColumns((previous) => !previous)}
            startIcon={<ViewColumnOutlinedIcon />}
            color="inherit"
            className="!hidden sm:!inline-flex"
            sx={{ color: '#333333' }}
          >
            {showAllColumns ? 'Fewer columns' : 'All columns'}
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className={`flex-1 px-4 sm:px-10 pb-6 ${showChat ? 'express-with-chat' : ''}`}>
        <TableContainer component={Paper} variant="outlined" sx={{ borderColor: '#d6dbe3', borderRadius: '8px', maxHeight: 'calc(100vh - 64px - 64px - 24px)' }}>
          <Table stickyHeader size="small" sx={{ tableLayout: 'fixed', width: '100%', minWidth: tableWidth(columns), '& .MuiTableCell-root': { height: 44, py: 0, px: 1.5 } }} aria-label="Express List advisors">
            <colgroup>
              <col style={{ width: CHECKBOX_WIDTH }} />
              <col style={{ width: NAME_WIDTH }} />
              {columns.map((column) => <col key={column.key} style={{ width: column.width }} />)}
            </colgroup>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" sx={{ ...stickySx(0, true), textAlign: 'center' }}>
                  <Checkbox
                    size="small"
                    checked={allVisibleSelected}
                    indeterminate={!allVisibleSelected && someVisibleSelected}
                    onChange={toggleAllVisible}
                    inputProps={{ 'aria-label': 'Select all advisors' }}
                  />
                </TableCell>
                <TableCell sx={stickySx(CHECKBOX_WIDTH, true, true)} sortDirection={sort.key === 'name' ? sort.direction : false}>
                  {sortLabel('name', showAllColumns ? 'Advisor Name' : 'Name')}
                </TableCell>
                {columns.map((column) => (
                  <TableCell key={column.key} align={column.align} sortDirection={sort.key === column.key ? sort.direction : false}>
                    {sortLabel(column.key, headerLabel(column))}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {visible.map((advisor) => {
                const isSelected = selectedIds.has(advisor.id);
                const isOpen = advisor.id === detailId;
                return (
                  <TableRow
                    key={advisor.id}
                    aria-selected={isSelected}
                    onClick={() => openDetail(advisor.id)}
                    sx={{
                      cursor: 'pointer',
                      '& > td': { backgroundColor: isOpen ? ROW_BACKGROUNDS.open : isSelected ? ROW_BACKGROUNDS.selected : ROW_BACKGROUNDS.normal },
                      '&:hover > td': { backgroundColor: ROW_BACKGROUNDS.hover },
                    }}
                  >
                    <TableCell padding="checkbox" sx={{ ...stickySx(0, false), textAlign: 'center' }} onClick={(event) => event.stopPropagation()}>
                      <Checkbox
                        size="small"
                        checked={isSelected}
                        onChange={() => toggleRow(advisor.id)}
                        inputProps={{ 'aria-label': `Select ${advisor.profile.name}` }}
                      />
                    </TableCell>
                    <TableCell sx={{ ...stickySx(CHECKBOX_WIDTH, false, true), fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {advisor.profile.name}
                    </TableCell>
                    {columns.map((column) => {
                      const content = column.render(advisor);
                      const cell = (
                        <TableCell
                          key={column.key}
                          align={column.align}
                          sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontVariantNumeric: column.align ? 'tabular-nums' : undefined, color: column.long ? '#333333' : undefined }}
                        >
                          {content}
                        </TableCell>
                      );
                      return column.long && typeof content === 'string' && content ? (
                        <Tooltip key={column.key} title={content} placement="bottom-start" enterDelay={400}>{cell}</Tooltip>
                      ) : cell;
                    })}
                  </TableRow>
                );
              })}
              {visible.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columns.length + 2} sx={{ height: 120, color: '#5c5c5c' }}>
                    <span style={{ position: 'sticky', left: 16 }}>No advisors match these filters. Clear Filter to see everyone.</span>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      {AGENTIC_PM_ENABLED && (
        <AgenticPM
          roster={roster}
          messages={chatMessages}
          setMessages={setChatMessages}
          appliedFilters={appliedFilters}
          onApplyFilters={setAppliedFilters}
          isOpen={isChatOpen && !detailAdvisor}
          onOpenChange={(open) => {
            if (open && detailAdvisor) setDetailId(null);
            setIsChatOpen(open);
          }}
        />
      )}

      {detailAdvisor && (
        <AdvisorDetailCard
          advisor={detailAdvisor}
          hasPrevious={detailIndex > 0}
          hasNext={detailIndex < visible.length - 1}
          onPrevious={() => setDetailId(visible[detailIndex - 1].id)}
          onNext={() => setDetailId(visible[detailIndex + 1].id)}
          onClose={closeDetail}
        />
      )}
    </main>
  );
};

export default ExpressList;
