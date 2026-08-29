import { forwardRef, useId } from "react";

const Radio = forwardRef(
  (
    {
      label,
      name,
      value,
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
    const radioId = id || `${name}-${value}` || generatedId;

    return (
      <div className={className}>
        <div className="flex items-start gap-2">
          <input
            ref={ref}
            id={radioId}
            name={name}
            type="radio"
            value={value}
            checked={checked}
            defaultChecked={defaultChecked}
            onChange={onChange}
            disabled={disabled}
            required={required}
            aria-invalid={Boolean(error)}
            className="mt-0.5 h-4 w-4 cursor-pointer border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800"
            {...props}
          />

          {label && (
            <label
              htmlFor={radioId}
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

Radio.displayName = "Radio";

export default Radio;
