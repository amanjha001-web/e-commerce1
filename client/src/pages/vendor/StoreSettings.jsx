import { useState } from "react";

import VendorHeader from "../../components/vendor/VendorHeader";
import VendorSidebar from "../../components/vendor/VendorSidebar";

import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Textarea from "../../components/common/Textarea";
import Loader from "../../components/common/Loader";

const StoreSettings = ({
  user = null,
  store = null,
  loading = false,
  saving = false,
  notificationCount = 0,

  onUpdateStore,
  onNavigate,
  onLogout,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [form, setForm] = useState(() => ({
    storeName: store?.storeName || store?.name || "",
    description: store?.description || "",
    email: store?.email || user?.email || "",
    phone: store?.phone || user?.phone || "",
    address: store?.address || "",
    city: store?.city || "",
    state: store?.state || "",
    pincode: store?.pincode || store?.postalCode || "",
  }));

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

    if (!onUpdateStore || saving) return;

    await onUpdateStore(form);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <VendorSidebar
          activeItem="store-settings"
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
        activeItem="store-settings"
        collapsed={false}
        onNavigate={handleNavigate}
        onLogout={onLogout}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="lg:pl-64">
        <VendorHeader
          title="Store Settings"
          subtitle="Manage your store information and business details"
          user={user}
          notificationCount={notificationCount}
          onMenuClick={() => setSidebarOpen(true)}
          onLogout={onLogout}
          onProfileClick={() => handleNavigate("profile")}
          onNotificationsClick={() => handleNavigate("notifications")}
        />

        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-5xl space-y-6">
            {/* Page Header */}
            <div>
              <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
                Store Settings
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                Update the information customers see about your store.
              </p>
            </div>

            {/* Store Information */}
            <section className="rounded-2xl border border-border bg-card shadow-sm">
              <div className="border-b border-border p-6">
                <h2 className="text-lg font-semibold text-foreground">
                  Store Information
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Basic information about your vendor store.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6 p-6">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Input
                    label="Store Name"
                    name="storeName"
                    value={form.storeName}
                    onChange={handleChange}
                    placeholder="Enter store name"
                    required
                  />

                  <Input
                    label="Store Email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Enter store email"
                  />

                  <Input
                    label="Phone Number"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                  />
                </div>

                {/* Description */}
                <Textarea
                  label="Store Description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe your store..."
                  rows={5}
                />

                {/* Store Address */}
                <div>
                  <h3 className="mb-4 text-base font-semibold text-foreground">
                    Store Address
                  </h3>

                  <div className="space-y-5">
                    <Textarea
                      label="Address"
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      placeholder="Enter complete store address"
                      rows={3}
                    />

                    <div className="grid gap-5 sm:grid-cols-3">
                      <Input
                        label="City"
                        name="city"
                        value={form.city}
                        onChange={handleChange}
                        placeholder="Enter city"
                      />

                      <Input
                        label="State"
                        name="state"
                        value={form.state}
                        onChange={handleChange}
                        placeholder="Enter state"
                      />

                      <Input
                        label="Pincode"
                        name="pincode"
                        value={form.pincode}
                        onChange={handleChange}
                        placeholder="Enter pincode"
                        inputMode="numeric"
                      />
                    </div>
                  </div>
                </div>

                {/* Save */}
                <div className="flex justify-end border-t border-border pt-5">
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Save Store Settings"}
                  </Button>
                </div>
              </form>
            </section>

            {/* Store Preview */}
            <section className="rounded-2xl border border-border bg-card shadow-sm">
              <div className="border-b border-border p-6">
                <h2 className="text-lg font-semibold text-foreground">
                  Store Preview
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Preview the basic information customers will see.
                </p>
              </div>

              <div className="p-6">
                <div className="rounded-2xl border border-border bg-background p-6">
                  <h3 className="text-xl font-bold text-foreground">
                    {form.storeName || "Your Store"}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {form.description ||
                      "Your store description will appear here."}
                  </p>

                  <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <span className="text-muted-foreground">Email:</span>{" "}
                      <span className="font-medium text-foreground">
                        {form.email || "—"}
                      </span>
                    </div>

                    <div>
                      <span className="text-muted-foreground">Phone:</span>{" "}
                      <span className="font-medium text-foreground">
                        {form.phone || "—"}
                      </span>
                    </div>

                    <div className="sm:col-span-2">
                      <span className="text-muted-foreground">Address:</span>{" "}
                      <span className="font-medium text-foreground">
                        {[form.address, form.city, form.state, form.pincode]
                          .filter(Boolean)
                          .join(", ") || "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StoreSettings;
