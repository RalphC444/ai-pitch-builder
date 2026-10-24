import React, { useEffect } from 'react';
import SnackbarContent from '@mui/material/SnackbarContent';
import IconButton from '@mui/material/IconButton';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

export interface ToastProps {
  /**
   * Toast message text
   */
  message: string;
  /**
   * Whether the toast is visible
   */
  isVisible: boolean;
  /**
   * Callback when toast should be closed
   */
  onClose: () => void;
  /**
   * Auto-dismiss duration in milliseconds (default: 5000)
   */
  duration?: number;
  /**
   * Index of toast in stack (0 = bottom, higher = above)
   */
  index?: number;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Toast Component
 *
 * Dark MUI snackbar with a close button; auto-dismisses after `duration`.
 * Stacking and position are handled by ToastProvider.
 *
 * @example
 * <Toast
 *   message="Advisor Was Removed"
 *   isVisible={true}
 *   onClose={() => setIsVisible(false)}
 * />
 */
export const Toast: React.FC<ToastProps> = ({
  message,
  isVisible,
  onClose,
  duration = 5000,
  index = 0,
  className = '',
}) => {
  // Auto-dismiss after duration
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className={className} role="alert" aria-live="polite" aria-atomic="true" style={{ zIndex: 50 + index }}>
      <SnackbarContent
        message={message}
        action={
          <IconButton onClick={onClose} aria-label="Close notification" size="small" sx={{ color: '#ffffff' }}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        }
        sx={{
          backgroundColor: '#333333',
          borderRadius: '8px',
          boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.16)',
          fontSize: 14,
          fontWeight: 500,
          minWidth: 0,
          py: 0,
          pl: 2,
          pr: 1,
          flexWrap: 'nowrap',
        }}
      />
    </div>
  );
};

export default Toast;
