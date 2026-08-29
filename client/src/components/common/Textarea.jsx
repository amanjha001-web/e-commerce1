import { forwardRef, useId } from "react";

const Textarea = forwardRef(
  (
    {
      label,
      name,
      value,
      defaultValue,
      onChange,
      onBlur,
      placeholder = "",
      rows = 4,
      error,
      helperText,
      required = false,
      disabled = false,
      readOnly = false,
      maxLength,
      showCount = false,
      fullWidth = true,
      className = "",
      textareaClassName = "",
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const textareaId = props.id || name || generatedId;

    const currentLength = typeof value === "string" ? value.length : 0;

    return (
      <div className={`${fullWidth ? "w-full" : ""} ${className}`}>
        {label && (
          <label
            htmlFor={textareaId}
            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            {label}

            {required && <span className="ml-1 text-red-500">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          name={name}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          rows={rows}
          required={required}
          disabled={disabled}
          readOnly={readOnly}
          maxLength={maxLength}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error || helperText || showCount
              ? `${textareaId}-message`
              : undefined
          }
          className={`w-full resize-y rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:disabled:bg-gray-800 ${
            error
              ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
              : "border-gray-300"
          } ${textareaClassName}`}
          {...props}
        />

        {(error || helperText || showCount) && (
          <div
            id={`${textareaId}-message`}
            className="mt-1 flex items-center justify-between gap-2"
          >
            <p
              className={`text-xs ${
                error ? "text-red-500" : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {error || helperText}
            </p>

            {showCount && maxLength && (
              <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                {currentLength}/{maxLength}
              </span>
            )}
          </div>
        )}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";

export default Textarea;
