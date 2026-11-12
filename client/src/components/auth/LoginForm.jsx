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
    `mt-1.5 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-[var(--text)] outline-none transition dark:bg-card dark:text-foreground ${
      errors[field]
        ? "border-[var(--red)] focus:border-[var(--red)] focus:ring-2 focus:ring-[#c0394b]/20"
        : "border-[var(--line)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[#881337]/15"
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Email */}
      <div>
        <label
          htmlFor="login-email"
          className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]"
        >
          Email address
        </label>

        <input
          id="login-email"
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="you@example.com"
          autoComplete="email"
          className={inputClass("email")}
        />

        {errors.email && (
          <p className="mt-1 text-xs text-[var(--red)]">{errors.email}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <div className="flex items-center justify-between">
          <label
            htmlFor="login-password"
            className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]"
          >
            Password
          </label>

          {onForgotPassword && (
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-xs font-semibold text-[var(--primary)] hover:underline"
            >
              Forgot password?
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
          <p className="mt-1 text-xs text-[var(--red)]">{errors.password}</p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="primarybtn w-full !py-3 !text-sm !rounded-xl"
      >
        {loading ? "Signing in..." : "Sign in →"}
      </button>

      {/* Register */}
      {onRegister && (
        <p className="text-center text-xs text-[var(--muted)]">
          New to ShopSphere?{" "}
          <button
            type="button"
            onClick={onRegister}
            className="font-bold text-[var(--primary)] hover:underline"
          >
            Create an account
          </button>
        </p>
      )}
    </form>
  );
};

export default LoginForm;
