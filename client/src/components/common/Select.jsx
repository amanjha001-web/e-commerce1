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
            className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--muted)]"
          >
            {label}
            {required && <span className="ml-1 text-[var(--red)]">*</span>}
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
          className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-[var(--text)] outline-none transition disabled:cursor-not-allowed disabled:bg-gray-100 dark:bg-card dark:text-foreground ${
            error
              ? "border-[var(--red)] focus:border-[var(--red)] focus:ring-2 focus:ring-[#c0394b]/20"
              : "border-[var(--line)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[#881337]/15"
          } ${selectClassName}`}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}

          {options.map((option) => {
            const isObject = typeof option === "object" && option !== null;
            const optValue = isObject ? option.value : option;
            const optLabel = isObject ? option.label : option;

            return (
              <option key={String(optValue)} value={optValue}>
                {optLabel}
              </option>
            );
          })}
        </select>

        {(error || helperText) && (
          <p
            id={`${selectId}-message`}
            className={`mt-1 text-xs ${
              error ? "text-[var(--red)]" : "text-[var(--muted)]"
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
