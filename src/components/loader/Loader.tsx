import React from 'react';

export interface LoaderProps {
  /**
   * Number of text bar lines to show
   */
  lines?: number;
  /**
   * Width of the loader container
   */
  width?: string | number;
  /**
   * Custom class name
   */
  className?: string;
  /**
   * Whether to show the shimmer animation
   */
  animated?: boolean;
}

/**
 * Loader Component
 * 
 * A reusable skeleton loader with animated gradient bars.
 * Used to indicate loading state for text content.
 * 
 * @example
 * <Loader lines={4} width="100%" animated />
 */
export const Loader: React.FC<LoaderProps> = ({
  lines = 4,
  width = '100%',
  className = '',
  animated = true,
}) => {
  // Varying widths matching Figma design (400px, 576px, 576px, 280px of the 576px content area),
  // as percentages so the bars scale down on narrow screens
  const lineWidths = ['69.4%', '100%', '100%', '48.6%'];
  
  return (
    <div 
      className={`loader-container ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        width: typeof width === 'number' ? `${width}px` : width,
        maxWidth: 'min(592px, 100%)', // Never wider than the parent (e.g. phone-width cards)
        paddingRight: '16px',
        paddingTop: '16px',
        paddingBottom: '16px',
      }}
    >
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={animated ? 'loader-bar-animated' : 'loader-bar'}
          style={{
            height: '20px',
            borderRadius: '999px',
            width: lineWidths[index % lineWidths.length],
            maxWidth: '100%',
            background: animated 
              ? undefined // Use CSS animation
              : 'linear-gradient(90deg, rgba(0, 0, 0, 0.04) 0%, rgba(0, 0, 0, 0.16) 100%)',
          }}
        />
      ))}
      
      <style>{`
        .loader-bar {
          background: linear-gradient(90deg, rgba(0, 0, 0, 0.04) 0%, rgba(0, 0, 0, 0.16) 100%);
        }
        
        .loader-bar-animated {
          background: linear-gradient(
            90deg,
            rgba(0, 0, 0, 0.04) 0%,
            rgba(0, 0, 0, 0.12) 50%,
            rgba(0, 0, 0, 0.04) 100%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s ease-in-out infinite;
        }
        
        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </div>
  );
};

export interface ContentLoaderProps {
  /**
   * Whether the content is loading
   */
  isLoading: boolean;
  /**
   * The content to display when not loading
   */
  children: React.ReactNode;
  /**
   * Loader configuration
   */
  loaderProps?: LoaderProps;
}

/**
 * ContentLoader Component
 * 
 * A wrapper component that shows a loader while content is loading,
 * then reveals the children when loading is complete.
 * 
 * @example
 * <ContentLoader isLoading={isLoading}>
 *   <YourContent />
 * </ContentLoader>
 */
export const ContentLoader: React.FC<ContentLoaderProps> = ({
  isLoading,
  children,
  loaderProps,
}) => {
  if (isLoading) {
    return <Loader {...loaderProps} />;
  }
  
  return <>{children}</>;
};

export default Loader;

