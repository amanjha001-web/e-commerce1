import { useState } from "react";

const LoginForm = ({
  onSubmit,
  loading = false,
  onForgotPassword,
  onRegister,
}) => {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});

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
  };

  const validate = () => {
    const newErrors = {};

    if (!form.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Enter a valid email.";
    }

    if (!form.password) {
      newErrors.password = "Password is required.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    onSubmit?.(form);
  };

  const inputClass = (field) =>
    `mt-1.5 w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition dark:bg-gray-800 dark:text-white ${
      errors[field]
        ? "border-red-500"
        : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-700"
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Email */}
      <div>
        <label
          htmlFor="login-email"
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Email Address
        </label>

        <input
          id="login-email"
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Enter your email"
          autoComplete="email"
          className={inputClass("email")}
        />

        {errors.email && (
          <p className="mt-1 text-xs text-red-500">{errors.email}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <div className="flex items-center justify-between">
          <label
            htmlFor="login-password"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Password
          </label>

          {onForgotPassword && (
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Forgot Password?
            </button>
          )}
        </div>

        <input
          id="login-password"
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Enter your password"
          autoComplete="current-password"
          className={inputClass("password")}
        />

        {errors.password && (
          <p className="mt-1 text-xs text-red-500">{errors.password}</p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Signing in..." : "Sign In"}
      </button>

      {/* Register */}
      {onRegister && (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={onRegister}
            className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            Create Account
          </button>
        </p>
      )}
    </form>
  );
};

export default LoginForm;
