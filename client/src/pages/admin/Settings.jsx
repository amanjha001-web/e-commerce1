import { useEffect, useState } from "react";
import { toast } from "sonner";
import adminService from "../../services/admin.service";

const DEFAULT_SETTINGS = {
  STORE_NAME: "ShopSphere",
  SITE_DESCRIPTION:
    "Curated essentials, elevated everyday style, and multi-vendor marketplace.",
  SUPPORT_EMAIL: "support@shopsphere.com",
  CONTACT_NUMBER: "+91 98765 43210",
  CURRENCY: "INR (₹)",
  TIMEZONE: "Asia/Kolkata",
  SHIPPING_THRESHOLD: "999",
  DEFAULT_SHIPPING_FEE: "50",
  DEFAULT_TAX_RATE: "18",
  THEME_NAME: "Burgundy Luxury",
  PRIMARY_COLOR: "#881337",
  ACCENT_COLOR: "#B68D40",
  MAINTENANCE_MODE: false,
  ALLOW_REGISTRATION: true,
  ALLOW_VENDOR_REGISTRATION: true,
  AUTO_APPROVE_VENDORS: false,
  AUTO_APPROVE_PRODUCTS: false,
  EMAIL_NOTIFICATIONS: true,
  NEW_ORDER_ALERT: true,
  VENDOR_REQUEST_ALERT: true,
  SUPPORT_TICKET_ALERT: true,
  LOW_STOCK_ALERT: true,
  TWO_FACTOR_REQUIRED: false,
  LOGIN_ALERTS: true,
  SESSION_TIMEOUT_MINUTES: "30",
  MAX_LOGIN_ATTEMPTS: "5",
  PASSWORD_MIN_LENGTH: "8",
};

const TAB_SECTIONS = [
  { id: "store", label: "Store & Checkout" },
  { id: "platform", label: "Platform & Policies" },
  { id: "notifications", label: "Notifications" },
  { id: "security", label: "Security" },
];

const EMPTY_TAX_FORM = {
  name: "",
  code: "",
  type: "GST",
  rate: "18",
  country: "India",
  state: "ALL",
  isCompound: false,
  isActive: true,
};

const EMPTY_ZONE_FORM = {
  name: "",
  countries: "India",
  states: "",
  postalCodes: "",
  rate: "50",
  freeShippingThreshold: "999",
  minDays: "2",
  maxDays: "5",
  isActive: true,
};

const extractSettingsMap = (response) => {
  const payload = response?.data ?? response;
  if (!payload) return {};
  if (Array.isArray(payload?.settings)) {
    return Object.fromEntries(
      payload.settings
        .filter((s) => s?.key)
        .map((s) => [String(s.key).trim().toUpperCase(), s.value]),
    );
  }
  if (Array.isArray(payload)) {
    return Object.fromEntries(
      payload
        .filter((s) => s?.key)
        .map((s) => [String(s.key).trim().toUpperCase(), s.value]),
    );
  }
  if (typeof payload === "object") {
    return Object.fromEntries(
      Object.entries(payload).map(([k, v]) => [String(k).trim().toUpperCase(), v]),
    );
  }
  return {};
};

const extractArrayPayload = (response, keys = []) => {
  const payload = response?.data ?? response;
  if (Array.isArray(payload)) return payload;
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  return [];
};

const formatDateTime = (dt) => {
  if (!dt) return "—";
  const parsed = new Date(dt);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatValuePreview = (val) => {
  if (val === undefined || val === null || val === "") return "—";
  if (typeof val === "boolean") return val ? "Enabled" : "Disabled";
  return String(val);
};

const Settings = () => {
  const [form, setForm] = useState(DEFAULT_SETTINGS);
  const [activeTab, setActiveTab] = useState("store");
  const [taxes, setTaxes] = useState([]);
  const [shippingZones, setShippingZones] = useState([]);
  const [settingsHistory, setSettingsHistory] = useState([]);
  const [activeModal, setActiveModal] = useState(null); // "taxes" | "shipping" | "history" | null

  const [editingTaxId, setEditingTaxId] = useState(null);
  const [taxForm, setTaxForm] = useState(EMPTY_TAX_FORM);
  const [confirmDeleteTaxId, setConfirmDeleteTaxId] = useState(null);

  const [editingZoneId, setEditingZoneId] = useState(null);
  const [zoneForm, setZoneForm] = useState(EMPTY_ZONE_FORM);
  const [confirmDeleteZoneId, setConfirmDeleteZoneId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    let mounted = true;
    const loadConfig = async () => {
      try {
        setLoading(true);
        const [settingsRes, taxesRes, zonesRes, histRes] =
          await Promise.allSettled([
            adminService.getSettings({ limit: 100 }),
            adminService.getTaxes({ limit: 100 }),
            adminService.getShippingZones({ limit: 100 }),
            adminService.getSettingsHistory({ limit: 50 }),
          ]);

        if (!mounted) return;

        if (settingsRes.status === "fulfilled") {
          const mapByKey = extractSettingsMap(settingsRes.value);
          setForm((prev) => {
            const next = { ...prev };
            for (const key of Object.keys(DEFAULT_SETTINGS)) {
              if (mapByKey[key] !== undefined && mapByKey[key] !== null) {
                next[key] =
                  typeof DEFAULT_SETTINGS[key] === "boolean"
                    ? Boolean(
                        typeof mapByKey[key] === "string"
                          ? mapByKey[key].toLowerCase() === "true"
                          : mapByKey[key],
                      )
                    : String(mapByKey[key]);
              }
            }
            return next;
          });
        } else {
          setError(
            settingsRes.reason?.response?.data?.message ||
              "Failed to load system settings.",
          );
        }

        if (taxesRes.status === "fulfilled") {
          setTaxes(extractArrayPayload(taxesRes.value, ["taxes"]));
        }

        if (zonesRes.status === "fulfilled") {
          setShippingZones(
            extractArrayPayload(zonesRes.value, ["zones", "shippingZones"]),
          );
        }

        if (histRes.status === "fulfilled") {
          setSettingsHistory(extractArrayPayload(histRes.value, ["history"]));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadConfig();
    return () => {
      mounted = false;
    };
  }, [reloadTick]);

  const triggerReload = () => setReloadTick((n) => n + 1);

  const handleSaveSettings = async (keysToSave = null) => {
    setError("");
    const sourceKeys = Array.isArray(keysToSave)
      ? keysToSave
      : Object.keys(DEFAULT_SETTINGS);

    const payload = {};
    for (const key of sourceKeys) {
      const val = form[key];
      if (key === "SUPPORT_EMAIL" && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())) {
        const msg = "Please enter a valid support email address.";
        setError(msg);
        toast.error(msg);
        return;
      }
      if (
        (key === "SHIPPING_THRESHOLD" || key === "DEFAULT_SHIPPING_FEE") &&
        (Number.isNaN(Number(val)) || Number(val) < 0)
      ) {
        const msg = `${key.replace(/_/g, " ")} must be 0 or greater.`;
        setError(msg);
        toast.error(msg);
        return;
      }
      if (
        key === "DEFAULT_TAX_RATE" &&
        (Number.isNaN(Number(val)) || Number(val) < 0 || Number(val) > 100)
      ) {
        const msg = "Default tax rate must be between 0% and 100%.";
        setError(msg);
        toast.error(msg);
        return;
      }

      if (typeof DEFAULT_SETTINGS[key] === "boolean") {
        payload[key] = Boolean(val);
      } else if (
        [
          "SHIPPING_THRESHOLD",
          "DEFAULT_SHIPPING_FEE",
          "DEFAULT_TAX_RATE",
          "SESSION_TIMEOUT_MINUTES",
          "MAX_LOGIN_ATTEMPTS",
          "PASSWORD_MIN_LENGTH",
        ].includes(key)
      ) {
        payload[key] = Number(val);
      } else {
        payload[key] = String(val ?? "").trim();
      }
    }

    try {
      setSaving(true);
      await adminService.updateMultipleSettings({ settings: payload });
      toast.success("Settings saved successfully");
      triggerReload();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to save settings";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // ==================== Tax Rules Handlers ====================
  const handleSaveTax = async (e) => {
    e?.preventDefault();
    const name = taxForm.name.trim();
    const code = taxForm.code.trim().toUpperCase();
    const rate = Number(taxForm.rate);

    if (!name) {
      toast.error("Tax name is required");
      return;
    }
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
      toast.error("Tax rate must be between 0 and 100%");
      return;
    }

    const payload = {
      name,
      code,
      type: taxForm.type || "GST",
      rate,
      country: taxForm.country.trim() || "India",
      state: taxForm.state.trim() || "ALL",
      isCompound: Boolean(taxForm.isCompound),
      isActive: Boolean(taxForm.isActive),
    };

    try {
      setSaving(true);
      if (editingTaxId) {
        await adminService.updateTax(editingTaxId, payload);
        toast.success(`Tax rule "${name}" updated`);
      } else {
        await adminService.createTax(payload);
        toast.success(`Tax rule "${name}" created`);
      }
      setTaxForm(EMPTY_TAX_FORM);
      setEditingTaxId(null);
      triggerReload();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save tax rule");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleTax = async (tax) => {
    try {
      await adminService.updateTaxStatus(tax._id, !tax.isActive);
      toast.success(
        `Tax rule "${tax.name}" ${!tax.isActive ? "activated" : "paused"}`,
      );
      triggerReload();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update tax status");
    }
  };

  const handleDeleteTax = async (taxId) => {
    try {
      await adminService.deleteTax(taxId);
      toast.success("Tax rule deleted");
      setConfirmDeleteTaxId(null);
      if (editingTaxId === taxId) {
        setEditingTaxId(null);
        setTaxForm(EMPTY_TAX_FORM);
      }
      triggerReload();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete tax");
    }
  };

  // ==================== Shipping Zones Handlers ====================
  const handleSaveZone = async (e) => {
    e?.preventDefault();
    const name = zoneForm.name.trim();
    const rate = Number(zoneForm.rate || 0);
    const freeShippingThreshold = Number(zoneForm.freeShippingThreshold || 0);
    const minDays = Math.max(1, Number(zoneForm.minDays) || 2);
    const maxDays = Math.max(minDays, Number(zoneForm.maxDays) || 5);

    if (!name) {
      toast.error("Shipping zone name is required");
      return;
    }
    if (!Number.isFinite(rate) || rate < 0) {
      toast.error("Shipping rate must be 0 or greater");
      return;
    }
    if (!Number.isFinite(freeShippingThreshold) || freeShippingThreshold < 0) {
      toast.error("Free shipping threshold cannot be negative");
      return;
    }

    const splitList = (str) =>
      String(str || "")
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);

    const payload = {
      name,
      countries: splitList(zoneForm.countries).length
        ? splitList(zoneForm.countries)
        : ["India"],
      states: splitList(zoneForm.states),
      postalCodes: splitList(zoneForm.postalCodes),
      rate,
      freeShippingThreshold,
      estimatedDays: { min: minDays, max: maxDays },
      isActive: Boolean(zoneForm.isActive),
    };

    try {
      setSaving(true);
      if (editingZoneId) {
        await adminService.updateShippingZone(editingZoneId, payload);
        toast.success(`Shipping zone "${name}" updated`);
      } else {
        await adminService.createShippingZone(payload);
        toast.success(`Shipping zone "${name}" created`);
      }
      setZoneForm(EMPTY_ZONE_FORM);
      setEditingZoneId(null);
      triggerReload();
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to save shipping zone",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggleZone = async (zone) => {
    try {
      await adminService.updateShippingZoneStatus(zone._id, !zone.isActive);
      toast.success(
        `Shipping zone "${zone.name}" ${!zone.isActive ? "activated" : "paused"}`,
      );
      triggerReload();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update zone");
    }
  };

  const handleDeleteZone = async (zoneId) => {
    try {
      await adminService.deleteShippingZone(zoneId);
      toast.success("Shipping zone deleted");
      setConfirmDeleteZoneId(null);
      if (editingZoneId === zoneId) {
        setEditingZoneId(null);
        setZoneForm(EMPTY_ZONE_FORM);
      }
      triggerReload();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete zone");
    }
  };

  const activeTaxesCount = taxes.filter((t) => t.isActive !== false).length;
  const activeZonesCount = shippingZones.filter((z) => z.isActive !== false).length;

  return (
    <div className="space-y-4">
      <div className="pagehead">
        <div>
          <div className="eyebrow">ShopSphere administration</div>
          <h1>Settings</h1>
        </div>
        <button
          type="button"
          className="outlinebtn"
          disabled={loading}
          onClick={triggerReload}
        >
          {loading ? "Syncing..." : "↻ Refresh"}
        </button>
      </div>

      {/* KPI Quick Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <button
          type="button"
          onClick={() => setActiveTab("store")}
          className={`rounded-2xl border bg-white p-4 text-left shadow-xs transition cursor-pointer ${
            activeTab === "store"
              ? "border-[var(--primary)] ring-2 ring-[var(--soft)]"
              : "border-[var(--line)] hover:border-[var(--primary)]/50"
          }`}
        >
          <p className="text-xs font-bold text-[var(--muted)]">
            Shipping &amp; Tax defaults
          </p>
          <p className="mt-1 text-2xl font-black text-[var(--text)]">
            ₹{form.SHIPPING_THRESHOLD || 0}
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-[var(--muted)]">
            Fee ₹{form.DEFAULT_SHIPPING_FEE || 0} · GST {form.DEFAULT_TAX_RATE || 0}%
          </p>
        </button>

        <button
          type="button"
          onClick={() => setActiveModal("taxes")}
          className="rounded-2xl border border-[var(--line)] bg-white p-4 text-left shadow-xs transition cursor-pointer hover:border-[var(--primary)]/50"
        >
          <p className="text-xs font-bold text-[var(--muted)]">Tax rules</p>
          <p className="mt-1 text-2xl font-black text-[#16845b]">
            {taxes.length}
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-[var(--muted)]">
            {activeTaxesCount} active rules configured
          </p>
        </button>

        <button
          type="button"
          onClick={() => setActiveModal("shipping")}
          className="rounded-2xl border border-[var(--line)] bg-white p-4 text-left shadow-xs transition cursor-pointer hover:border-[var(--primary)]/50"
        >
          <p className="text-xs font-bold text-[var(--muted)]">Shipping zones</p>
          <p className="mt-1 text-2xl font-black text-[var(--primary)]">
            {shippingZones.length}
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-[var(--muted)]">
            {activeZonesCount} active delivery zones
          </p>
        </button>

        <button
          type="button"
          onClick={() => setActiveModal("history")}
          className="rounded-2xl border border-[var(--line)] bg-white p-4 text-left shadow-xs transition cursor-pointer hover:border-[var(--primary)]/50"
        >
          <p className="text-xs font-bold text-[var(--muted)]">Audit trail</p>
          <p className="mt-1 text-2xl font-black text-[var(--text)]">
            {settingsHistory.length}
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-[var(--muted)]">
            Recorded setting changes
          </p>
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-xl border border-[#f3cbd0] bg-[#fff0f1] px-4 py-3 text-xs font-semibold text-[#bd3345]"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            className="cursor-pointer font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Navigation Tabs + Quick Modal Shortcuts */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {TAB_SECTIONS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={activeTab === tab.id ? "primarybtn" : "outlinebtn"}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btnsm"
            onClick={() => setActiveModal("taxes")}
          >
            Tax rules ({taxes.length})
          </button>
          <button
            type="button"
            className="btnsm"
            onClick={() => setActiveModal("shipping")}
          >
            Shipping zones ({shippingZones.length})
          </button>
          <button
            type="button"
            className="btnsm"
            onClick={() => setActiveModal("history")}
          >
            Settings history ({settingsHistory.length})
          </button>
        </div>
      </div>

      {/* TAB 1: Store & Checkout */}
      {activeTab === "store" && (
        <>
          <div className="panel">
            <h2>Store settings</h2>
            <div className="formgrid">
              <div className="formgroup">
                <label>Store name</label>
                <input
                  className="field full"
                  value={form.STORE_NAME}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, STORE_NAME: e.target.value }))
                  }
                />
              </div>

              <div className="formgroup">
                <label>Support email</label>
                <input
                  type="email"
                  className="field full"
                  value={form.SUPPORT_EMAIL}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, SUPPORT_EMAIL: e.target.value }))
                  }
                />
              </div>

              <div className="formgroup">
                <label>Currency</label>
                <select
                  className="field full"
                  value={form.CURRENCY}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, CURRENCY: e.target.value }))
                  }
                >
                  <option value="INR (₹)">INR (₹)</option>
                  <option value="USD ($)">USD ($)</option>
                  <option value="EUR (€)">EUR (€)</option>
                  <option value="GBP (£)">GBP (£)</option>
                </select>
              </div>

              <div className="formgroup">
                <label>Timezone</label>
                <select
                  className="field full"
                  value={form.TIMEZONE}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, TIMEZONE: e.target.value }))
                  }
                >
                  <option value="Asia/Kolkata">Asia/Kolkata</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="Asia/Dubai">Asia/Dubai</option>
                  <option value="Asia/Singapore">Asia/Singapore</option>
                </select>
              </div>

              <div className="formgroup">
                <label>Free shipping threshold (₹)</label>
                <input
                  type="number"
                  min="0"
                  className="field full"
                  value={form.SHIPPING_THRESHOLD}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      SHIPPING_THRESHOLD: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="formgroup">
                <label>Default shipping fee (₹)</label>
                <input
                  type="number"
                  min="0"
                  className="field full"
                  value={form.DEFAULT_SHIPPING_FEE}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      DEFAULT_SHIPPING_FEE: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="formgroup">
                <label>Default tax / GST rate (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  className="field full"
                  value={form.DEFAULT_TAX_RATE}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, DEFAULT_TAX_RATE: e.target.value }))
                  }
                />
              </div>

              <div className="formgroup">
                <label>Contact number</label>
                <input
                  className="field full"
                  value={form.CONTACT_NUMBER}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, CONTACT_NUMBER: e.target.value }))
                  }
                />
              </div>

              <div className="formgroup" style={{ gridColumn: "1 / -1" }}>
                <label>Store description</label>
                <input
                  className="field full"
                  value={form.SITE_DESCRIPTION}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      SITE_DESCRIPTION: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="primarybtn"
                disabled={saving}
                onClick={() =>
                  handleSaveSettings([
                    "STORE_NAME",
                    "SITE_DESCRIPTION",
                    "SUPPORT_EMAIL",
                    "CONTACT_NUMBER",
                    "CURRENCY",
                    "TIMEZONE",
                    "SHIPPING_THRESHOLD",
                    "DEFAULT_SHIPPING_FEE",
                    "DEFAULT_TAX_RATE",
                  ])
                }
              >
                {saving ? "Saving..." : "Save store settings"}
              </button>
              <button
                type="button"
                className="outlinebtn"
                onClick={() => setActiveModal("taxes")}
              >
                Tax rules ({taxes.length})
              </button>
              <button
                type="button"
                className="outlinebtn"
                onClick={() => setActiveModal("shipping")}
              >
                Shipping zones ({shippingZones.length})
              </button>
              <button
                type="button"
                className="outlinebtn"
                onClick={() => setActiveModal("history")}
              >
                Settings history ({settingsHistory.length})
              </button>
            </div>
          </div>

          <div className="panel">
            <h2>Appearance &amp; Theme</h2>
            <p className="muted mb-3 text-xs">
              Configure storefront brand colors and theme preset metadata.
            </p>
            <div className="formgrid">
              <div className="formgroup">
                <label>Theme preset name</label>
                <input
                  className="field full"
                  value={form.THEME_NAME}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, THEME_NAME: e.target.value }))
                  }
                />
              </div>

              <div className="formgroup">
                <label>Primary brand color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.PRIMARY_COLOR || "#881337"}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, PRIMARY_COLOR: e.target.value }))
                    }
                    className="h-9 w-12 cursor-pointer rounded border border-[var(--line)] bg-white p-0.5"
                  />
                  <input
                    className="field full"
                    value={form.PRIMARY_COLOR}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, PRIMARY_COLOR: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="formgroup">
                <label>Accent / Gold color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.ACCENT_COLOR || "#B68D40"}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, ACCENT_COLOR: e.target.value }))
                    }
                    className="h-9 w-12 cursor-pointer rounded border border-[var(--line)] bg-white p-0.5"
                  />
                  <input
                    className="field full"
                    value={form.ACCENT_COLOR}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, ACCENT_COLOR: e.target.value }))
                    }
                  />
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <span className="pill">
                {form.THEME_NAME} · {form.PRIMARY_COLOR} · {form.ACCENT_COLOR}
              </span>
              <button
                type="button"
                className="primarybtn"
                disabled={saving}
                onClick={() =>
                  handleSaveSettings([
                    "THEME_NAME",
                    "PRIMARY_COLOR",
                    "ACCENT_COLOR",
                  ])
                }
              >
                {saving ? "Saving..." : "Save theme"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* TAB 2: Platform & Policies */}
      {activeTab === "platform" && (
        <div className="panel space-y-3">
          <h2>Platform &amp; Registration Policies</h2>
          {form.MAINTENANCE_MODE && (
            <div className="rounded-xl border border-[#f3cbd0] bg-[#fff0f1] px-4 py-2.5 text-xs font-semibold text-[#bd3345]">
              Warning: Maintenance mode is ON. Keep only during planned outages.
            </div>
          )}

          {[
            {
              key: "ALLOW_REGISTRATION",
              title: "Allow new customer signups",
              desc: "Enable public account registration on the storefront.",
            },
            {
              key: "ALLOW_VENDOR_REGISTRATION",
              title: "Allow vendor onboarding requests",
              desc: "Permit sellers to submit new vendor store applications.",
            },
            {
              key: "AUTO_APPROVE_VENDORS",
              title: "Auto-approve new vendors",
              desc: "Skip manual Admin Console approval for new vendor applications.",
            },
            {
              key: "AUTO_APPROVE_PRODUCTS",
              title: "Auto-publish vendor products",
              desc: "Automatically publish newly created vendor products without admin review.",
            },
            {
              key: "MAINTENANCE_MODE",
              title: "Storefront maintenance mode",
              desc: "Flag public platform as temporarily under maintenance.",
            },
          ].map((item) => (
            <label
              key={item.key}
              className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-[var(--line)] bg-[#fcf9fa] p-3.5"
            >
              <div>
                <div className="text-sm font-bold text-[var(--text)]">
                  {item.title}
                </div>
                <div className="mt-0.5 text-xs text-[var(--muted)]">
                  {item.desc}
                </div>
              </div>
              <input
                type="checkbox"
                checked={Boolean(form[item.key])}
                onChange={(e) =>
                  setForm((p) => ({ ...p, [item.key]: e.target.checked }))
                }
                className="mt-1 h-4 w-4 cursor-pointer"
              />
            </label>
          ))}

          <div className="pt-2">
            <button
              type="button"
              className="primarybtn"
              disabled={saving}
              onClick={() =>
                handleSaveSettings([
                  "ALLOW_REGISTRATION",
                  "ALLOW_VENDOR_REGISTRATION",
                  "AUTO_APPROVE_VENDORS",
                  "AUTO_APPROVE_PRODUCTS",
                  "MAINTENANCE_MODE",
                ])
              }
            >
              {saving ? "Saving..." : "Save platform policies"}
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: Notifications */}
      {activeTab === "notifications" && (
        <div className="panel space-y-3">
          <h2>Admin Alert &amp; Notification Settings</h2>
          {[
            {
              key: "EMAIL_NOTIFICATIONS",
              title: "Email notifications",
              desc: "Send transactional emails via SMTP for platform activity.",
            },
            {
              key: "NEW_ORDER_ALERT",
              title: "New order alerts",
              desc: "Notify admins when new customer orders are placed.",
            },
            {
              key: "VENDOR_REQUEST_ALERT",
              title: "Vendor application alerts",
              desc: "Notify admins when sellers submit vendor verification requests.",
            },
            {
              key: "SUPPORT_TICKET_ALERT",
              title: "Support ticket alerts",
              desc: "Notify support staff on new tickets and customer replies.",
            },
            {
              key: "LOW_STOCK_ALERT",
              title: "Low stock alerts",
              desc: "Highlight products falling below low-stock inventory threshold.",
            },
          ].map((item) => (
            <label
              key={item.key}
              className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-[var(--line)] bg-[#fcf9fa] p-3.5"
            >
              <div>
                <div className="text-sm font-bold text-[var(--text)]">
                  {item.title}
                </div>
                <div className="mt-0.5 text-xs text-[var(--muted)]">
                  {item.desc}
                </div>
              </div>
              <input
                type="checkbox"
                checked={Boolean(form[item.key])}
                onChange={(e) =>
                  setForm((p) => ({ ...p, [item.key]: e.target.checked }))
                }
                className="mt-1 h-4 w-4 cursor-pointer"
              />
            </label>
          ))}

          <div className="pt-2">
            <button
              type="button"
              className="primarybtn"
              disabled={saving}
              onClick={() =>
                handleSaveSettings([
                  "EMAIL_NOTIFICATIONS",
                  "NEW_ORDER_ALERT",
                  "VENDOR_REQUEST_ALERT",
                  "SUPPORT_TICKET_ALERT",
                  "LOW_STOCK_ALERT",
                ])
              }
            >
              {saving ? "Saving..." : "Save notification settings"}
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: Security Policy */}
      {activeTab === "security" && (
        <div className="panel space-y-4">
          <h2>Authentication &amp; Security Policy</h2>
          <div className="formgrid">
            <div className="formgroup">
              <label>Session timeout (minutes)</label>
              <input
                type="number"
                min="5"
                max="1440"
                className="field full"
                value={form.SESSION_TIMEOUT_MINUTES}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    SESSION_TIMEOUT_MINUTES: e.target.value,
                  }))
                }
              />
            </div>

            <div className="formgroup">
              <label>Max failed login attempts</label>
              <input
                type="number"
                min="1"
                max="20"
                className="field full"
                value={form.MAX_LOGIN_ATTEMPTS}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    MAX_LOGIN_ATTEMPTS: e.target.value,
                  }))
                }
              />
            </div>

            <div className="formgroup">
              <label>Minimum password length</label>
              <input
                type="number"
                min="6"
                max="32"
                className="field full"
                value={form.PASSWORD_MIN_LENGTH}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    PASSWORD_MIN_LENGTH: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            {[
              {
                key: "TWO_FACTOR_REQUIRED",
                title: "Require two-factor authentication (2FA) for staff",
              },
              {
                key: "LOGIN_ALERTS",
                title: "Send security login alert emails on unrecognized sessions",
              },
            ].map((item) => (
              <label
                key={item.key}
                className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-[var(--line)] bg-[#fcf9fa] p-3 text-xs font-semibold text-[var(--text)]"
              >
                <span>{item.title}</span>
                <input
                  type="checkbox"
                  checked={Boolean(form[item.key])}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, [item.key]: e.target.checked }))
                  }
                  className="h-4 w-4 cursor-pointer"
                />
              </label>
            ))}
          </div>

          <button
            type="button"
            className="primarybtn"
            disabled={saving}
            onClick={() =>
              handleSaveSettings([
                "SESSION_TIMEOUT_MINUTES",
                "MAX_LOGIN_ATTEMPTS",
                "PASSWORD_MIN_LENGTH",
                "TWO_FACTOR_REQUIRED",
                "LOGIN_ALERTS",
              ])
            }
          >
            {saving ? "Saving..." : "Save security policy"}
          </button>
        </div>
      )}

      {/* TAX RULES MODAL */}
      {activeModal === "taxes" && (
        <div
          className="modalback"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setActiveModal(null);
              setEditingTaxId(null);
              setTaxForm(EMPTY_TAX_FORM);
            }
          }}
        >
          <div className="modal" style={{ maxWidth: "700px" }}>
            <div className="modalhead">
              <h2>Tax rules ({taxes.length})</h2>
              <button
                type="button"
                className="iconbtn"
                onClick={() => {
                  setActiveModal(null);
                  setEditingTaxId(null);
                  setTaxForm(EMPTY_TAX_FORM);
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTax}>
              <div className="formgrid">
                <div className="formgroup">
                  <label>Tax name *</label>
                  <input
                    className="field full"
                    placeholder="Standard GST"
                    value={taxForm.name}
                    onChange={(e) =>
                      setTaxForm((p) => ({ ...p, name: e.target.value }))
                    }
                  />
                </div>
                <div className="formgroup">
                  <label>Tax code</label>
                  <input
                    className="field full uppercase"
                    placeholder="GST18"
                    value={taxForm.code}
                    onChange={(e) =>
                      setTaxForm((p) => ({
                        ...p,
                        code: e.target.value.toUpperCase(),
                      }))
                    }
                  />
                </div>
                <div className="formgroup">
                  <label>Type</label>
                  <select
                    className="field full"
                    value={taxForm.type}
                    onChange={(e) =>
                      setTaxForm((p) => ({ ...p, type: e.target.value }))
                    }
                  >
                    <option value="GST">GST</option>
                    <option value="IGST">IGST</option>
                    <option value="CGST">CGST</option>
                    <option value="SGST">SGST</option>
                    <option value="VAT">VAT</option>
                    <option value="CUSTOM">Custom</option>
                  </select>
                </div>
                <div className="formgroup">
                  <label>Rate (%) *</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    className="field full"
                    value={taxForm.rate}
                    onChange={(e) =>
                      setTaxForm((p) => ({ ...p, rate: e.target.value }))
                    }
                  />
                </div>
                <div className="formgroup">
                  <label>Country</label>
                  <input
                    className="field full"
                    placeholder="India"
                    value={taxForm.country}
                    onChange={(e) =>
                      setTaxForm((p) => ({ ...p, country: e.target.value }))
                    }
                  />
                </div>
                <div className="formgroup">
                  <label>State scope</label>
                  <input
                    className="field full"
                    placeholder="ALL"
                    value={taxForm.state}
                    onChange={(e) =>
                      setTaxForm((p) => ({ ...p, state: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-4 text-xs font-semibold">
                  <label className="flex cursor-pointer items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={Boolean(taxForm.isCompound)}
                      onChange={(e) =>
                        setTaxForm((p) => ({
                          ...p,
                          isCompound: e.target.checked,
                        }))
                      }
                    />
                    Compound tax
                  </label>
                  <label className="flex cursor-pointer items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={Boolean(taxForm.isActive)}
                      onChange={(e) =>
                        setTaxForm((p) => ({
                          ...p,
                          isActive: e.target.checked,
                        }))
                      }
                    />
                    Active
                  </label>
                </div>

                <div className="flex gap-2">
                  {editingTaxId && (
                    <button
                      type="button"
                      className="outlinebtn"
                      onClick={() => {
                        setEditingTaxId(null);
                        setTaxForm(EMPTY_TAX_FORM);
                      }}
                    >
                      Cancel edit
                    </button>
                  )}
                  <button
                    type="submit"
                    className="primarybtn"
                    disabled={saving}
                  >
                    {editingTaxId ? "Update tax rule" : "+ Add tax rule"}
                  </button>
                </div>
              </div>
            </form>

            <div className="tablewrap mt-4">
              {taxes.length === 0 ? (
                <p className="muted text-xs">
                  No tax rules created yet. Add your first tax slab above.
                </p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Rule</th>
                      <th>Code / Type</th>
                      <th>Region</th>
                      <th>Rate</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taxes.map((t) => (
                      <tr key={t._id}>
                        <td className="font-bold">{t.name}</td>
                        <td>
                          {t.code || "—"} · {t.type || "GST"}
                        </td>
                        <td>
                          {t.country || "India"} ({t.state || "ALL"})
                        </td>
                        <td>{t.rate}%</td>
                        <td>
                          <span
                            className={`status ${t.isActive !== false ? "green" : "amber"}`}
                          >
                            {t.isActive !== false ? "Active" : "Paused"}
                          </span>
                        </td>
                        <td>
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              className="btnsm"
                              onClick={() => {
                                setEditingTaxId(t._id);
                                setTaxForm({
                                  name: t.name || "",
                                  code: t.code || "",
                                  type: t.type || "GST",
                                  rate: String(t.rate ?? 18),
                                  country: t.country || "India",
                                  state: t.state || "ALL",
                                  isCompound: Boolean(t.isCompound),
                                  isActive: t.isActive !== false,
                                });
                              }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btnsm"
                              onClick={() => handleToggleTax(t)}
                            >
                              {t.isActive !== false ? "Pause" : "Activate"}
                            </button>
                            {confirmDeleteTaxId === t._id ? (
                              <button
                                type="button"
                                className="btnsm"
                                style={{
                                  background: "#bd3345",
                                  color: "#fff",
                                  borderColor: "#bd3345",
                                }}
                                onClick={() => handleDeleteTax(t._id)}
                              >
                                Confirm
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="btnsm"
                                style={{ color: "#bd3345" }}
                                onClick={() => setConfirmDeleteTaxId(t._id)}
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SHIPPING ZONES MODAL */}
      {activeModal === "shipping" && (
        <div
          className="modalback"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setActiveModal(null);
              setEditingZoneId(null);
              setZoneForm(EMPTY_ZONE_FORM);
            }
          }}
        >
          <div className="modal" style={{ maxWidth: "740px" }}>
            <div className="modalhead">
              <h2>Shipping zones ({shippingZones.length})</h2>
              <button
                type="button"
                className="iconbtn"
                onClick={() => {
                  setActiveModal(null);
                  setEditingZoneId(null);
                  setZoneForm(EMPTY_ZONE_FORM);
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveZone}>
              <div className="formgrid">
                <div className="formgroup">
                  <label>Zone name *</label>
                  <input
                    className="field full"
                    placeholder="Metro Cities"
                    value={zoneForm.name}
                    onChange={(e) =>
                      setZoneForm((p) => ({ ...p, name: e.target.value }))
                    }
                  />
                </div>
                <div className="formgroup">
                  <label>Shipping rate (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    className="field full"
                    value={zoneForm.rate}
                    onChange={(e) =>
                      setZoneForm((p) => ({ ...p, rate: e.target.value }))
                    }
                  />
                </div>
                <div className="formgroup">
                  <label>Free shipping above (₹)</label>
                  <input
                    type="number"
                    min="0"
                    className="field full"
                    value={zoneForm.freeShippingThreshold}
                    onChange={(e) =>
                      setZoneForm((p) => ({
                        ...p,
                        freeShippingThreshold: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="formgroup">
                  <label>Countries (comma separated)</label>
                  <input
                    className="field full"
                    placeholder="India"
                    value={zoneForm.countries}
                    onChange={(e) =>
                      setZoneForm((p) => ({ ...p, countries: e.target.value }))
                    }
                  />
                </div>
                <div className="formgroup">
                  <label>States (optional, comma separated)</label>
                  <input
                    className="field full"
                    placeholder="Maharashtra, Delhi, Karnataka"
                    value={zoneForm.states}
                    onChange={(e) =>
                      setZoneForm((p) => ({ ...p, states: e.target.value }))
                    }
                  />
                </div>
                <div className="formgroup">
                  <label>Postal codes (optional)</label>
                  <input
                    className="field full"
                    placeholder="110001, 400001"
                    value={zoneForm.postalCodes}
                    onChange={(e) =>
                      setZoneForm((p) => ({
                        ...p,
                        postalCodes: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="formgroup">
                  <label>ETA Min days</label>
                  <input
                    type="number"
                    min="1"
                    className="field full"
                    value={zoneForm.minDays}
                    onChange={(e) =>
                      setZoneForm((p) => ({ ...p, minDays: e.target.value }))
                    }
                  />
                </div>
                <div className="formgroup">
                  <label>ETA Max days</label>
                  <input
                    type="number"
                    min="1"
                    className="field full"
                    value={zoneForm.maxDays}
                    onChange={(e) =>
                      setZoneForm((p) => ({ ...p, maxDays: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <label className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={Boolean(zoneForm.isActive)}
                    onChange={(e) =>
                      setZoneForm((p) => ({ ...p, isActive: e.target.checked }))
                    }
                  />
                  Zone active
                </label>

                <div className="flex gap-2">
                  {editingZoneId && (
                    <button
                      type="button"
                      className="outlinebtn"
                      onClick={() => {
                        setEditingZoneId(null);
                        setZoneForm(EMPTY_ZONE_FORM);
                      }}
                    >
                      Cancel edit
                    </button>
                  )}
                  <button
                    type="submit"
                    className="primarybtn"
                    disabled={saving}
                  >
                    {editingZoneId ? "Update zone" : "+ Add shipping zone"}
                  </button>
                </div>
              </div>
            </form>

            <div className="tablewrap mt-4">
              {shippingZones.length === 0 ? (
                <p className="muted text-xs">
                  No shipping zones created yet. Add your first delivery zone above.
                </p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Zone</th>
                      <th>Coverage</th>
                      <th>Rate</th>
                      <th>Free Above</th>
                      <th>ETA</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shippingZones.map((z) => {
                      const rateVal = z.rate ?? z.shippingCharge ?? 0;
                      const freeVal =
                        z.freeShippingThreshold ?? z.freeShippingAbove ?? 0;
                      const etaMin = z.estimatedDays?.min ?? 2;
                      const etaMax = z.estimatedDays?.max ?? 5;
                      return (
                        <tr key={z._id}>
                          <td className="font-bold">{z.name}</td>
                          <td className="text-xs">
                            {(z.countries || ["India"]).join(", ")}
                            {z.states?.length ? ` · ${z.states.join(", ")}` : ""}
                          </td>
                          <td>₹{rateVal}</td>
                          <td>{freeVal > 0 ? `₹${freeVal}` : "None"}</td>
                          <td>
                            {etaMin}–{etaMax}d
                          </td>
                          <td>
                            <span
                              className={`status ${z.isActive !== false ? "green" : "amber"}`}
                            >
                              {z.isActive !== false ? "Active" : "Paused"}
                            </span>
                          </td>
                          <td>
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                className="btnsm"
                                onClick={() => {
                                  setEditingZoneId(z._id);
                                  setZoneForm({
                                    name: z.name || "",
                                    countries: (z.countries || ["India"]).join(", "),
                                    states: (z.states || []).join(", "),
                                    postalCodes: (
                                      z.postalCodes ||
                                      z.pincodes ||
                                      []
                                    ).join(", "),
                                    rate: String(rateVal),
                                    freeShippingThreshold: String(freeVal),
                                    minDays: String(etaMin),
                                    maxDays: String(etaMax),
                                    isActive: z.isActive !== false,
                                  });
                                }}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="btnsm"
                                onClick={() => handleToggleZone(z)}
                              >
                                {z.isActive !== false ? "Pause" : "Activate"}
                              </button>
                              {confirmDeleteZoneId === z._id ? (
                                <button
                                  type="button"
                                  className="btnsm"
                                  style={{
                                    background: "#bd3345",
                                    color: "#fff",
                                    borderColor: "#bd3345",
                                  }}
                                  onClick={() => handleDeleteZone(z._id)}
                                >
                                  Confirm
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="btnsm"
                                  style={{ color: "#bd3345" }}
                                  onClick={() => setConfirmDeleteZoneId(z._id)}
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SETTINGS AUDIT HISTORY MODAL */}
      {activeModal === "history" && (
        <div
          className="modalback"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveModal(null);
          }}
        >
          <div className="modal" style={{ maxWidth: "740px" }}>
            <div className="modalhead">
              <h2>Settings change history</h2>
              <button
                type="button"
                className="iconbtn"
                onClick={() => setActiveModal(null)}
              >
                ✕
              </button>
            </div>
            {settingsHistory.length === 0 ? (
              <p className="muted text-xs">
                No recent setting changes recorded yet. Update any setting to log audit entries.
              </p>
            ) : (
              <div className="tablewrap max-h-96 overflow-y-auto">
                <table>
                  <thead>
                    <tr>
                      <th>Key</th>
                      <th>Old Value</th>
                      <th>New Value</th>
                      <th>Changed By</th>
                      <th>When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {settingsHistory.map((h) => (
                      <tr key={h._id}>
                        <td className="font-bold">{h.key}</td>
                        <td>{formatValuePreview(h.oldValue)}</td>
                        <td className="font-semibold text-[var(--primary)]">
                          {formatValuePreview(h.newValue)}
                        </td>
                        <td>{h.changedBy || "Admin"}</td>
                        <td className="text-xs text-[var(--muted)]">
                          {formatDateTime(h.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
