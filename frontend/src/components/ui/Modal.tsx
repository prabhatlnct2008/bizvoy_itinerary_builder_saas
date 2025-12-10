import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  footer?: React.ReactNode;
  /** Hide the header for full-content modals */
  hideHeader?: boolean;
  /** Custom max height for the content area */
  maxContentHeight?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  footer,
  hideHeader = false,
  maxContentHeight,
}) => {
  // Handle ESC key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-6xl',
    full: 'max-w-[95vw] max-h-[95vh]',
  };

  const isFullSize = size === 'full';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className={`flex min-h-full items-center justify-center ${isFullSize ? 'p-2' : 'p-4'}`}>
        <div
          className={`relative bg-white rounded-xl shadow-xl ${sizeClasses[size]} w-full ${isFullSize ? 'flex flex-col' : ''}`}
          onClick={(e) => e.stopPropagation()}
          style={isFullSize ? { height: '95vh' } : undefined}
        >
          {/* Header */}
          {!hideHeader && (
            <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0">
              <h3 className="text-xl font-semibold text-primary">{title}</h3>
              <button
                onClick={onClose}
                className="text-muted hover:text-primary transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )}

          {/* Close button for hidden header */}
          {hideHeader && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-lg text-muted hover:text-primary transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}

          {/* Content */}
          <div
            className={`${hideHeader ? '' : 'p-6'} ${isFullSize ? 'flex-1 overflow-y-auto' : ''}`}
            style={maxContentHeight ? { maxHeight: maxContentHeight, overflowY: 'auto' } : undefined}
          >
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="flex items-center justify-end gap-3 p-6 border-t border-border flex-shrink-0">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
