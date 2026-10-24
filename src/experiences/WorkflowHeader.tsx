import React from 'react';
import IconButton from '@mui/material/IconButton';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import { Stepper } from '../components/stepper/Stepper';

export const WORKFLOW_STEPS = ['Pitch Curation', 'Compose Email', 'Send To Client'];

interface WorkflowHeaderProps {
  activeStep: number;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  backLabel?: string;
}

const font = "'Poppins', sans-serif";

/**
 * WorkflowHeader Component
 *
 * Stepper plus back arrow, page title and subtitle shared by the
 * Pitch Curation, Compose Email and Send To Client steps.
 */
export const WorkflowHeader: React.FC<WorkflowHeaderProps> = ({
  activeStep,
  title,
  subtitle,
  onBack,
  backLabel = 'Back',
}) => (
  <div className="flex flex-col gap-6 w-full">
    <Stepper steps={WORKFLOW_STEPS} activeStep={activeStep} />
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 min-h-10">
        {onBack && (
          <IconButton onClick={onBack} aria-label={backLabel} title={backLabel} size="small">
            <ArrowBackRoundedIcon fontSize="small" />
          </IconButton>
        )}
        <h1 style={{ fontFamily: font, fontSize: '20px', lineHeight: '24px', fontWeight: 600, color: '#000000' }}>{title}</h1>
      </div>
      {subtitle && (
        <p style={{ fontFamily: font, fontSize: '14px', lineHeight: '18px', fontWeight: 500, color: '#000000' }}>{subtitle}</p>
      )}
    </div>
  </div>
);

export default WorkflowHeader;
