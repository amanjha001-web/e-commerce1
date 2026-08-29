import { forwardRef, useId } from "react";

const Select = forwardRef(
  (
    {
      label,
      name,
      value,
      defaultValue,
      onChange,
      onBlur,
      options = [],
      placeholder = "Select an option",
      error,
      helperText,
      required = false,
      disabled = false,
      fullWidth = true,
      className = "",
      selectClassName = "",
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const selectId = props.id || name || generatedId;

    return (
      <div className={`${fullWidth ? "w-full" : ""} ${className}`}>
        {label && (
          <label
            htmlFor={selectId}
            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            {label}

            {required && <span className="ml-1 text-red-500">*</span>}
          </label>
        )}

        <select
          ref={ref}
          id={selectId}
          name={name}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          onBlur={onBlur}
          required={required}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error || helperText ? `${selectId}-message` : undefined
          }
          className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:disabled:bg-gray-800 ${
            error
              ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
              : "border-gray-300"
          } ${selectClassName}`}
          {...props}
        >
          <option value="">{placeholder}</option>

          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>

        {(error || helperText) && (
          <p
            id={`${selectId}-message`}
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

Select.displayName = "Select";

export default Select;
