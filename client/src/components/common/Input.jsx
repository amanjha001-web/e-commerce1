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
            className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--muted)]"
          >
            {label}
            {required && <span className="ml-1 text-[var(--red)]">*</span>}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]">
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
            className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--muted)]/70 disabled:cursor-not-allowed disabled:bg-gray-100 dark:bg-card dark:text-foreground ${
              leftIcon ? "pl-10" : ""
            } ${rightIcon ? "pr-10" : ""} ${
              error
                ? "border-[var(--red)] focus:border-[var(--red)] focus:ring-2 focus:ring-[#c0394b]/20"
                : "border-[var(--line)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[#881337]/15"
            } ${inputClassName}`}
            {...props}
          />

          {rightIcon && (
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]">
              {rightIcon}
            </span>
          )}
        </div>

        {(error || helperText) && (
          <p
            id={`${inputId}-message`}
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

Input.displayName = "Input";

export default Input;
