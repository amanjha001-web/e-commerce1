import { useRef, useState } from "react";

const Tooltip = ({
  children,
  content,
  position = "top",
  delay = 300,
  disabled = false,
  className = "",
}) => {
  const [visible, setVisible] = useState(false);
  const timeoutId = useRef(null);

  const showTooltip = () => {
    if (disabled || !content) return;

    clearTimeout(timeoutId.current);

    timeoutId.current = setTimeout(() => {
      setVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    clearTimeout(timeoutId.current);
    timeoutId.current = null;
    setVisible(false);
  };

  const positions = {
    top: "bottom-full left-1/2 mb-2 -translate-x-1/2",
    bottom: "left-1/2 mt-2 -translate-x-1/2",
    left: "right-full top-1/2 mr-2 -translate-y-1/2",
    right: "left-full top-1/2 ml-2 -translate-y-1/2",
  };

  const arrows = {
    top: "left-1/2 top-full -translate-x-1/2 border-x-4 border-t-4 border-x-transparent border-t-gray-900",
    bottom:
      "bottom-full left-1/2 -translate-x-1/2 border-x-4 border-b-4 border-x-transparent border-b-gray-900",
    left: "left-full top-1/2 -translate-y-1/2 border-y-4 border-l-4 border-y-transparent border-l-gray-900",
    right:
      "right-full top-1/2 -translate-y-1/2 border-y-4 border-r-4 border-y-transparent border-r-gray-900",
  };

  return (
    <div
      className={`relative inline-flex ${className}`}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}

      {visible && (
        <div
          role="tooltip"
          className={`pointer-events-none absolute z-50 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg dark:bg-gray-700 ${
            positions[position] || positions.top
          }`}
        >
          {content}

          <span
            className={`absolute h-0 w-0 ${arrows[position] || arrows.top}`}
          />
        </div>
      )}
    </div>
  );
};

export default Tooltip;
