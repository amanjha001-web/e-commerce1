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
      className="panel p-6"
    >
      <div className="mb-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--soft)] text-2xl text-[var(--primary)]">
          🔢
        </div>

        <h2 className="mt-4 text-xl font-bold text-[var(--text)]">
          Verify OTP
        </h2>

        <p className="mt-2 text-xs font-medium leading-6 text-[var(--muted)]">
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
            className={`h-12 w-10 rounded-xl border bg-white text-center text-lg font-bold text-[var(--text)] outline-none transition sm:h-14 sm:w-12 ${
              error
                ? "border-[var(--red)]"
                : "border-[var(--line)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
            }`}
          />
        ))}
      </div>

      {error && (
        <p className="mt-3 text-center text-xs font-semibold text-[var(--red)]">{error}</p>
      )}

      {/* Verify */}
      <button
        type="submit"
        disabled={loading}
        className="primarybtn mt-6 w-full py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Verifying..." : "Verify OTP"}
      </button>

      {/* Resend */}
      <div className="mt-5 text-center">
        <p className="text-xs font-medium text-[var(--muted)]">
          Didn't receive the code?
        </p>

        <button
          type="button"
          onClick={handleResend}
          disabled={seconds > 0 || loading}
          className="mt-1 text-xs font-bold text-[var(--primary)] hover:underline disabled:cursor-not-allowed disabled:text-[var(--muted)]"
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
          className="outlinebtn mt-4 w-full py-2.5 text-xs disabled:opacity-50"
        >
          Back
        </button>
      )}
    </form>
  );
};

export default OTPForm;


