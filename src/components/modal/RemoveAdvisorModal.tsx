import React from 'react';
import { Modal, ModalActions } from './Modal';

interface RemoveAdvisorModalProps {
  /**
   * Whether the modal is open
   */
  isOpen: boolean;
  /**
   * Advisor name to display in the modal
   */
  advisorName?: string;
  /**
   * Callback when modal should be closed
   */
  onClose: () => void;
  /**
   * Callback when "Remove Only" is clicked
   */
  onRemoveOnly?: () => void;
  /**
   * Callback when "Save & Remove" is clicked
   */
  onSaveAndRemove?: () => void;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * RemoveAdvisorModal Component
 *
 * Modal dialog for confirming advisor removal.
 * Uses reusable Modal and ModalActions components.
 * Matches Figma design specifications.
 *
 * @example
 * <RemoveAdvisorModal
 *   isOpen={true}
 *   advisorName="Colin Anderson"
 *   onClose={() => setIsOpen(false)}
 *   onRemoveOnly={() => handleRemoveOnly()}
 *   onSaveAndRemove={() => handleSaveAndRemove()}
 * />
 */
export const RemoveAdvisorModal: React.FC<RemoveAdvisorModalProps> = ({
  isOpen,
  advisorName,
  onClose,
  onRemoveOnly,
  onSaveAndRemove,
  className = '',
}) => {
  const handleRemoveOnly = () => {
    onRemoveOnly?.();
    onClose();
  };

  const handleSaveAndRemove = () => {
    onSaveAndRemove?.();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Remove this Advisor from Pitch Builder?"
      className={className}
      aria-labelledby="remove-advisor-modal-title"
      aria-describedby="remove-advisor-modal-description"
    >
      {/* Body Text */}
      <p
        id="remove-advisor-modal-description"
        style={{
          fontFamily: "'Poppins', sans-serif",
          fontSize: '14px',
          lineHeight: '20px',
          fontWeight: 500, // Medium
          color: 'rgba(0, 0, 0, 0.8)',
          letterSpacing: '0.14px',
          margin: 0,
          padding: 0,
          width: '100%',
        }}
      >
        Are you sure you want to remove this advisor from the pitch builder & final to-client email? You can save your progress on their pitch before proceeding, or you can choose to remove the advisor entirely.
      </p>

      {/* Action Buttons */}
      <div
        style={{
          paddingTop: '24px',
          width: '100%',
        }}
      >
        <ModalActions
          actions={[
            {
              label: 'Remove Only',
              onClick: handleRemoveOnly,
              'aria-label': 'Remove advisor only',
            },
            {
              label: 'Save & Remove',
              onClick: handleSaveAndRemove,
              primary: true,
              'aria-label': 'Save progress and remove advisor',
            },
          ]}
        />
      </div>
    </Modal>
  );
};

export default RemoveAdvisorModal;

