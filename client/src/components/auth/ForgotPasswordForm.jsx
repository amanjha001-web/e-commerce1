import { useState } from "react";

const ForgotPassword = ({ onSubmit, onBackToLogin, loading = false }) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError("Email is required.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    setError("");
    onSubmit?.(trimmedEmail);
  };

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
    setError("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="panel p-6"
    >
      <div className="mb-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--soft)] text-2xl text-[var(--primary)]">
          🔑
        </div>

        <h2 className="mt-4 text-xl font-bold text-[var(--text)]">
          Forgot Password?
        </h2>

        <p className="mt-2 text-xs font-medium leading-6 text-[var(--muted)]">
          Enter your registered email and we'll generate a password reset link.
        </p>
      </div>

      <div>
        <label
          htmlFor="forgot-email"
          className="text-xs font-bold uppercase tracking-wider text-[var(--text)]"
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
          disabled={loading}
          className={`field mt-1.5 w-full text-sm text-[var(--text)] ${
            error
              ? "border-[var(--red)]"
              : "border-[var(--line)]"
          }`}
        />

        {error && <p className="mt-1 text-xs font-semibold text-[var(--red)]">{error}</p>}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="primarybtn mt-5 w-full py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Sending..." : "Send Reset Link"}
      </button>

      {onBackToLogin && (
        <button
          type="button"
          onClick={onBackToLogin}
          disabled={loading}
          className="outlinebtn mt-3 w-full py-2.5 text-xs disabled:opacity-50"
        >
          Back to Login
        </button>
      )}
    </form>
  );
};

export default ForgotPassword;
