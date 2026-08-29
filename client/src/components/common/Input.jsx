import { forwardRef, useId } from "react";

const Input = forwardRef(
  (
    {
      label,
      name,
      type = "text",
      placeholder = "",
      value,
      defaultValue,
      onChange,
      onBlur,
      error,
      helperText,
      required = false,
      disabled = false,
      readOnly = false,
      fullWidth = true,
      className = "",
      inputClassName = "",
      leftIcon,
      rightIcon,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = props.id || name || generatedId;

    return (
      <div className={`${fullWidth ? "w-full" : ""} ${className}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            {label}

            {required && <span className="ml-1 text-red-500">*</span>}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            name={name}
            type={type}
            placeholder={placeholder}
            value={value}
            defaultValue={defaultValue}
            onChange={onChange}
            onBlur={onBlur}
            required={required}
            disabled={disabled}
            readOnly={readOnly}
            aria-invalid={Boolean(error)}
            aria-describedby={
              error || helperText ? `${inputId}-message` : undefined
            }
            className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 disabled:cursor-not-allowed disabled:bg-gray-100 dark:bg-gray-900 dark:text-white dark:disabled:bg-gray-800 ${
              leftIcon ? "pl-10" : ""
            } ${rightIcon ? "pr-10" : ""} ${
              error
                ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700"
            } ${inputClassName}`}
            {...props}
          />

          {rightIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {rightIcon}
            </span>
          )}
        </div>

        {(error || helperText) && (
          <p
            id={`${inputId}-message`}
            className={`mt-1 text-xs ${
              error ? "text-red-500" : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;
