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
    full: "max-w-6xl",
  };

  const handleOverlayClick = (event) => {
    if (closeOnOverlay && event.target === event.currentTarget) {
      onClose();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1b0a11]/65 p-4 backdrop-blur-xs"
      onMouseDown={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      <div
        className={`relative max-h-[90vh] w-full overflow-y-auto rounded-2xl border border-[var(--line)] bg-white p-6 shadow-2xl dark:border-line dark:bg-card ${sizes[size] || sizes.md} ${className}`}
      >
        {(title || showCloseButton) && (
          <div className="mb-4 flex items-center justify-between border-b border-[var(--line)] pb-4">
            {title ? (
              <h2
                id="modal-title"
                className="text-xl font-bold tracking-tight text-[var(--text)] dark:text-foreground"
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
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--line)] bg-white text-sm font-bold text-[var(--muted)] transition hover:border-[var(--primary)] hover:bg-[var(--soft)] hover:text-[var(--primary)] dark:bg-card"
              >
                ✕
              </button>
            )}
          </div>
        )}

        <div>{children}</div>
      </div>
    </div>,
    document.body,
  );
};

export default Modal;
