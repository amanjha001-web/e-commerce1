import { useState } from "react";

const DEFAULT_SETTINGS = {
  twoFactorAuth: false,
  loginAlerts: true,
  sessionTimeout: 30,
  maxLoginAttempts: 5,
  lockoutDuration: 15,
  passwordMinLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialCharacter: true,
  forcePasswordChange: false,
  allowMultipleSessions: true,
};

const SecuritySettings = ({
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
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
            ? Number(value)
            : value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    onSave?.({
      ...form,
      sessionTimeout: Number(form.sessionTimeout),
      maxLoginAttempts: Number(form.maxLoginAttempts),
      lockoutDuration: Number(form.lockoutDuration),
      passwordMinLength: Number(form.passwordMinLength),
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-7 w-52 animate-pulse rounded bg-muted" />

        <div className="h-4 w-96 max-w-full animate-pulse rounded bg-muted" />

        <div className="space-y-5">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="rounded-2xl border border-border bg-background p-6"
            >
              <div className="h-5 w-40 animate-pulse rounded bg-muted" />

              <div className="mt-5 space-y-4">
                <div className="h-11 w-full animate-pulse rounded-xl bg-muted" />
                <div className="h-11 w-full animate-pulse rounded-xl bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      {/* Heading */}
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          Security Settings
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Configure authentication, password and account security policies.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Authentication */}
        <div className="rounded-2xl border border-border bg-background shadow-sm">
          <div className="border-b border-border px-5 py-4 sm:px-6">
            <h3 className="font-semibold text-foreground">Authentication</h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Control login and account authentication behaviour.
            </p>
          </div>

          <div className="divide-y divide-border">
            <label className="flex cursor-pointer items-start justify-between gap-4 p-5 sm:px-6">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Two-Factor Authentication
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Require an additional verification step during login.
                </p>
              </div>

              <input
                type="checkbox"
                name="twoFactorAuth"
                checked={Boolean(form.twoFactorAuth)}
                onChange={handleChange}
                disabled={saving}
                className="mt-1 h-5 w-5 shrink-0 rounded border-border accent-primary"
              />
            </label>

            <label className="flex cursor-pointer items-start justify-between gap-4 p-5 sm:px-6">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Login Alerts
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Notify users about new or suspicious login activity.
                </p>
              </div>

              <input
                type="checkbox"
                name="loginAlerts"
                checked={Boolean(form.loginAlerts)}
                onChange={handleChange}
                disabled={saving}
                className="mt-1 h-5 w-5 shrink-0 rounded border-border accent-primary"
              />
            </label>

            <label className="flex cursor-pointer items-start justify-between gap-4 p-5 sm:px-6">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Allow Multiple Sessions
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Allow the same account to remain logged in on multiple
                  devices.
                </p>
              </div>

              <input
                type="checkbox"
                name="allowMultipleSessions"
                checked={Boolean(form.allowMultipleSessions)}
                onChange={handleChange}
                disabled={saving}
                className="mt-1 h-5 w-5 shrink-0 rounded border-border accent-primary"
              />
            </label>

            <label className="flex cursor-pointer items-start justify-between gap-4 p-5 sm:px-6">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Force Password Change
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Require users to change their password after an administrator
                  resets it.
                </p>
              </div>

              <input
                type="checkbox"
                name="forcePasswordChange"
                checked={Boolean(form.forcePasswordChange)}
                onChange={handleChange}
                disabled={saving}
                className="mt-1 h-5 w-5 shrink-0 rounded border-border accent-primary"
              />
            </label>
          </div>
        </div>

        {/* Login Protection */}
        <div className="rounded-2xl border border-border bg-background shadow-sm">
          <div className="border-b border-border px-5 py-4 sm:px-6">
            <h3 className="font-semibold text-foreground">Login Protection</h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Protect accounts from brute-force login attempts.
            </p>
          </div>

          <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
            <div>
              <label
                htmlFor="sessionTimeout"
                className="text-sm font-medium text-foreground"
              >
                Session Timeout
              </label>

              <div className="mt-2 flex">
                <input
                  id="sessionTimeout"
                  name="sessionTimeout"
                  type="number"
                  min="1"
                  max="1440"
                  value={form.sessionTimeout}
                  onChange={handleChange}
                  disabled={saving}
                  className="w-full rounded-l-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                />

                <span className="flex items-center rounded-r-xl border border-l-0 border-border bg-muted px-3 text-sm text-muted-foreground">
                  min
                </span>
              </div>

              <p className="mt-1 text-xs text-muted-foreground">
                Automatically expire inactive sessions.
              </p>
            </div>

            <div>
              <label
                htmlFor="maxLoginAttempts"
                className="text-sm font-medium text-foreground"
              >
                Maximum Login Attempts
              </label>

              <input
                id="maxLoginAttempts"
                name="maxLoginAttempts"
                type="number"
                min="1"
                max="20"
                value={form.maxLoginAttempts}
                onChange={handleChange}
                disabled={saving}
                className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
              />

              <p className="mt-1 text-xs text-muted-foreground">
                Number of failed attempts before account lockout.
              </p>
            </div>

            <div>
              <label
                htmlFor="lockoutDuration"
                className="text-sm font-medium text-foreground"
              >
                Lockout Duration
              </label>

              <div className="mt-2 flex">
                <input
                  id="lockoutDuration"
                  name="lockoutDuration"
                  type="number"
                  min="1"
                  max="1440"
                  value={form.lockoutDuration}
                  onChange={handleChange}
                  disabled={saving}
                  className="w-full rounded-l-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                />

                <span className="flex items-center rounded-r-xl border border-l-0 border-border bg-muted px-3 text-sm text-muted-foreground">
                  min
                </span>
              </div>

              <p className="mt-1 text-xs text-muted-foreground">
                How long a locked account remains blocked.
              </p>
            </div>
          </div>
        </div>

        {/* Password Policy */}
        <div className="rounded-2xl border border-border bg-background shadow-sm">
          <div className="border-b border-border px-5 py-4 sm:px-6">
            <h3 className="font-semibold text-foreground">Password Policy</h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Define password requirements for user accounts.
            </p>
          </div>

          <div className="space-y-5 p-5 sm:p-6">
            <div className="max-w-sm">
              <label
                htmlFor="passwordMinLength"
                className="text-sm font-medium text-foreground"
              >
                Minimum Password Length
              </label>

              <input
                id="passwordMinLength"
                name="passwordMinLength"
                type="number"
                min="6"
                max="32"
                value={form.passwordMinLength}
                onChange={handleChange}
                disabled={saving}
                className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  name: "requireUppercase",
                  title: "Uppercase Letter",
                  description: "Require at least one uppercase character.",
                },
                {
                  name: "requireLowercase",
                  title: "Lowercase Letter",
                  description: "Require at least one lowercase character.",
                },
                {
                  name: "requireNumber",
                  title: "Number",
                  description: "Require at least one numeric character.",
                },
                {
                  name: "requireSpecialCharacter",
                  title: "Special Character",
                  description: "Require at least one special character.",
                },
              ].map((item) => (
                <label
                  key={item.name}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4 transition hover:bg-muted/30"
                >
                  <input
                    type="checkbox"
                    name={item.name}
                    checked={Boolean(form[item.name])}
                    onChange={handleChange}
                    disabled={saving}
                    className="mt-0.5 h-5 w-5 shrink-0 rounded border-border accent-primary"
                  />

                  <span>
                    <span className="block text-sm font-medium text-foreground">
                      {item.title}
                    </span>

                    <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                      {item.description}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex gap-3">
            <span className="text-xl">🔐</span>

            <div>
              <h3 className="text-sm font-semibold text-amber-900">
                Security Notice
              </h3>

              <p className="mt-1 text-sm leading-6 text-amber-800">
                Changes to authentication and password policies can affect all
                users. Test security settings carefully before applying them in
                production.
              </p>
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
            {saving ? "Saving..." : "Save Security Settings"}
          </button>
        </div>
      </form>
    </section>
  );
};

export default SecuritySettings;
