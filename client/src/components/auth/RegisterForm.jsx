
import { useState } from "react";

const RegisterForm = ({
  onSubmit,
  loading = false,
  onLogin,
}) => {
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
      submit: "",
    }));
  };

  const validate = () => {
    const newErrors = {};

    // Full Name
    if (!form.fullName.trim()) {
      newErrors.fullName = "Full name is required.";
    }

    // Username
    if (!form.username.trim()) {
      newErrors.username = "Username is required.";
    } else if (
      !/^[a-zA-Z0-9_]{3,30}$/.test(form.username)
    ) {
      newErrors.username =
        "Username must be 3-30 characters and contain only letters, numbers, and underscores.";
    }

    // Email
    if (!form.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
    ) {
      newErrors.email = "Enter a valid email.";
    }

    // Password
    if (!form.password) {
      newErrors.password = "Password is required.";
    } else if (form.password.length < 8) {
      newErrors.password =
        "Password must be at least 8 characters.";
    }

    // Confirm Password
    if (!form.confirmPassword) {
      newErrors.confirmPassword =
        "Please confirm your password.";
    } else if (
      form.password !== form.confirmPassword
    ) {
      newErrors.confirmPassword =
        "Passwords do not match.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    // Don't send confirmPassword to backend.
    const data = {
      fullName: form.fullName.trim(),
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password,
    };

    onSubmit?.(data);
  };

  const inputClass = (field) =>
    `mt-1.5 w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition dark:bg-gray-800 dark:text-white ${
      errors[field]
        ? "border-red-500"
        : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-700"
    }`;

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      {/* Full Name */}
      <div>
        <label
          htmlFor="register-fullName"
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Full Name
        </label>

        <input
          id="register-fullName"
          name="fullName"
          value={form.fullName}
          onChange={handleChange}
          placeholder="Enter your full name"
          autoComplete="name"
          className={inputClass("fullName")}
        />

        {errors.fullName && (
          <p className="mt-1 text-xs text-red-500">
            {errors.fullName}
          </p>
        )}
      </div>

      {/* Username */}
      <div>
        <label
          htmlFor="register-username"
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Username
        </label>

        <input
          id="register-username"
          name="username"
          value={form.username}
          onChange={handleChange}
          placeholder="Choose a username"
          autoComplete="username"
          className={inputClass("username")}
        />

        {errors.username && (
          <p className="mt-1 text-xs text-red-500">
            {errors.username}
          </p>
        )}
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="register-email"
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Email Address
        </label>

        <input
          id="register-email"
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Enter your email"
          autoComplete="email"
          className={inputClass("email")}
        />

        {errors.email && (
          <p className="mt-1 text-xs text-red-500">
            {errors.email}
          </p>
        )}
      </div>

      {/* Password */}
      <div>
        <label
          htmlFor="register-password"
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Password
        </label>

        <input
          id="register-password"
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Create a password"
          autoComplete="new-password"
          className={inputClass("password")}
        />

        {errors.password && (
          <p className="mt-1 text-xs text-red-500">
            {errors.password}
          </p>
        )}
      </div>

      {/* Confirm Password */}
      <div>
        <label
          htmlFor="register-confirmPassword"
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Confirm Password
        </label>

        <input
          id="register-confirmPassword"
          type="password"
          name="confirmPassword"
          value={form.confirmPassword}
          onChange={handleChange}
          placeholder="Confirm your password"
          autoComplete="new-password"
          className={inputClass("confirmPassword")}
        />

        {errors.confirmPassword && (
          <p className="mt-1 text-xs text-red-500">
            {errors.confirmPassword}
          </p>
        )}
      </div>

      {/* Submit Error */}
      {errors.submit && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {errors.submit}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading
          ? "Creating Account..."
          : "Create Account"}
      </button>

      {/* Login */}
      {onLogin && (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          Already have an account?{" "}

          <button
            type="button"
            onClick={onLogin}
            className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            Sign In
          </button>
        </p>
      )}
    </form>
  );
};

export default RegisterForm;
