import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import useAuth from "../../hooks/useAuth";
import userService from "../../services/user.service";
import authService from "../../services/auth.service";
import CustomerWorkspace from "../../components/layout/CustomerWorkspace";

const Profile = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const { user, loading, getCurrentUser, updateUser } = useAuth();

  // Local form state
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    gender: "",
    dateOfBirth: "",
    bio: "",
  });

  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [fetchingGravatar, setFetchingGravatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // OTP Verification Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpMode, setOtpMode] = useState("email_update"); // 'email_update' or 'current_email_verify'
  const [otpTargetEmail, setOtpTargetEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Sync state when user object loads/changes
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || user.name || "",
        username: user.username || "",
        email: user.email || "",
        phone: user.phone || "",
        gender: user.gender || "",
        dateOfBirth: user.dateOfBirth
          ? new Date(user.dateOfBirth).toISOString().split("T")[0]
          : "",
        bio: user.bio || "",
      });
      setAvatarPreview(user.avatar?.url || (typeof user.avatar === "string" ? user.avatar : ""));
    }
  }, [user]);

  // Resend OTP countdown
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setFeedback(null);
  };

  // 1. Manual Profile Picture Upload
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (PNG, JPG, WEBP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file must be under 5MB.");
      return;
    }

    // Instant local preview
    const localUrl = URL.createObjectURL(file);
    setAvatarPreview(localUrl);

    try {
      setUploadingAvatar(true);
      const fd = new FormData();
      fd.append("avatar", file);

      const res = await userService.updateAvatar(fd);
      const updatedUser = res?.data || res;
      if (updatedUser) {
        updateUser(updatedUser);
        setAvatarPreview(updatedUser.avatar?.url || localUrl);
        toast.success("Profile photo uploaded successfully!");
      }
    } catch (err) {
      console.error("Avatar upload failed:", err);
      toast.error(err.response?.data?.message || "Failed to upload profile photo.");
      setAvatarPreview(user?.avatar?.url || "");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // 2. Fetch Profile Photo from Email (Gravatar)
  const handleFetchGravatar = async () => {
    try {
      setFetchingGravatar(true);
      const res = await userService.fetchGravatar();
      const updatedUser = res?.data || res;
      if (updatedUser) {
        updateUser(updatedUser);
        setAvatarPreview(updatedUser.avatar?.url || "");
        toast.success("Profile photo retrieved from your email (Gravatar)!");
      }
    } catch (err) {
      console.error("Gravatar fetch failed:", err);
      toast.error(err.response?.data?.message || "Could not fetch photo from email.");
    } finally {
      setFetchingGravatar(false);
    }
  };

  // 3. Remove Profile Photo
  const handleRemoveAvatar = async () => {
    try {
      setUploadingAvatar(true);
      const res = await userService.deleteAvatar();
      const updatedUser = res?.data || res;
      if (updatedUser) {
        updateUser(updatedUser);
        setAvatarPreview("");
        toast.success("Profile photo removed.");
      }
    } catch (err) {
      console.error("Delete avatar failed:", err);
      toast.error(err.response?.data?.message || "Failed to remove photo.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  // 4. Request Verification for Email (Current or Pending)
  const handleVerifyCurrentEmail = async () => {
    try {
      setOtpLoading(true);
      setOtpError("");
      const target = formData.email.trim() || user?.email;
      if (!target) {
        toast.error("Please enter a valid email address.");
        return;
      }

      const emailChanged = target.toLowerCase() !== (user?.email || "").toLowerCase();
      if (emailChanged) {
        await userService.requestEmailUpdate(target);
        setOtpMode("email_update");
      } else {
        await authService.sendVerificationOTP({ email: target });
        setOtpMode("current_email_verify");
      }

      setOtpTargetEmail(target);
      setOtpCode("");
      setShowOtpModal(true);
      setResendCooldown(60);
      toast.info(`Verification code sent to ${target}`);
    } catch (err) {
      console.error("Failed to send OTP:", err);
      toast.error(err.response?.data?.message || "Failed to send verification code.");
    } finally {
      setOtpLoading(false);
    }
  };

  // 5. Main Form Submit (Handles direct profile update or triggers OTP if email changed)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback(null);

    const emailChanged =
      formData.email.trim().toLowerCase() !== (user?.email || "").trim().toLowerCase();

    // If email changed, require verification via OTP modal
    if (emailChanged) {
      try {
        setSaving(true);
        await userService.requestEmailUpdate(formData.email.trim());
        setOtpTargetEmail(formData.email.trim());
        setOtpMode("email_update");
        setOtpCode("");
        setOtpError("");
        setShowOtpModal(true);
        setResendCooldown(60);
        toast.info(`Verification OTP sent to ${formData.email.trim()}`);
      } catch (err) {
        console.error("Failed to request email update:", err);
        const errMsg = err.response?.data?.message || "Unable to update email address.";
        setFeedback({ type: "error", message: errMsg });
        toast.error(errMsg);
      } finally {
        setSaving(false);
      }
      return;
    }

    // Direct profile fields update (Name, Phone, Username, Gender, DOB, Bio)
    try {
      setSaving(true);
      const payload = {
        name: formData.fullName.trim(),
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth || null,
        bio: formData.bio.trim(),
      };
      if (formData.username && formData.username.trim() !== "") {
        payload.username = formData.username.trim();
      }
      const res = await userService.updateProfile(payload);

      const updatedUser = res?.data || res;
      if (updatedUser) {
        updateUser(updatedUser);
        setFeedback({
          type: "success",
          message: "Profile details updated successfully!",
        });
        toast.success("Profile updated successfully!");
      }
    } catch (err) {
      console.error("Profile update failed:", err);
      const errMsg = err.response?.data?.message || "Failed to save profile changes.";
      setFeedback({ type: "error", message: errMsg });
      toast.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  // 6. Verify OTP and Commit Changes
  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length < 6) {
      setOtpError("Please enter a complete 6-digit verification code.");
      return;
    }

    try {
      setOtpLoading(true);
      setOtpError("");

      if (otpMode === "email_update") {
        const payload = {
          otp: otpCode.trim(),
          email: otpTargetEmail,
          name: formData.fullName.trim(),
          fullName: formData.fullName.trim(),
          phone: formData.phone.trim(),
          gender: formData.gender,
          dateOfBirth: formData.dateOfBirth || null,
          bio: formData.bio.trim(),
        };
        if (formData.username && formData.username.trim() !== "") {
          payload.username = formData.username.trim();
        }
        const res = await userService.verifyEmailUpdate(payload);

        const updatedUser = res?.data || res;
        if (updatedUser) {
          updateUser(updatedUser);
          setShowOtpModal(false);
          setFeedback({
            type: "success",
            message: "Email address and profile updated and verified successfully!",
          });
          toast.success("Email verified and profile updated successfully!");
        }
      } else {
        // Current email verification
        await authService.verifyOTP({
          email: otpTargetEmail,
          otp: otpCode.trim(),
        });

        updateUser({ isEmailVerified: true });
        setShowOtpModal(false);
        setFeedback({
          type: "success",
          message: "Your email has been verified successfully!",
        });
        toast.success("Email verified successfully!");
      }
    } catch (err) {
      console.error("OTP verification failed:", err);
      setOtpError(err.response?.data?.message || "Invalid or expired verification code.");
    } finally {
      setOtpLoading(false);
    }
  };

  // 7. Resend OTP handler
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    try {
      setOtpLoading(true);
      setOtpError("");
      if (otpMode === "email_update") {
        await userService.requestEmailUpdate(otpTargetEmail);
      } else {
        await authService.sendVerificationOTP({ email: otpTargetEmail });
      }
      setResendCooldown(60);
      toast.info(`A new verification code has been sent to ${otpTargetEmail}`);
    } catch (err) {
      console.error("Resend OTP failed:", err);
      setOtpError(err.response?.data?.message || "Failed to resend verification code.");
    } finally {
      setOtpLoading(false);
    }
  };

  if (loading && !user) {
    return (
      <CustomerWorkspace title="My Profile" eyebrow="Customer workspace">
        <div className="flex min-h-[300px] items-center justify-center">
          <p className="text-xs font-semibold text-[var(--muted)]">Loading profile...</p>
        </div>
      </CustomerWorkspace>
    );
  }

  if (!user) {
    return (
      <CustomerWorkspace title="My Profile" eyebrow="Customer workspace">
        <div className="rounded-2xl border border-[var(--line)] bg-white p-8 text-center shadow-xs dark:bg-card dark:border-line">
          <p className="text-sm text-[var(--muted)]">Unable to load your profile.</p>
          <button
            type="button"
            onClick={() => getCurrentUser()}
            className="primarybtn mt-4"
          >
            Try Again
          </button>
        </div>
      </CustomerWorkspace>
    );
  }

  const displayName = formData.fullName || user?.fullName || user?.name || user?.username || "Valued Customer";
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U";

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "Recent";

  return (
    <CustomerWorkspace title="My Profile" eyebrow="Customer workspace">
      <div className="space-y-6">
        {/* Feedback Alert Banner */}
        {feedback && (
          <div
            className={`flex items-start justify-between rounded-xl p-4 text-xs font-medium border ${
              feedback.type === "success"
                ? "bg-[#ecfdf5] border-[#a7f3d0] text-[#065f46]"
                : "bg-[#fff1f2] border-[#fecdd3] text-[#9f1239]"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">{feedback.type === "success" ? "✓" : "⚠"}</span>
              <span>{feedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="font-bold opacity-70 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        )}

        {/* Profile Card Header with Luxury Avatar Controls */}
        <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-xs dark:bg-card dark:border-line">
          <div className="border-b border-[var(--line)] bg-[var(--soft)]/40 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="flex items-center gap-5">
                {/* Avatar with Upload Badge */}
                <div className="relative group">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt={displayName}
                      className="h-20 w-20 sm:h-24 sm:w-24 rounded-full border-2 border-white object-cover shadow-md"
                      onError={() => setAvatarPreview("")}
                    />
                  ) : (
                    <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full bg-[var(--primary)] text-2xl font-black text-white shadow-md">
                      {initials}
                    </div>
                  )}

                  {/* Camera overlay upload trigger */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    title="Change profile picture"
                    className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--primary)] text-white shadow-md transition hover:scale-110 disabled:opacity-50"
                  >
                    <span className="text-xs">📷</span>
                  </button>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    className="hidden"
                  />
                </div>

                {/* User Info & Badges */}
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-black text-[var(--text)] dark:text-foreground">
                      {displayName}
                    </h2>
                    {user?.isEmailVerified ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#ecfdf5] px-2.5 py-0.5 text-[10px] font-bold text-[#059669] border border-[#a7f3d0]">
                        ✓ Verified
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleVerifyCurrentEmail}
                        disabled={otpLoading}
                        className="inline-flex items-center gap-1 rounded-full bg-[#fef3c7] px-2.5 py-0.5 text-[10px] font-bold text-[#b45309] border border-[#fde68a] hover:bg-[#fde68a] transition"
                        title="Click to verify your email"
                      >
                        ⚠ Unverified · Verify now
                      </button>
                    )}
                  </div>

                  <p className="mt-0.5 text-xs text-[var(--muted)]">
                    @{user?.username || "user"} · {user?.email}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="pill text-[11px] uppercase tracking-wider">
                      {user?.role === "user" ? "Customer" : user?.role || "Customer"}
                    </span>
                    <span className="text-[11px] text-[var(--muted)]">
                      Member since {memberSince}
                    </span>
                  </div>
                </div>
              </div>

              {/* Avatar Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-xs font-bold text-[var(--text)] transition hover:border-[var(--primary)] hover:text-[var(--primary)] dark:bg-card shadow-xs"
                >
                  {uploadingAvatar ? "Uploading..." : "Upload Photo"}
                </button>

                <button
                  type="button"
                  onClick={handleFetchGravatar}
                  disabled={fetchingGravatar}
                  className="rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-xs font-bold text-[var(--text)] transition hover:border-[var(--primary)] hover:text-[var(--primary)] dark:bg-card shadow-xs"
                  title="Fetch profile picture associated with your email (Gravatar)"
                >
                  {fetchingGravatar ? "Fetching..." : "✨ Photo from Email"}
                </button>

                {avatarPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    disabled={uploadingAvatar}
                    className="rounded-xl border border-transparent px-2.5 py-2 text-xs font-bold text-[#dc2626] transition hover:bg-[#fee2e2]"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Profile Edit Form */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-[var(--muted)]">
                Personal Information
              </h3>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                Update your identity and personal preferences.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {/* Full Name */}
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)]"
                >
                  Full Name <span className="text-[#dc2626]">*</span>
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-white px-3.5 py-2.5 text-sm text-[var(--text)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[#881337]/15 dark:bg-card"
                />
              </div>

              {/* Username */}
              <div>
                <label
                  htmlFor="username"
                  className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)]"
                >
                  Username
                </label>
                <div className="relative mt-1.5">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm font-bold text-[var(--muted)]">
                    @
                  </span>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="unique_handle"
                    className="w-full rounded-xl border border-[var(--line)] bg-white pl-8 pr-3.5 py-2.5 text-sm text-[var(--text)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[#881337]/15 dark:bg-card"
                  />
                </div>
              </div>

              {/* Gender */}
              <div>
                <label
                  htmlFor="gender"
                  className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)]"
                >
                  Gender
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-white px-3.5 py-2.5 text-sm text-[var(--text)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[#881337]/15 dark:bg-card"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>

              {/* Date of Birth */}
              <div>
                <label
                  htmlFor="dateOfBirth"
                  className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)]"
                >
                  Date of Birth
                </label>
                <input
                  id="dateOfBirth"
                  name="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-white px-3.5 py-2.5 text-sm text-[var(--text)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[#881337]/15 dark:bg-card"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-[var(--line)]">
              <h3 className="text-sm font-black uppercase tracking-wider text-[var(--muted)]">
                Contact Details & Security
              </h3>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                Updating your email address will require 6-digit OTP verification.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {/* Email Address */}
              <div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="email"
                    className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)]"
                  >
                    Email Address <span className="text-[#dc2626]">*</span>
                  </label>
                  {user?.isEmailVerified && formData.email.trim().toLowerCase() === (user?.email || "").trim().toLowerCase() ? (
                    <span className="text-[10px] font-bold text-[#059669]">
                      ✓ Verified
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-[#b45309]">
                      ⚠ Unverified
                    </span>
                  )}
                </div>

                <div className="relative mt-1.5 flex items-center">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your.email@example.com"
                    className="w-full rounded-xl border border-[var(--line)] bg-white px-3.5 py-2.5 pr-32 text-sm text-[var(--text)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[#881337]/15 dark:bg-card"
                  />
                  <div className="absolute right-1.5">
                    {user?.isEmailVerified && formData.email.trim().toLowerCase() === (user?.email || "").trim().toLowerCase() ? (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-[#ecfdf5] px-2.5 py-1 text-[11px] font-bold text-[#059669] border border-[#a7f3d0]">
                        ✓ Verified
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleVerifyCurrentEmail}
                        disabled={otpLoading}
                        className="inline-flex items-center gap-1 rounded-lg bg-[var(--primary)] px-2.5 py-1 text-[11px] font-bold text-white shadow-xs hover:opacity-90 transition disabled:opacity-50"
                        title="Click to verify this email with OTP"
                      >
                        {otpLoading ? "Sending..." : "✉ Verify Email"}
                      </button>
                    )}
                  </div>
                </div>

                {formData.email.trim().toLowerCase() !== (user?.email || "").trim().toLowerCase() && (
                  <p className="mt-1 text-[11px] font-semibold text-[#881337]">
                    ℹ️ Verification OTP will be sent to confirm this new email.
                  </p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label
                  htmlFor="phone"
                  className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)]"
                >
                  Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="10-digit mobile number"
                  className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-white px-3.5 py-2.5 text-sm text-[var(--text)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[#881337]/15 dark:bg-card"
                />
              </div>
            </div>

            {/* Bio / About */}
            <div>
              <label
                htmlFor="bio"
                className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)]"
              >
                About You / Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={3}
                value={formData.bio}
                onChange={handleChange}
                placeholder="A short note or personal delivery preferences..."
                maxLength={500}
                className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-white px-3.5 py-2.5 text-sm text-[var(--text)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[#881337]/15 dark:bg-card resize-none"
              />
              <span className="mt-1 block text-right text-[10px] text-[var(--muted)]">
                {formData.bio.length} / 500
              </span>
            </div>

            {/* Save Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-[var(--line)]">
              <p className="text-xs text-[var(--muted)]">
                Make sure your contact details are accurate for delivery and order alerts.
              </p>
              <button
                type="submit"
                disabled={saving || uploadingAvatar || fetchingGravatar}
                className="primarybtn min-w-[140px] justify-center"
              >
                {saving ? "Saving changes..." : "Save changes"}
              </button>
            </div>
          </form>
        </div>

        {/* Quick Access Account Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Link
            to="/orders"
            className="group rounded-2xl border border-[var(--line)] bg-white p-5 shadow-xs transition hover:border-[var(--primary)] hover:shadow-sm dark:bg-card dark:border-line"
          >
            <div className="flex items-center justify-between">
              <span className="text-xl">📦</span>
              <span className="text-xs font-bold text-[var(--primary)] group-hover:underline">
                View →
              </span>
            </div>
            <h4 className="mt-3 text-sm font-black text-[var(--text)] dark:text-foreground">
              My Orders
            </h4>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Track live shipments and order history.
            </p>
          </Link>

          <Link
            to="/addresses"
            className="group rounded-2xl border border-[var(--line)] bg-white p-5 shadow-xs transition hover:border-[var(--primary)] hover:shadow-sm dark:bg-card dark:border-line"
          >
            <div className="flex items-center justify-between">
              <span className="text-xl">📍</span>
              <span className="text-xs font-bold text-[var(--primary)] group-hover:underline">
                Manage →
              </span>
            </div>
            <h4 className="mt-3 text-sm font-black text-[var(--text)] dark:text-foreground">
              Delivery Addresses
            </h4>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Add or edit shipping addresses.
            </p>
          </Link>

          <Link
            to="/wishlist"
            className="group rounded-2xl border border-[var(--line)] bg-white p-5 shadow-xs transition hover:border-[var(--primary)] hover:shadow-sm dark:bg-card dark:border-line"
          >
            <div className="flex items-center justify-between">
              <span className="text-xl">♡</span>
              <span className="text-xs font-bold text-[var(--primary)] group-hover:underline">
                Explore →
              </span>
            </div>
            <h4 className="mt-3 text-sm font-black text-[var(--text)] dark:text-foreground">
              Saved Wishlist
            </h4>
            <p className="mt-1 text-xs text-[var(--muted)]">
              View your favourite luxury items.
            </p>
          </Link>
        </div>
      </div>

      {/* Verification OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-white p-6 sm:p-8 shadow-xl dark:bg-card dark:border-line animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--soft)] text-[var(--primary)] text-lg">
                  🔐
                </div>
                <div>
                  <h3 className="text-base font-black text-[var(--text)] dark:text-foreground">
                    Verify Verification Code
                  </h3>
                  <p className="text-[11px] text-[var(--muted)]">
                    {otpMode === "email_update"
                      ? "Confirm your new email address"
                      : "Verify your account email"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowOtpModal(false)}
                className="text-[var(--muted)] hover:text-[var(--text)] text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleVerifyOtpSubmit} className="mt-6 space-y-4">
              <p className="text-xs leading-relaxed text-[var(--text)] dark:text-foreground">
                We sent a 6-digit verification code to{" "}
                <span className="font-bold text-[var(--primary)]">{otpTargetEmail}</span>.
                Please enter the code below to complete your verification.
              </p>

              <div>
                <label
                  htmlFor="otpCode"
                  className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)]"
                >
                  6-Digit OTP Code
                </label>
                <input
                  id="otpCode"
                  type="text"
                  maxLength={6}
                  autoFocus
                  required
                  value={otpCode}
                  onChange={(e) => {
                    setOtpCode(e.target.value.replace(/\D/g, ""));
                    setOtpError("");
                  }}
                  placeholder="123456"
                  className="mt-1.5 w-full text-center tracking-[8px] font-mono font-black text-lg rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-[var(--text)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[#881337]/15 dark:bg-card"
                />
              </div>

              {otpError && (
                <div className="rounded-xl bg-[#fff1f2] border border-[#fecdd3] p-3 text-xs text-[#9f1239] font-medium">
                  {otpError}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  disabled={resendCooldown > 0 || otpLoading}
                  onClick={handleResendOtp}
                  className="text-xs font-bold text-[var(--primary)] hover:underline disabled:opacity-50 disabled:no-underline"
                >
                  {resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : "Resend Code"}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowOtpModal(false)}
                    className="rounded-xl border border-[var(--line)] px-3.5 py-2 text-xs font-bold text-[var(--muted)] hover:text-[var(--text)] transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={otpLoading || otpCode.length < 6}
                    className="primarybtn text-xs py-2 px-4"
                  >
                    {otpLoading ? "Verifying..." : "Verify & Save"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </CustomerWorkspace>
  );
};

export default Profile;