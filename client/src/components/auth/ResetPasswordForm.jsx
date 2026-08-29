import { useState } from "react";

const ResetPassword = ({
  token = "",
  onSubmit,
  onBackToLogin,
  loading = false,
}) => {
  const [form, setForm] = useState({
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});

  const [success, setSuccess] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));

    setSuccess(false);
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
        token,
        password: form.password,
      });

      setSuccess(true);
    } catch {
      setErrors({
        submit: "Unable to reset password. Please try again.",
      });
    }
  };

  const inputClass = (field) =>
    `mt-1.5 w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition dark:bg-gray-800 dark:text-white ${
      errors[field]
        ? "border-red-500"
        : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-700"
    }`;

  if (success) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-center dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-2xl text-green-600 dark:bg-green-900/30 dark:text-green-400">
          ✓
        </div>

        <h2 className="mt-5 text-xl font-bold text-gray-900 dark:text-white">
          Password Reset Successful
        </h2>

        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Your password has been updated successfully.
        </p>

        {onBackToLogin && (
          <button
            type="button"
            onClick={onBackToLogin}
            className="mt-6 w-full rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Back to Login
          </button>
        )}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
    >
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

      {/* Password */}
      <div>
        <label
          htmlFor="reset-password"
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          New Password
        </label>

        <input
          id="reset-password"
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Enter new password"
          autoComplete="new-password"
          className={inputClass("password")}
        />

        {errors.password && (
          <p className="mt-1 text-xs text-red-500">{errors.password}</p>
        )}
      </div>

      {/* Confirm Password */}
      <div className="mt-4">
        <label
          htmlFor="reset-confirmPassword"
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Confirm Password
        </label>

        <input
          id="reset-confirmPassword"
          type="password"
          name="confirmPassword"
          value={form.confirmPassword}
          onChange={handleChange}
          placeholder="Confirm new password"
          autoComplete="new-password"
          className={inputClass("confirmPassword")}
        />

        {errors.confirmPassword && (
          <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>
        )}
      </div>

      {errors.submit && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {errors.submit}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-5 w-full rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Resetting..." : "Reset Password"}
      </button>

      {onBackToLogin && (
        <button
          type="button"
          onClick={onBackToLogin}
          disabled={loading}
          className="mt-3 w-full rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Back to Login
        </button>
      )}
    </form>
  );
};

export default ResetPassword;
