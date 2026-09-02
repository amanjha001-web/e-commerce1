import { useState } from "react";

const DEFAULT_SETTINGS = {
  siteName: "",
  siteDescription: "",
  supportEmail: "",
  supportPhone: "",
  currency: "INR",
  timezone: "Asia/Kolkata",
  language: "en",
  maintenanceMode: false,
  allowRegistration: true,
  allowVendorRegistration: true,
};

const GeneralSettings = ({
  settings = {},
  loading = false,
  saving = false,
  onSave,
}) => {
  const [form, setForm] = useState(() => ({
    ...DEFAULT_SETTINGS,
    ...settings,
  }));

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    onSave?.(form);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-7 w-48 animate-pulse rounded bg-muted" />

        <div className="h-4 w-96 max-w-full animate-pulse rounded bg-muted" />

        <div className="rounded-2xl border border-border bg-background p-6">
          <div className="space-y-5">
            {Array.from({ length: 7 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />

                <div className="h-11 w-full animate-pulse rounded-xl bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      {/* Heading */}
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          General Settings
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Manage your store information, localization and general platform
          preferences.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Store Information */}
        <div className="rounded-2xl border border-border bg-background shadow-sm">
          <div className="border-b border-border px-5 py-4 sm:px-6">
            <h3 className="font-semibold text-foreground">Store Information</h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Basic information displayed across the platform.
            </p>
          </div>

          <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
            {/* Site Name */}
            <div className="sm:col-span-2">
              <label
                htmlFor="siteName"
                className="text-sm font-medium text-foreground"
              >
                Site Name
              </label>

              <input
                id="siteName"
                name="siteName"
                type="text"
                value={form.siteName}
                onChange={handleChange}
                disabled={saving}
                placeholder="ShopSphere"
                className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            {/* Site Description */}
            <div className="sm:col-span-2">
              <label
                htmlFor="siteDescription"
                className="text-sm font-medium text-foreground"
              >
                Site Description
              </label>

              <textarea
                id="siteDescription"
                name="siteDescription"
                value={form.siteDescription}
                onChange={handleChange}
                disabled={saving}
                rows={4}
                placeholder="Your multi-vendor e-commerce platform..."
                className="mt-2 w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            {/* Support Email */}
            <div>
              <label
                htmlFor="supportEmail"
                className="text-sm font-medium text-foreground"
              >
                Support Email
              </label>

              <input
                id="supportEmail"
                name="supportEmail"
                type="email"
                value={form.supportEmail}
                onChange={handleChange}
                disabled={saving}
                placeholder="support@example.com"
                className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            {/* Support Phone */}
            <div>
              <label
                htmlFor="supportPhone"
                className="text-sm font-medium text-foreground"
              >
                Support Phone
              </label>

              <input
                id="supportPhone"
                name="supportPhone"
                type="tel"
                value={form.supportPhone}
                onChange={handleChange}
                disabled={saving}
                placeholder="+91 9876543210"
                className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>
          </div>
        </div>

        {/* Localization */}
        <div className="rounded-2xl border border-border bg-background shadow-sm">
          <div className="border-b border-border px-5 py-4 sm:px-6">
            <h3 className="font-semibold text-foreground">Localization</h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Configure currency, language and timezone.
            </p>
          </div>

          <div className="grid gap-5 p-5 sm:grid-cols-3 sm:p-6">
            {/* Currency */}
            <div>
              <label
                htmlFor="currency"
                className="text-sm font-medium text-foreground"
              >
                Currency
              </label>

              <select
                id="currency"
                name="currency"
                value={form.currency}
                onChange={handleChange}
                disabled={saving}
                className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="INR">INR — Indian Rupee</option>
                <option value="USD">USD — US Dollar</option>
                <option value="EUR">EUR — Euro</option>
                <option value="GBP">GBP — British Pound</option>
              </select>
            </div>

            {/* Timezone */}
            <div>
              <label
                htmlFor="timezone"
                className="text-sm font-medium text-foreground"
              >
                Timezone
              </label>

              <select
                id="timezone"
                name="timezone"
                value={form.timezone}
                onChange={handleChange}
                disabled={saving}
                className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="Asia/Kolkata">Asia/Kolkata</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York</option>
                <option value="Europe/London">Europe/London</option>
              </select>
            </div>

            {/* Language */}
            <div>
              <label
                htmlFor="language"
                className="text-sm font-medium text-foreground"
              >
                Language
              </label>

              <select
                id="language"
                name="language"
                value={form.language}
                onChange={handleChange}
                disabled={saving}
                className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
              </select>
            </div>
          </div>
        </div>

        {/* Platform Preferences */}
        <div className="rounded-2xl border border-border bg-background shadow-sm">
          <div className="border-b border-border px-5 py-4 sm:px-6">
            <h3 className="font-semibold text-foreground">
              Platform Preferences
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Control registration and platform availability.
            </p>
          </div>

          <div className="divide-y divide-border">
            {/* Maintenance Mode */}
            <label className="flex cursor-pointer items-start justify-between gap-4 p-5 sm:px-6">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Maintenance Mode
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Temporarily disable normal storefront access while maintenance
                  is in progress.
                </p>
              </div>

              <input
                type="checkbox"
                name="maintenanceMode"
                checked={Boolean(form.maintenanceMode)}
                onChange={handleChange}
                disabled={saving}
                className="mt-1 h-5 w-5 shrink-0 rounded border-border accent-primary disabled:cursor-not-allowed"
              />
            </label>

            {/* User Registration */}
            <label className="flex cursor-pointer items-start justify-between gap-4 p-5 sm:px-6">
              <div>
                <p className="text-sm font-medium text-foreground">
                  User Registration
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Allow new customers to create accounts.
                </p>
              </div>

              <input
                type="checkbox"
                name="allowRegistration"
                checked={Boolean(form.allowRegistration)}
                onChange={handleChange}
                disabled={saving}
                className="mt-1 h-5 w-5 shrink-0 rounded border-border accent-primary disabled:cursor-not-allowed"
              />
            </label>

            {/* Vendor Registration */}
            <label className="flex cursor-pointer items-start justify-between gap-4 p-5 sm:px-6">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Vendor Registration
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Allow users to submit requests to become vendors.
                </p>
              </div>

              <input
                type="checkbox"
                name="allowVendorRegistration"
                checked={Boolean(form.allowVendorRegistration)}
                onChange={handleChange}
                disabled={saving}
                className="mt-1 h-5 w-5 shrink-0 rounded border-border accent-primary disabled:cursor-not-allowed"
              />
            </label>
          </div>
        </div>

        {/* Save */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </section>
  );
};

export default GeneralSettings;
