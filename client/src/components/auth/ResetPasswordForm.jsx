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
    `mt-1.5 w-full rounded-lg border bg-white px-3 py-2.5 pr-11 text-sm text-gray-900 outline-none transition dark:bg-gray-800 dark:text-white ${
      errors[field]
        ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-100"
        : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-700"
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-2xl dark:bg-blue-900/20">
          🔐
        </div>

        <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">
          Reset Password
        </h2>

        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Create a new password for your account.
        </p>
      </div>

      {/* Backend Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* New Password */}
      <div>
        <label
          htmlFor="reset-password"
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
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
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 transition hover:text-gray-700 disabled:cursor-not-allowed dark:text-gray-400 dark:hover:text-gray-200"
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>

        {errors.password && (
          <p className="mt-1 text-xs text-red-500">{errors.password}</p>
        )}
      </div>

      {/* Confirm Password */}
      <div>
        <label
          htmlFor="reset-confirmPassword"
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
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
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 transition hover:text-gray-700 disabled:cursor-not-allowed dark:text-gray-400 dark:hover:text-gray-200"
          >
            {showConfirmPassword ? "🙈" : "👁️"}
          </button>
        </div>

        {errors.confirmPassword && (
          <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || !form.password || !form.confirmPassword}
        className="w-full rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Resetting..." : "Reset Password"}
      </button>

      {/* Optional Back Button */}
      {onBackToLogin && (
        <button
          type="button"
          onClick={onBackToLogin}
          disabled={loading}
          className="w-full rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Back to Login
        </button>
      )}
    </form>
  );
};

export default ResetPasswordForm;
