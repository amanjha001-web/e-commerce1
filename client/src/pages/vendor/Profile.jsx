import { useState } from "react";

import VendorHeader from "../../components/vendor/VendorHeader";
import VendorSidebar from "../../components/vendor/VendorSidebar";

import Avatar from "../../components/common/Avatar";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Loader from "../../components/common/Loader";

const Profile = ({
  user = null,
  loading = false,
  saving = false,
  notificationCount = 0,

  onUpdateProfile,
  onUploadAvatar,
  onNavigate,
  onLogout,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [form, setForm] = useState(() => ({
    fullName: user?.fullName || "",
    username: user?.username || "",
    email: user?.email || "",
    phone: user?.phone || "",
  }));

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const handleNavigate = (item) => {
    setSidebarOpen(false);
    onNavigate?.(item);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!onUpdateProfile || saving) return;

    await onUpdateProfile(form);
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file || !onUploadAvatar) return;

    setAvatarFile(file);
    setAvatarUploading(true);

    try {
      await onUploadAvatar(file);
    } finally {
      setAvatarUploading(false);
    }

    event.target.value = "";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <VendorSidebar
          activeItem="profile"
          collapsed={false}
          onNavigate={handleNavigate}
          onLogout={onLogout}
          mobileOpen={sidebarOpen}
          onMobileClose={() => setSidebarOpen(false)}
        />

        <div className="flex min-h-screen items-center justify-center lg:pl-64">
          <Loader />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Sidebar */}
      <VendorSidebar
        activeItem="profile"
        collapsed={false}
        onNavigate={handleNavigate}
        onLogout={onLogout}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="lg:pl-64">
        <VendorHeader
          title="Profile"
          subtitle="Manage your vendor account information"
          user={user}
          notificationCount={notificationCount}
          onMenuClick={() => setSidebarOpen(true)}
          onLogout={onLogout}
          onProfileClick={() => handleNavigate("profile")}
          onNotificationsClick={() => handleNavigate("notifications")}
        />

        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-4xl space-y-6">
            {/* Profile Header */}
            <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="border-b border-border bg-muted/30 p-6">
                <h1 className="text-xl font-semibold text-foreground">
                  Vendor Profile
                </h1>

                <p className="mt-1 text-sm text-muted-foreground">
                  Update your personal account details and profile picture.
                </p>
              </div>

              <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
                <div className="relative">
                  <Avatar
                    src={user?.avatar || user?.avatarUrl}
                    alt={user?.fullName || "Vendor"}
                    size="xl"
                  />

                  <label
                    className={[
                      "absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-background bg-primary text-sm font-semibold text-primary-foreground shadow-md",
                      avatarUploading
                        ? "cursor-not-allowed opacity-60"
                        : "cursor-pointer",
                    ].join(" ")}
                  >
                    {avatarUploading ? "..." : "+"}

                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={handleAvatarChange}
                      disabled={avatarUploading || saving}
                    />
                  </label>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {user?.fullName || "Vendor"}
                  </h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {user?.email || "No email available"}
                  </p>

                  <p className="mt-2 text-xs text-muted-foreground">
                    {avatarFile
                      ? `Selected: ${avatarFile.name}`
                      : "JPG, PNG or WEBP"}
                  </p>
                </div>
              </div>
            </section>

            {/* Profile Form */}
            <section className="rounded-2xl border border-border bg-card shadow-sm">
              <div className="border-b border-border p-6">
                <h2 className="text-lg font-semibold text-foreground">
                  Personal Information
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Keep your account information up to date.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6 p-6">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Input
                    label="Full Name"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    placeholder="Enter full name"
                    required
                  />

                  <Input
                    label="Username"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    placeholder="Enter username"
                    required
                  />

                  <Input
                    label="Email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Enter email"
                    disabled
                  />

                  <Input
                    label="Phone"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                  />
                </div>

                <div className="flex justify-end border-t border-border pt-5">
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </section>

            {/* Account Information */}
            <section className="rounded-2xl border border-border bg-card shadow-sm">
              <div className="border-b border-border p-6">
                <h2 className="text-lg font-semibold text-foreground">
                  Account Information
                </h2>
              </div>

              <div className="grid gap-5 p-6 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Role
                  </p>

                  <p className="mt-1 text-sm font-medium capitalize text-foreground">
                    {user?.role || "Vendor"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Status
                  </p>

                  <p className="mt-1 text-sm font-medium capitalize text-foreground">
                    {user?.status || "Active"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Username
                  </p>

                  <p className="mt-1 text-sm font-medium text-foreground">
                    {user?.username || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Member Since
                  </p>

                  <p className="mt-1 text-sm font-medium text-foreground">
                    {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </p>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;
