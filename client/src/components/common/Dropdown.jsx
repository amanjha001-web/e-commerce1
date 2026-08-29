import { useEffect, useRef, useState } from "react";

const Dropdown = ({
  trigger,
  children,
  position = "right",
  width = "w-48",
  disabled = false,
  closeOnItemClick = true,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);

      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);

      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const positions = {
    left: "left-0",
    right: "right-0",
    center: "left-1/2 -translate-x-1/2",
  };

  const handleItemClick = (event) => {
    if (closeOnItemClick && event.target.closest("[data-dropdown-item]")) {
      setIsOpen(false);
    }
  };

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        disabled={disabled}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="inline-flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-50"
      >
        {trigger}
      </button>

      {isOpen && (
        <div
          role="menu"
          onClick={handleItemClick}
          className={`absolute top-full z-40 mt-2 ${positions[position] || positions.right} ${width} overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900`}
        >
          {children}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
