import React from 'react';
import MuiStepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';

export interface StepperProps {
  /**
   * Step labels, in order
   */
  steps: string[];
  /**
   * Index of the current step (earlier steps show as complete)
   */
  activeStep: number;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Stepper Component
 *
 * MUI horizontal stepper (the Figma's Step Icon component is MUI's). On phones
 * only the active step keeps its label.
 *
 * @example
 * <Stepper steps={['Pitch Curation', 'Compose Email', 'Send To Client']} activeStep={0} />
 */
export const Stepper: React.FC<StepperProps> = ({ steps, activeStep, className = '' }) => (
  <MuiStepper
    activeStep={activeStep}
    className={`w-full ${className}`}
    aria-label="Progress"
    sx={{
      '& .MuiStepLabel-label': { fontSize: 14, fontWeight: 500 },
      '& .MuiStepIcon-root': { fontSize: 24 },
      '& .MuiStepConnector-line': { borderColor: '#bdbdbd' },
    }}
  >
    {steps.map((label, index) => (
      <Step key={label}>
        <StepLabel
          sx={{
            // Phones: hide labels of steps that aren't active
            '& .MuiStepLabel-labelContainer': { display: { xs: index === activeStep ? 'block' : 'none', sm: 'block' } },
          }}
        >
          {label}
        </StepLabel>
      </Step>
    ))}
  </MuiStepper>
);

export default Stepper;
