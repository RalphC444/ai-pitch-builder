import React, { useState } from 'react';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import ListSubheader from '@mui/material/ListSubheader';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import PersonAddAlt1OutlinedIcon from '@mui/icons-material/PersonAddAlt1Outlined';
import PlaylistAddCheckRoundedIcon from '@mui/icons-material/PlaylistAddCheckRounded';
import WorkspacePremiumOutlinedIcon from '@mui/icons-material/WorkspacePremiumOutlined';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import { useToast } from '../../components/toast';
import { useMediaQuery, MOBILE_QUERY } from '../../hooks/useMediaQuery';
import type { ExpressAdvisor } from '../../data/expressList';
import type { AnglePrompt } from '../../data/anglePrompts';

interface ExpressActionsProps {
  roster: ExpressAdvisor[];
  setRoster: React.Dispatch<React.SetStateAction<ExpressAdvisor[]>>;
  selectedIds: Set<string>;
  prompts: Record<number, AnglePrompt>;
  onAddAdvisors: () => void;
  /** Send the selected advisors on to Pitch Curation */
  onSend: (advisors: ExpressAdvisor[]) => void;
}

const plural = (count: number) => `${count} advisor${count === 1 ? '' : 's'}`;

/**
 * ExpressActions
 *
 * The Express List's main CTAs, shown in the top nav: an "Actions" menu
 * (add advisors, bulk actions on the selection) and the primary Send.
 */
export const ExpressActions: React.FC<ExpressActionsProps> = ({
  roster,
  setRoster,
  selectedIds,
  prompts,
  onAddAdvisors,
  onSend,
}) => {
  const { showToast } = useToast();
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const selected = roster.filter((advisor) => selectedIds.has(advisor.id));

  /** Close the menu, then run a bulk action if anything is selected */
  const onSelection = (action: string, run: () => void) => () => {
    setAnchor(null);
    if (selected.length === 0) {
      showToast(`Select advisors to ${action}`);
      return;
    }
    run();
  };

  const assignAngle = (number: number) => onSelection('assign an angle to', () => {
    const angle = { number, label: prompts[number].angleLabel };
    setRoster((previous) => previous.map((advisor) => (
      selectedIds.has(advisor.id) ? { ...advisor, profile: { ...advisor.profile, angles: [angle] } } : advisor
    )));
    showToast(`Assigned Angle ${number} to ${plural(selected.length)}`);
  });

  return (
    <div className="flex items-center gap-2 shrink-0">
      <Button
        variant="outlined"
        endIcon={<ExpandMoreRoundedIcon />}
        onClick={(event) => setAnchor(event.currentTarget)}
        aria-haspopup="menu"
        aria-expanded={Boolean(anchor)}
        sx={isMobile ? { px: 1.5, '& .MuiButton-endIcon': { ml: 0.25 } } : undefined}
      >
        Actions
      </Button>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem
          onClick={() => {
            setAnchor(null);
            onAddAdvisors();
          }}
          sx={{ gap: 1.5 }}
        >
          <PersonAddAlt1OutlinedIcon fontSize="small" />
          Add advisors
        </MenuItem>
        <Divider />
        <ListSubheader sx={{ lineHeight: '32px' }}>
          {selected.length ? `${plural(selected.length)} selected` : 'Selected advisors'}
        </ListSubheader>
        <MenuItem
          onClick={onSelection('apply to the request page', () => showToast(`Applied ${plural(selected.length)} to the request page`))}
          sx={{ gap: 1.5 }}
        >
          <PlaylistAddCheckRoundedIcon fontSize="small" />
          Apply to request page
        </MenuItem>
        <MenuItem
          onClick={onSelection('add a qualifier to', () => {
            setRoster((previous) => previous.map((advisor) => (selectedIds.has(advisor.id) ? { ...advisor, hasQualifier: true } : advisor)));
            showToast(`Qualifier added to ${plural(selected.length)}`);
          })}
          sx={{ gap: 1.5 }}
        >
          <WorkspacePremiumOutlinedIcon fontSize="small" />
          Add qualifier
        </MenuItem>
        <Divider />
        <ListSubheader sx={{ lineHeight: '32px' }}>Assign angle</ListSubheader>
        {Object.keys(prompts).map(Number).sort().map((number) => (
          <MenuItem key={number} onClick={assignAngle(number)} sx={{ gap: 1 }}>
            <strong>Angle {number}</strong>
            <span style={{ color: '#5c5c5c' }}>{prompts[number].angleLabel}</span>
          </MenuItem>
        ))}
      </Menu>
      <Button
        variant="contained"
        startIcon={isMobile ? undefined : <MailOutlineRoundedIcon />}
        onClick={() => (selected.length ? onSend(selected) : showToast('Select advisors to send'))}
        aria-label="Send selected advisors to client"
      >
        {/* One action: drafts the pitches and email for the client. Phones keep the short label to fit the nav */}
        {`${isMobile ? 'Send' : 'Send to Client'}${selected.length ? ` (${selected.length})` : ''}`}
      </Button>
    </div>
  );
};

export default ExpressActions;
