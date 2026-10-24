import React from 'react';
import Tooltip from '@mui/material/Tooltip';
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import WorkspacePremiumOutlinedIcon from '@mui/icons-material/WorkspacePremiumOutlined';
import type { SvgIconComponent } from '@mui/icons-material';
import { ExpressAdvisor, QUALIFIED_LABELS, QualifiedStatus } from '../../data/expressList';

const STATUS_STYLES: Record<QualifiedStatus, { Icon: SvgIconComponent; color: string; background: string }> = {
  pending: { Icon: HelpOutlineRoundedIcon, color: '#5c5c5c', background: '#f0f4f8' },
  qualified: { Icon: CheckRoundedIcon, color: '#149c4d', background: '#e3f4ea' },
  'not-qualified': { Icon: CloseRoundedIcon, color: '#c41e2f', background: '#fde8ea' },
  'needs-review': { Icon: WarningAmberRoundedIcon, color: '#e0730b', background: '#fff1e0' },
};

const Square: React.FC<{ title: string; color: string; background: string; children: React.ReactNode }> = ({ title, color, background, children }) => (
  <Tooltip title={title}>
    <span
      className="inline-flex items-center justify-center"
      style={{ width: '22px', height: '22px', borderRadius: '6px', backgroundColor: background, color }}
      aria-label={title}
      role="img"
    >
      {children}
    </span>
  </Tooltip>
);

/**
 * Qualified Status chips from the Express List Figma: a status square
 * (pending, qualified, not qualified, needs review) plus a ribbon when the
 * advisor has a qualifier
 */
export const QualifiedStatusChips: React.FC<{ advisor: ExpressAdvisor }> = ({ advisor }) => {
  const { Icon, ...colors } = STATUS_STYLES[advisor.qualifiedStatus];
  return (
    <span className="inline-flex items-center gap-1.5">
      <Square title={QUALIFIED_LABELS[advisor.qualifiedStatus]} {...colors}>
        <Icon sx={{ fontSize: 16 }} />
      </Square>
      {advisor.hasQualifier && (
        <Square title="Has qualifier" color="#149c4d" background="#e3f4ea">
          <WorkspacePremiumOutlinedIcon sx={{ fontSize: 16 }} />
        </Square>
      )}
    </span>
  );
};

export default QualifiedStatusChips;
