import { useState } from "react";
import { useNavigate } from "react-router-dom";

import useAuth from "../../hooks/useAuth";
import CustomerWorkspace from "../../components/layout/CustomerWorkspace";

const Profile = () => {
  const navigate = useNavigate();

  const { user, loading, getCurrentUser, updateProfile, updatingProfile } =
    useAuth();

  const [form, setForm] = useState(null);

  const formData = form || {
    fullName: user?.fullName || "",
    username: user?.username || "",
    email: user?.email || "",
    phone: user?.phone || "",
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...(prev || {
        fullName: user?.fullName || "",
        username: user?.username || "",
        email: user?.email || "",
        phone: user?.phone || "",
      }),
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const result = await updateProfile(formData);

    if (result?.meta?.requestStatus === "fulfilled") {
      setForm(null);
    }
  };

  if (loading && !user) {
    return (
      <CustomerWorkspace title="My Profile">
        <div className="flex min-h-[300px] items-center justify-center">
          <p className="text-xs text-[var(--muted)]">Loading profile...</p>
        </div>
      </CustomerWorkspace>
    );
  }

  if (!user) {
    return (
      <CustomerWorkspace title="My Profile">
        <div className="rounded-2xl border border-[var(--line)] bg-white p-8 text-center shadow-xs">
          <p className="text-sm text-[var(--muted)]">Unable to load profile.</p>
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

  const avatarUrl = user?.avatar?.url || "";
  const displayName = user?.fullName || user?.username || "User";

  return (
    <CustomerWorkspace title="My Profile" eyebrow="Customer workspace">
      <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-xs dark:bg-card dark:border-line">
        {/* Profile Card Header */}
        <div className="border-b border-[var(--line)] bg-[var(--soft)]/40 p-6 sm:p-8">
          <div className="flex items-center gap-5">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="h-20 w-20 rounded-full border-2 border-white object-cover shadow-sm"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--primary)] text-2xl font-black text-white shadow-sm">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}

            <div>
              <h2 className="text-xl font-black text-[var(--text)] dark:text-foreground">
                {displayName}
              </h2>
              <p className="text-xs text-[var(--muted)]">
                @{user?.username || "username"} · {user?.email}
              </p>
              <span className="pill mt-2">
                {user?.role || "Customer"}
              </span>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          <div className="grid gap-5 sm:grid-cols-2">
            {/* Full Name */}
            <div>
              <label
                htmlFor="fullName"
                className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)]"
              >
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
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
              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-white px-3.5 py-2.5 text-sm text-[var(--text)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[#881337]/15 dark:bg-card"
              />
            </div>

            {/* Email Address */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)]"
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-white px-3.5 py-2.5 text-sm text-[var(--text)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[#881337]/15 dark:bg-card"
              />
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
                placeholder="10-digit mobile"
                className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-white px-3.5 py-2.5 text-sm text-[var(--text)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[#881337]/15 dark:bg-card"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-[var(--line)]">
            <button
              type="submit"
              disabled={updatingProfile}
              className="primarybtn"
            >
              {updatingProfile ? "Saving changes..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </CustomerWorkspace>
  );
};

export default Profile;
