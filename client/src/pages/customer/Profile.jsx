import { useState } from "react";
import { useNavigate } from "react-router-dom";

import useAuth from "../../hooks/useAuth";

const Profile = () => {
  const navigate = useNavigate();

  const { user, loading, getCurrentUser, updateProfile, updatingProfile } =
    useAuth();

  const [form, setForm] = useState(null);

  // User ke actual database data ko form ke initial data ke liye use karo
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

    if (result.meta.requestStatus === "fulfilled") {
      setForm(null);
    }
  };

  // User abhi load ho raha hai
  if (loading && !user) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    );
  }

  // User nahi mila
  if (!user) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Unable to load profile.</p>

          <button
            type="button"
            onClick={() => getCurrentUser()}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const avatarUrl = user?.avatar?.url || "";
  const displayName = user?.fullName || user?.username || "User";

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          My Profile
        </h1>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your account information
        </p>
      </div>

      {/* Profile Card */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        {/* Profile Header */}
        <div className="border-b border-gray-200 px-6 py-6 dark:border-gray-800">
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}

            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {displayName}
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                @{user?.username || "username"}
              </p>

              <span className="mt-2 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-medium capitalize text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                {user?.role || "customer"}
              </span>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Full Name */}
            <div>
              <label
                htmlFor="fullName"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Full Name
              </label>

              <input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Username
              </label>

              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Email Address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            {/* Phone */}
            <div>
              <label
                htmlFor="phone"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Phone Number
              </label>

              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>

          {/* Account Information */}
          <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/50">
            <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
              Account Information
            </h3>

            <div className="grid gap-4 text-sm md:grid-cols-2">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Role</span>

                <p className="mt-1 font-medium capitalize text-gray-900 dark:text-white">
                  {user?.role || "customer"}
                </p>
              </div>

              <div>
                <span className="text-gray-500 dark:text-gray-400">
                  Email Verified
                </span>

                <p className="mt-1 font-medium text-gray-900 dark:text-white">
                  {user?.isVerified ? "Verified" : "Not Verified"}
                </p>
              </div>

              <div>
                <span className="text-gray-500 dark:text-gray-400">
                  Account Created
                </span>

                <p className="mt-1 font-medium text-gray-900 dark:text-white">
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString()
                    : "—"}
                </p>
              </div>

              <div>
                <span className="text-gray-500 dark:text-gray-400">
                  Last Login
                </span>

                <p className="mt-1 font-medium text-gray-900 dark:text-white">
                  {user?.lastLogin
                    ? new Date(user.lastLogin).toLocaleDateString()
                    : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={updatingProfile}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {updatingProfile ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
