import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Toast } from './Toast';
import { useMediaQuery, MOBILE_QUERY } from '../../hooks/useMediaQuery';

interface ToastItem {
  id: string;
  message: string;
  duration: number;
}

interface ToastContextType {
  showToast: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

/**
 * ToastProvider Component
 *
 * Provides toast notification functionality throughout the app.
 * Supports multiple toasts stacking from bottom right.
 * Use the useToast hook to show toasts from any component.
 *
 * @example
 * <ToastProvider>
 *   <App />
 * </ToastProvider>
 */
export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const isMobile = useMediaQuery(MOBILE_QUERY);

  const showToast = useCallback((message: string, duration: number = 5000) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: ToastItem = { id, message, duration };
    
    setToasts((prev) => [...prev, newToast]);
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Container - bottom right; bottom center on phones */}
      <div
        style={{
          position: 'fixed',
          bottom: isMobile ? '76px' : '88px', // Above the floating experience menu
          right: isMobile ? '16px' : '24px',
          left: isMobile ? '16px' : undefined,
          zIndex: 70, // Above the overlay drawer
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          alignItems: isMobile ? 'center' : 'flex-end',
        }}
      >
        {toasts.map((toast, index) => (
          <Toast
            key={toast.id}
            message={toast.message}
            isVisible={true}
            onClose={() => hideToast(toast.id)}
            duration={toast.duration}
            index={index}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

/**
 * useToast Hook
 *
 * Hook to access toast functionality from any component.
 *
 * @example
 * const { showToast } = useToast();
 * showToast('Advisor Was Removed');
 */
export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

