import { useState } from "react";

const ResetPasswordForm = ({
  onSubmit,
  onBackToLogin,
  loading = false,
  error = "",
}) => {
  const [form, setForm] = useState({
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
      submit: "",
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (!form.password) {
      newErrors.password = "Password is required.";
    } else if (form.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters.";
    }

    if (!form.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password.";
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      await onSubmit?.({
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
    } catch {
      // Error is handled by Redux/API error state.
    }
  };

  const inputClass = (field) =>
    `field mt-1.5 w-full pr-11 text-sm text-[var(--text)] ${
      errors[field]
        ? "border-[var(--red)]"
        : "border-[var(--line)]"
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--soft)] text-2xl text-[var(--primary)]">
          🔐
        </div>

        <h2 className="mt-4 text-xl font-bold text-[var(--text)]">
          Reset Password
        </h2>

        <p className="mt-2 text-xs font-medium text-[var(--muted)]">
          Create a new password for your account.
        </p>
      </div>

      {/* Backend Error */}
      {error && (
        <div className="rounded-xl border border-[#f3cbd0] bg-[#fff0f1] p-3 text-xs font-semibold text-[var(--red)]">
          {error}
        </div>
      )}

      {/* New Password */}
      <div>
        <label
          htmlFor="reset-password"
          className="text-xs font-bold uppercase tracking-wider text-[var(--text)]"
        >
          New Password
        </label>

        <div className="relative">
          <input
            id="reset-password"
            type={showPassword ? "text" : "password"}
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Enter new password"
            autoComplete="new-password"
            disabled={loading}
            className={inputClass("password")}
          />

          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            disabled={loading}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] transition hover:text-[var(--primary)] disabled:cursor-not-allowed"
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>

        {errors.password && (
          <p className="mt-1 text-xs font-semibold text-[var(--red)]">{errors.password}</p>
        )}
      </div>

      {/* Confirm Password */}
      <div>
        <label
          htmlFor="reset-confirmPassword"
          className="text-xs font-bold uppercase tracking-wider text-[var(--text)]"
        >
          Confirm Password
        </label>

        <div className="relative">
          <input
            id="reset-confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm new password"
            autoComplete="new-password"
            disabled={loading}
            className={inputClass("confirmPassword")}
          />

          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            disabled={loading}
            aria-label={
              showConfirmPassword
                ? "Hide confirm password"
                : "Show confirm password"
            }
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] transition hover:text-[var(--primary)] disabled:cursor-not-allowed"
          >
            {showConfirmPassword ? "🙈" : "👁️"}
          </button>
        </div>

        {errors.confirmPassword && (
          <p className="mt-1 text-xs font-semibold text-[var(--red)]">{errors.confirmPassword}</p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || !form.password || !form.confirmPassword}
        className="primarybtn w-full py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Resetting..." : "Reset Password"}
      </button>

      {/* Optional Back Button */}
      {onBackToLogin && (
        <button
          type="button"
          onClick={onBackToLogin}
          disabled={loading}
          className="outlinebtn w-full py-2.5 text-xs disabled:opacity-50"
        >
          Back to Login
        </button>
      )}
    </form>
  );
};

export default ResetPasswordForm;
