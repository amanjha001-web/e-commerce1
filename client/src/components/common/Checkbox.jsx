import { forwardRef, useId } from "react";

const Checkbox = forwardRef(
  (
    {
      label,
      name,
      checked,
      defaultChecked,
      onChange,
      error,
      disabled = false,
      required = false,
      id,
      className = "",
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const checkboxId = id || name || generatedId;

    return (
      <div className={className}>
        <div className="flex items-start gap-2">
          <input
            ref={ref}
            id={checkboxId}
            name={name}
            type="checkbox"
            checked={checked}
            defaultChecked={defaultChecked}
            onChange={onChange}
            disabled={disabled}
            required={required}
            aria-invalid={Boolean(error)}
            className="mt-0.5 h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800"
            {...props}
          />

          {label && (
            <label
              htmlFor={checkboxId}
              className={`cursor-pointer text-sm ${
                disabled
                  ? "cursor-not-allowed text-gray-400"
                  : "text-gray-700 dark:text-gray-200"
              }`}
            >
              {label}

              {required && <span className="ml-1 text-red-500">*</span>}
            </label>
          )}
        </div>

        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    );
  },
);

Checkbox.displayName = "Checkbox";

export default Checkbox;
