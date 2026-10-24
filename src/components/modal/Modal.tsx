import React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

// ==================== ModalButton ====================

export interface ModalButtonProps {
  /**
   * Button label text
   */
  label: string;
  /**
   * Click handler
   */
  onClick?: () => void;
  /**
   * Whether this is a primary button (blue background)
   */
  primary?: boolean;
  /**
   * Whether button is disabled
   */
  disabled?: boolean;
  /**
   * Accessibility label
   */
  'aria-label'?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * ModalButton Component
 *
 * CTA button (MUI Button): primary is contained, secondary is outlined.
 *
 * @example
 * <ModalButton
 *   label="Save"
 *   onClick={handleSave}
 *   primary={true}
 * />
 */
export const ModalButton: React.FC<ModalButtonProps> = ({
  label,
  onClick,
  primary = false,
  disabled = false,
  'aria-label': ariaLabel,
  className = '',
}) => (
  <Button
    variant={primary ? 'contained' : 'outlined'}
    color="primary"
    onClick={onClick}
    disabled={disabled}
    aria-label={ariaLabel || label}
    className={className}
  >
    {label}
  </Button>
);

// ==================== ModalActions ====================

export interface ModalAction {
  /**
   * Button label
   */
  label: string;
  /**
   * Click handler
   */
  onClick?: () => void;
  /**
   * Whether this is a primary action
   */
  primary?: boolean;
  /**
   * Whether button is disabled
   */
  disabled?: boolean;
  /**
   * Accessibility label
   */
  'aria-label'?: string;
}

export interface ModalActionsProps {
  /**
   * Array of action buttons
   */
  actions: ModalAction[];
  /**
   * Alignment of actions (default: 'end')
   */
  align?: 'start' | 'end' | 'center';
  /**
   * Gap between buttons (default: '12px')
   */
  gap?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const JUSTIFY = { start: 'flex-start', end: 'flex-end', center: 'center' } as const;

/**
 * ModalActions Component
 *
 * Container for modal action buttons.
 * Provides consistent spacing and layout for modal actions.
 *
 * @example
 * <ModalActions
 *   actions={[
 *     { label: "Cancel", onClick: handleCancel },
 *     { label: "Save", onClick: handleSave, primary: true }
 *   ]}
 * />
 */
export const ModalActions: React.FC<ModalActionsProps> = ({
  actions,
  align = 'end',
  gap = '12px',
  className = '',
}) => (
  <div className={`flex flex-wrap items-center ${className}`} style={{ justifyContent: JUSTIFY[align], gap, width: '100%' }}>
    {actions.map((action) => (
      <ModalButton
        key={action.label}
        label={action.label}
        onClick={action.onClick}
        primary={action.primary}
        disabled={action.disabled}
        aria-label={action['aria-label']}
      />
    ))}
  </div>
);

// ==================== Modal ====================

export interface ModalProps {
  /**
   * Whether the modal is open
   */
  isOpen: boolean;
  /**
   * Callback when modal should be closed
   */
  onClose: () => void;
  /**
   * Modal title (optional, can be passed as children instead)
   */
  title?: string;
  /**
   * Modal content
   */
  children: React.ReactNode;
  /**
   * Modal width (default: '648px')
   */
  width?: string;
  /**
   * Whether to show the close button (default: true)
   */
  showCloseButton?: boolean;
  /**
   * Whether clicking backdrop closes the modal (default: true)
   */
  closeOnBackdropClick?: boolean;
  /**
   * Additional CSS classes for the modal container
   */
  className?: string;
  /**
   * Additional CSS classes for the modal content
   */
  contentClassName?: string;
  /**
   * ARIA label for the modal
   */
  'aria-labelledby'?: string;
  /**
   * ARIA description for the modal
   */
  'aria-describedby'?: string;
}

/**
 * Modal Component
 *
 * MUI Dialog with the Nexus header (title + round close button). Escape and
 * backdrop clicks close it; page scroll is locked while open.
 *
 * @example
 * <Modal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Confirm Action"
 * >
 *   <p>Are you sure?</p>
 * </Modal>
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  width = '648px',
  showCloseButton = true,
  closeOnBackdropClick = true,
  className = '',
  contentClassName = '',
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
}) => (
  <Dialog
    open={isOpen}
    onClose={(_event, reason) => {
      if (reason === 'backdropClick' && !closeOnBackdropClick) return;
      onClose();
    }}
    className={className}
    aria-labelledby={ariaLabelledBy}
    aria-describedby={ariaDescribedBy}
    PaperProps={{
      className: contentClassName,
      sx: { width, maxWidth: '90vw', maxHeight: '90vh', borderRadius: '16px', boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.12)' },
    }}
  >
    {(title || showCloseButton) && (
      <div className="flex items-center justify-between gap-3" style={{ padding: '16px 16px 0 24px', minHeight: '48px' }}>
        {title && (
          <h2 id={ariaLabelledBy} style={{ fontFamily: "'Poppins', sans-serif", fontSize: '20px', lineHeight: '28px', fontWeight: 600, color: '#1c2024', margin: 0, flex: 1 }}>
            {title}
          </h2>
        )}
        {showCloseButton && (
          <IconButton onClick={onClose} aria-label="Close modal" size="small">
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        )}
      </div>
    )}
    <div className="flex flex-col items-start overflow-y-auto" style={{ padding: '24px', width: '100%' }}>
      {children}
    </div>
  </Dialog>
);

export default Modal;
