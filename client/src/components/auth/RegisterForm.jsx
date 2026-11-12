
import { useState } from "react";

const RegisterForm = ({
  onSubmit,
  loading = false,
  onLogin,
  error = "",
}) => {
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});

  // Backend error ko form ke andar show karne ke liye
  const getErrorMessage = (err) => {
    if (!err) return "";

    if (typeof err === "string") {
      return err;
    }

    return (
      err?.response?.data?.message ||
      err?.data?.message ||
      err?.message ||
      "Something went wrong. Please try again."
    );
  };

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
      !/^[a-zA-Z0-9_]{3,30}$/.test(form.username.trim())
    ) {
      newErrors.username =
        "Username must be 3-30 characters and contain only letters, numbers, and underscores.";
    }

    // Email
    if (!form.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
    ) {
      newErrors.email = "Enter a valid email.";
    }

    // Password
    if (!form.password) {
      newErrors.password = "Password is required.";
    } else {
      if (form.password.length < 8) {
        newErrors.password =
          "Password must be at least 8 characters.";
      } else if (!/[A-Z]/.test(form.password)) {
        newErrors.password =
          "Password must contain one uppercase letter.";
      } else if (!/[a-z]/.test(form.password)) {
        newErrors.password =
          "Password must contain one lowercase letter.";
      } else if (!/[0-9]/.test(form.password)) {
        newErrors.password =
          "Password must contain one number.";
      } else if (!/[^a-zA-Z0-9]/.test(form.password)) {
        newErrors.password =
          "Password must contain one special character.";
      }
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

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Purane backend error ko clear karo
    setErrors({});

    if (!validate()) {
      return;
    }

    const data = {
      fullName: form.fullName.trim(),
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password,
      confirmPassword: form.confirmPassword,
    };

    try {
      const result = await onSubmit?.(data);

      // Agar parent false return kare, toh error show karo
      if (result === false) {
        setErrors({
          submit:
            getErrorMessage(error) ||
            "Registration failed. Please check your details.",
        });
      }
    } catch (err) {
      setErrors({
        submit: getErrorMessage(err),
      });
    }
  };

  const inputClass = (field) =>
    `field mt-1.5 w-full text-sm text-[var(--text)] ${
      errors[field]
        ? "border-[var(--red)]"
        : "border-[var(--line)]"
    }`;

  // Local ya backend error ko display karne ke liye
  const submitError = errors.submit || getErrorMessage(error);

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
      noValidate
    >
      {/* Full Name */}
      <div>
        <label
          htmlFor="register-fullName"
          className="text-xs font-bold uppercase tracking-wider text-[var(--text)]"
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
          <p className="mt-1 text-xs font-semibold text-[var(--red)]">
            {errors.fullName}
          </p>
        )}
      </div>

      {/* Username */}
      <div>
        <label
          htmlFor="register-username"
          className="text-xs font-bold uppercase tracking-wider text-[var(--text)]"
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
          <p className="mt-1 text-xs font-semibold text-[var(--red)]">
            {errors.username}
          </p>
        )}
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="register-email"
          className="text-xs font-bold uppercase tracking-wider text-[var(--text)]"
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
          <p className="mt-1 text-xs font-semibold text-[var(--red)]">
            {errors.email}
          </p>
        )}
      </div>

      {/* Password */}
      <div>
        <label
          htmlFor="register-password"
          className="text-xs font-bold uppercase tracking-wider text-[var(--text)]"
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
          <p className="mt-1 text-xs font-semibold text-[var(--red)]">
            {errors.password}
          </p>
        )}
      </div>

      {/* Confirm Password */}
      <div>
        <label
          htmlFor="register-confirmPassword"
          className="text-xs font-bold uppercase tracking-wider text-[var(--text)]"
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
          <p className="mt-1 text-xs font-semibold text-[var(--red)]">
            {errors.confirmPassword}
          </p>
        )}
      </div>

      {/* Backend / Submit Error */}
      {submitError && (
        <p
          role="alert"
          aria-live="polite"
          className="rounded-xl border border-[#f3cbd0] bg-[#fff0f1] p-3 text-xs font-semibold text-[var(--red)]"
        >
          {submitError}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="primarybtn w-full py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading
          ? "Creating Account..."
          : "Create Account"}
      </button>

      {/* Login */}
      {onLogin && (
        <p className="text-center text-xs font-medium text-[var(--muted)]">
          Already have an account?{" "}

          <button
            type="button"
            onClick={onLogin}
            className="font-bold text-[var(--primary)] hover:underline"
          >
            Sign In
          </button>
        </p>
      )}
    </form>
  );
};

export default RegisterForm;
