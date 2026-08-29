import { useEffect } from "react";
import { createPortal } from "react-dom";

const Modal = ({
  isOpen,
  onClose,
  children,
  title,
  size = "md",
  showCloseButton = true,
  closeOnOverlay = true,
  closeOnEscape = true,
  className = "",
}) => {
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, closeOnEscape, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const sizes = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-7xl",
  };

  const handleOverlayClick = (event) => {
    if (closeOnOverlay && event.target === event.currentTarget) {
      onClose();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onMouseDown={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      <div
        className={`relative max-h-[90vh] w-full overflow-y-auto rounded-xl bg-white shadow-xl dark:bg-gray-900 ${sizes[size] || sizes.md} ${className}`}
      >
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
            {title ? (
              <h2
                id="modal-title"
                className="text-lg font-semibold text-gray-900 dark:text-white"
              >
                {title}
              </h2>
            ) : (
              <div />
            )}

            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                className="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
              >
                ✕
              </button>
            )}
          </div>
        )}

        <div className="p-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
};

export default Modal;
