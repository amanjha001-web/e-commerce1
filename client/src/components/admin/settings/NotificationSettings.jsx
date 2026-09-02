import { useState } from "react";

const DEFAULT_SETTINGS = {
  emailNotifications: true,
  pushNotifications: true,
  smsNotifications: false,

  newOrderNotification: true,
  orderStatusNotification: true,
  paymentNotification: true,
  newUserNotification: true,
  vendorRequestNotification: true,
  supportTicketNotification: true,

  lowStockNotification: true,
  outOfStockNotification: true,

  marketingNotifications: false,
  systemNotifications: true,

  adminEmail: "",
  notificationEmail: "",
  notificationPhone: "",
};

const NotificationToggle = ({ item, form, onChange, disabled = false }) => (
  <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-border p-4 transition hover:bg-muted/30">
    <div>
      <p className="text-sm font-medium text-foreground">{item.title}</p>

      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        {item.description}
      </p>
    </div>

    <input
      type="checkbox"
      name={item.name}
      checked={Boolean(form[item.name])}
      onChange={onChange}
      disabled={disabled}
      className="mt-0.5 h-5 w-5 shrink-0 rounded border-border accent-primary disabled:cursor-not-allowed"
    />
  </label>
);

const NotificationSettings = ({
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

  const notificationChannels = [
    {
      name: "emailNotifications",
      title: "Email Notifications",
      description: "Receive platform alerts through email.",
    },
    {
      name: "pushNotifications",
      title: "Push Notifications",
      description: "Receive real-time notifications on supported devices.",
    },
    {
      name: "smsNotifications",
      title: "SMS Notifications",
      description: "Receive important alerts through SMS.",
    },
  ];

  const notificationEvents = [
    {
      name: "newOrderNotification",
      title: "New Orders",
      description: "Notify administrators when a new order is placed.",
    },
    {
      name: "orderStatusNotification",
      title: "Order Status Changes",
      description: "Notify when an order status is updated.",
    },
    {
      name: "paymentNotification",
      title: "Payments",
      description: "Notify about successful or failed payments.",
    },
    {
      name: "newUserNotification",
      title: "New Users",
      description: "Notify when a new customer registers.",
    },
    {
      name: "vendorRequestNotification",
      title: "Vendor Requests",
      description: "Notify when a new vendor application is submitted.",
    },
    {
      name: "supportTicketNotification",
      title: "Support Tickets",
      description: "Notify when a new support ticket is created.",
    },
  ];

  const inventoryEvents = [
    {
      name: "lowStockNotification",
      title: "Low Stock",
      description: "Alert administrators when product stock is running low.",
    },
    {
      name: "outOfStockNotification",
      title: "Out of Stock",
      description: "Alert administrators when products become unavailable.",
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-7 w-60 animate-pulse rounded bg-muted" />

        <div className="h-4 w-96 max-w-full animate-pulse rounded bg-muted" />

        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-border bg-background p-6"
          >
            <div className="h-5 w-48 animate-pulse rounded bg-muted" />

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="h-20 animate-pulse rounded-xl bg-muted" />
              <div className="h-20 animate-pulse rounded-xl bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <section className="space-y-6">
      {/* Heading */}
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          Notification Settings
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Configure notification channels and choose which platform events
          should generate alerts.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Notification Channels */}
        <div className="rounded-2xl border border-border bg-background shadow-sm">
          <div className="border-b border-border px-5 py-4 sm:px-6">
            <h3 className="font-semibold text-foreground">
              Notification Channels
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Choose how administrators should receive notifications.
            </p>
          </div>

          <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
            {notificationChannels.map((item) => (
              <NotificationToggle
                key={item.name}
                item={item}
                form={form}
                onChange={handleChange}
                disabled={saving}
              />
            ))}
          </div>
        </div>

        {/* Order & Account Notifications */}
        <div className="rounded-2xl border border-border bg-background shadow-sm">
          <div className="border-b border-border px-5 py-4 sm:px-6">
            <h3 className="font-semibold text-foreground">
              Order & Account Notifications
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Select important customer, order and payment events.
            </p>
          </div>

          <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
            {notificationEvents.map((item) => (
              <NotificationToggle
                key={item.name}
                item={item}
                form={form}
                onChange={handleChange}
                disabled={saving}
              />
            ))}
          </div>
        </div>

        {/* Inventory */}
        <div className="rounded-2xl border border-border bg-background shadow-sm">
          <div className="border-b border-border px-5 py-4 sm:px-6">
            <h3 className="font-semibold text-foreground">
              Inventory Notifications
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Get notified when product inventory needs attention.
            </p>
          </div>

          <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
            {inventoryEvents.map((item) => (
              <NotificationToggle
                key={item.name}
                item={item}
                form={form}
                onChange={handleChange}
                disabled={saving}
              />
            ))}
          </div>
        </div>

        {/* Other Notifications */}
        <div className="rounded-2xl border border-border bg-background shadow-sm">
          <div className="border-b border-border px-5 py-4 sm:px-6">
            <h3 className="font-semibold text-foreground">
              Other Notifications
            </h3>
          </div>

          <div className="divide-y divide-border">
            {/* Marketing */}
            <label className="flex cursor-pointer items-start justify-between gap-4 p-5 sm:px-6">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Marketing Notifications
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Receive promotional and marketing-related notifications.
                </p>
              </div>

              <input
                type="checkbox"
                name="marketingNotifications"
                checked={Boolean(form.marketingNotifications)}
                onChange={handleChange}
                disabled={saving}
                className="mt-1 h-5 w-5 shrink-0 rounded border-border accent-primary disabled:cursor-not-allowed"
              />
            </label>

            {/* System */}
            <label className="flex cursor-pointer items-start justify-between gap-4 p-5 sm:px-6">
              <div>
                <p className="text-sm font-medium text-foreground">
                  System Notifications
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Receive important platform and system notifications.
                </p>
              </div>

              <input
                type="checkbox"
                name="systemNotifications"
                checked={Boolean(form.systemNotifications)}
                onChange={handleChange}
                disabled={saving}
                className="mt-1 h-5 w-5 shrink-0 rounded border-border accent-primary disabled:cursor-not-allowed"
              />
            </label>
          </div>
        </div>

        {/* Notification Recipients */}
        <div className="rounded-2xl border border-border bg-background shadow-sm">
          <div className="border-b border-border px-5 py-4 sm:px-6">
            <h3 className="font-semibold text-foreground">
              Notification Recipients
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Configure the email and phone number used for administrative
              alerts.
            </p>
          </div>

          <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
            {/* Admin Email */}
            <div>
              <label
                htmlFor="adminEmail"
                className="text-sm font-medium text-foreground"
              >
                Admin Email
              </label>

              <input
                id="adminEmail"
                name="adminEmail"
                type="email"
                value={form.adminEmail}
                onChange={handleChange}
                disabled={saving}
                placeholder="admin@example.com"
                className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            {/* Notification Email */}
            <div>
              <label
                htmlFor="notificationEmail"
                className="text-sm font-medium text-foreground"
              >
                Notification Email
              </label>

              <input
                id="notificationEmail"
                name="notificationEmail"
                type="email"
                value={form.notificationEmail}
                onChange={handleChange}
                disabled={saving}
                placeholder="notifications@example.com"
                className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            {/* Notification Phone */}
            <div>
              <label
                htmlFor="notificationPhone"
                className="text-sm font-medium text-foreground"
              >
                Notification Phone
              </label>

              <input
                id="notificationPhone"
                name="notificationPhone"
                type="tel"
                value={form.notificationPhone}
                onChange={handleChange}
                disabled={saving}
                placeholder="+91 9876543210"
                className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>
          </div>
        </div>

        {/* Save */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Notification Settings"}
          </button>
        </div>
      </form>
    </section>
  );
};

export default NotificationSettings;
