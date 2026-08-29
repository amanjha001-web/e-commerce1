import { useEffect, useRef, useState } from "react";

const OTPForm = ({
  length = 6,
  onSubmit,
  onResend,
  onBack,
  loading = false,
  resendCooldown = 30,
}) => {
  const [otp, setOtp] = useState(Array(length).fill(""));

  const [seconds, setSeconds] = useState(resendCooldown);

  const [error, setError] = useState("");

  const inputRefs = useRef([]);

  useEffect(() => {
    if (seconds <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setSeconds((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [seconds]);

  const handleChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);

    const newOtp = [...otp];
    newOtp[index] = digit;

    setOtp(newOtp);
    setError("");

    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (event, index) => {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();

    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);

    if (!pasted) {
      return;
    }

    const newOtp = Array(length).fill("");

    pasted.split("").forEach((digit, index) => {
      newOtp[index] = digit;
    });

    setOtp(newOtp);
    setError("");

    const nextIndex = Math.min(pasted.length, length - 1);

    inputRefs.current[nextIndex]?.focus();
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const otpValue = otp.join("");

    if (otpValue.length !== length) {
      setError(`Please enter the complete ${length}-digit OTP.`);
      return;
    }

    onSubmit?.(otpValue);
  };

  const handleResend = async () => {
    if (seconds > 0 || loading) {
      return;
    }

    setError("");

    await onResend?.();

    setOtp(Array(length).fill(""));
    setSeconds(resendCooldown);

    inputRefs.current[0]?.focus();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
    >
      <div className="mb-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-2xl dark:bg-blue-900/20">
          🔢
        </div>

        <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">
          Verify OTP
        </h2>

        <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
          Enter the OTP sent to your registered email or phone number.
        </p>
      </div>

      {/* OTP Inputs */}
      <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(element) => {
              inputRefs.current[index] = element;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(event) => handleChange(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            autoComplete={index === 0 ? "one-time-code" : "off"}
            aria-label={`OTP digit ${index + 1}`}
            className={`h-12 w-10 rounded-lg border bg-white text-center text-lg font-bold text-gray-900 outline-none transition sm:h-14 sm:w-12 ${
              error
                ? "border-red-500"
                : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-700"
            } dark:bg-gray-800 dark:text-white`}
          />
        ))}
      </div>

      {error && (
        <p className="mt-3 text-center text-xs text-red-500">{error}</p>
      )}

      {/* Verify */}
      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Verifying..." : "Verify OTP"}
      </button>

      {/* Resend */}
      <div className="mt-5 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Didn't receive the code?
        </p>

        <button
          type="button"
          onClick={handleResend}
          disabled={seconds > 0 || loading}
          className="mt-1 text-sm font-semibold text-blue-600 disabled:cursor-not-allowed disabled:text-gray-400 dark:text-blue-400 dark:disabled:text-gray-600"
        >
          {seconds > 0 ? `Resend OTP in ${seconds}s` : "Resend OTP"}
        </button>
      </div>

      {/* Back */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="mt-4 w-full rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Back
        </button>
      )}
    </form>
  );
};

export default OTPForm;
