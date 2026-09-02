
import { useState } from "react";

import Avatar from "../../components/common/Avatar";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Loader from "../../components/common/Loader";

const Profile = ({
  user = null,
  loading = false,
  saving = false,
  onUpdateProfile,
  onUploadAvatar,
  onNavigate,
}) => {
  const [form, setForm] = useState({
    fullName: user?.fullName || "",
    username: user?.username || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  const [avatarFile, setAvatarFile] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onUpdateProfile?.(form);
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setAvatarFile(file);
    onUploadAvatar?.(file);
  };

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-4 py-10">
        <Loader />
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm font-medium text-primary">
          Account
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
          My Profile
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Manage your personal information and account details.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* Profile Card */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <Avatar
              src={
                user?.avatar ||
                user?.profileImage ||
                user?.image
              }
              alt={user?.fullName || "Profile"}
              size="xl"
            />

            <h2 className="mt-4 font-semibold">
              {user?.fullName || "Your Name"}
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {user?.email || "No email available"}
            </p>

            <label className="mt-5 inline-flex cursor-pointer">
              <span className="rounded-xl border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted">
                {avatarFile ? "Change Photo" : "Upload Photo"}
              </span>

              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </label>
          </div>

          <div className="mt-6 border-t border-border pt-5">
            <button
              type="button"
              onClick={() => onNavigate?.("/orders")}
              className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm font-medium transition hover:bg-muted"
            >
              <span>My Orders</span>
              <span>→</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate?.("/wishlist")}
              className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm font-medium transition hover:bg-muted"
            >
              <span>Wishlist</span>
              <span>→</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate?.("/addresses")}
              className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm font-medium transition hover:bg-muted"
            >
              <span>Addresses</span>
              <span>→</span>
            </button>
          </div>
        </section>

        {/* Profile Form */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">
              Personal Information
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Update the information associated with your account.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                label="Full Name"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder="Enter your full name"
              />

              <Input
                label="Username"
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="Enter your username"
              />

              <Input
                label="Email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter your email"
                disabled
              />

              <Input
                label="Phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Enter your phone number"
              />
            </div>

            <div className="border-t border-border pt-5">
              <Button
                type="submit"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </section>
      </div>

      {/* Account Shortcuts */}
      <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <h2 className="font-semibold">
          Account Settings
        </h2>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => onNavigate?.("/notifications")}
            className="rounded-xl border border-border p-4 text-left transition hover:bg-muted"
          >
            <p className="font-medium">
              Notifications
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Manage your notifications.
            </p>
          </button>

          <button
            type="button"
            onClick={() => onNavigate?.("/support")}
            className="rounded-xl border border-border p-4 text-left transition hover:bg-muted"
          >
            <p className="font-medium">
              Support
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Get help with your account or orders.
            </p>
          </button>

          <button
            type="button"
            onClick={() => onNavigate?.("/")}
            className="rounded-xl border border-border p-4 text-left transition hover:bg-muted"
          >
            <p className="font-medium">
              Continue Shopping
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Browse products and categories.
            </p>
          </button>
        </div>
      </section>
    </main>
  );
};

export default Profile;
