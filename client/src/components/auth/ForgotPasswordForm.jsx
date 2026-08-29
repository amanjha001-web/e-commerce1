import { useState } from "react";

const ForgotPassword = ({ onSubmit, onBackToLogin, loading = false }) => {
  const [email, setEmail] = useState("");

  const [error, setError] = useState("");

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }

    setError("");
    setSubmitted(true);

    onSubmit?.(email);
  };

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
    setError("");
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-center dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-2xl text-green-600 dark:bg-green-900/30 dark:text-green-400">
          ✓
        </div>

        <h2 className="mt-5 text-xl font-bold text-gray-900 dark:text-white">
          Check Your Email
        </h2>

        <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
          If an account exists for{" "}
          <span className="font-semibold text-gray-700 dark:text-gray-300">
            {email}
          </span>
          , we've sent password reset instructions.
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
          🔑
        </div>

        <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">
          Forgot Password?
        </h2>

        <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
          Enter your registered email and we'll send you a link to reset your
          password.
        </p>
      </div>

      <div>
        <label
          htmlFor="forgot-email"
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Email Address
        </label>

        <input
          id="forgot-email"
          type="email"
          value={email}
          onChange={handleEmailChange}
          placeholder="Enter your email"
          autoComplete="email"
          className={`mt-1.5 w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition dark:bg-gray-800 dark:text-white ${
            error
              ? "border-red-500"
              : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-700"
          }`}
        />

        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-5 w-full rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Sending..." : "Send Reset Link"}
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

export default ForgotPassword;
