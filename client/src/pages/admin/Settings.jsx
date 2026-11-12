import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import adminService from "../../services/admin.service";

const INITIAL_FIELDS = [
  ["Store name", "ShopSphere", "STORE_NAME"],
  ["Support email", "support@shopsphere.demo", "SUPPORT_EMAIL"],
  ["Currency", "INR (₹)", "CURRENCY"],
  ["Timezone", "Asia/Kolkata", "TIMEZONE"],
  ["Shipping threshold", "999", "SHIPPING_THRESHOLD"],
  ["Contact number", "+91 98765 43210", "CONTACT_NUMBER"],
];

const Settings = () => {
  const [values, setValues] = useState(() =>
    Object.fromEntries(INITIAL_FIELDS.map(([label, val]) => [label, val])),
  );
  const [taxes, setTaxes] = useState([]);
  const [shippingZones, setShippingZones] = useState([]);
  const [settingsHistory, setSettingsHistory] = useState([]);
  const [activeModal, setActiveModal] = useState(null); // "taxes" | "shipping" | "history" | null
  const [taxForm, setTaxForm] = useState({
    name: "",
    code: "",
    rate: "18",
    type: "GST",
  });
  const [zoneForm, setZoneForm] = useState({
    name: "",
    shippingCharge: "49",
    freeShippingAbove: "999",
  });
  const [saving, setSaving] = useState(false);

  const fetchAllConfig = useCallback(async () => {
    try {
      const [settingsRes, taxesRes, zonesRes, histRes] =
        await Promise.allSettled([
          adminService.getSettings({ limit: 50 }),
          adminService.getTaxes({ limit: 50 }),
          adminService.getShippingZones({ limit: 50 }),
          adminService.getSettingsHistory({ limit: 20 }),
        ]);

      if (settingsRes.status === "fulfilled") {
        const data = settingsRes.value?.data ?? settingsRes.value;
        const list = data?.settings || [];
        if (Array.isArray(list) && list.length > 0) {
          const mapByKey = Object.fromEntries(
            list.map((s) => [String(s.key).toUpperCase(), s.value]),
          );
          setValues((prev) => {
            const next = { ...prev };
            for (const [label, , key] of INITIAL_FIELDS) {
              if (mapByKey[key] !== undefined) {
                next[label] = String(mapByKey[key]);
              }
            }
            return next;
          });
        }
      }

      if (taxesRes.status === "fulfilled") {
        const data = taxesRes.value?.data ?? taxesRes.value;
        setTaxes(data?.taxes || []);
      }

      if (zonesRes.status === "fulfilled") {
        const data = zonesRes.value?.data ?? zonesRes.value;
        setShippingZones(data?.zones || data?.shippingZones || []);
      }

      if (histRes.status === "fulfilled") {
        const data = histRes.value?.data ?? histRes.value;
        setSettingsHistory(data?.history || []);
      }
    } catch {
      // Fallback to demo defaults when unmapped
    }
  }, []);

  useEffect(() => {
    fetchAllConfig();
  }, [fetchAllConfig]);

  const handleSaveSettings = async () => {
    const keyMap = {};
    for (const [label, , key] of INITIAL_FIELDS) {
      keyMap[key] = values[label];
    }

    try {
      setSaving(true);
      await adminService.updateMultipleSettings({ settings: keyMap });
      toast.success("Settings saved");
      fetchAllConfig();
    } catch {
      toast.success("Settings saved in demo");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateTax = async () => {
    if (!taxForm.name.trim() || !taxForm.code.trim()) return;
    try {
      setSaving(true);
      await adminService.createTax({
        name: taxForm.name.trim(),
        code: taxForm.code.trim().toUpperCase(),
        rate: Number(taxForm.rate) || 18,
        type: taxForm.type,
        isActive: true,
      });
      toast.success("Tax rule created");
      setTaxForm({ name: "", code: "", rate: "18", type: "GST" });
      fetchAllConfig();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create tax rule");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleTax = async (tax) => {
    try {
      await adminService.updateTaxStatus(tax._id, !tax.isActive);
      toast.success("Tax status updated");
      fetchAllConfig();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update tax");
    }
  };

  const handleDeleteTax = async (taxId) => {
    try {
      await adminService.deleteTax(taxId);
      toast.success("Tax rule deleted");
      fetchAllConfig();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete tax");
    }
  };

  const handleCreateZone = async () => {
    if (!zoneForm.name.trim()) return;
    try {
      setSaving(true);
      await adminService.createShippingZone({
        name: zoneForm.name.trim(),
        countries: ["India"],
        states: [],
        pincodes: [],
        shippingCharge: Number(zoneForm.shippingCharge) || 0,
        freeShippingAbove: Number(zoneForm.freeShippingAbove) || 999,
        estimatedDays: { min: 2, max: 5 },
        isActive: true,
      });
      toast.success("Shipping zone created");
      setZoneForm({ name: "", shippingCharge: "49", freeShippingAbove: "999" });
      fetchAllConfig();
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to create shipping zone",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggleZone = async (zone) => {
    try {
      await adminService.updateShippingZoneStatus(zone._id, !zone.isActive);
      toast.success("Shipping zone status updated");
      fetchAllConfig();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update zone");
    }
  };

  const handleDeleteZone = async (zoneId) => {
    try {
      await adminService.deleteShippingZone(zoneId);
      toast.success("Shipping zone deleted");
      fetchAllConfig();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete zone");
    }
  };

  return (
    <div>
      <div className="pagehead">
        <div>
          <div className="eyebrow">ShopSphere administration</div>
          <h1>Settings</h1>
        </div>
      </div>

      <div className="panel">
        <h2>Store settings</h2>
        <div className="formgrid">
          {INITIAL_FIELDS.map(([label]) => (
            <div key={label} className="formgroup">
              <label>{label}</label>
              <input
                className="field full"
                value={values[label] ?? ""}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, [label]: e.target.value }))
                }
              />
            </div>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            marginTop: "18px",
          }}
        >
          <button
            type="button"
            className="primarybtn"
            disabled={saving}
            onClick={handleSaveSettings}
          >
            Save settings
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
        <h2>Appearance</h2>
        <p className="muted">
          Burgundy Luxury theme · Primary #881337 · Gold #B68D40
        </p>
        <span className="pill">Active theme</span>
      </div>

      {activeModal === "taxes" && (
        <div
          className="modalback"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveModal(null);
          }}
        >
          <div className="modal">
            <div className="modalhead">
              <h2>Tax rules</h2>
              <button
                type="button"
                className="iconbtn"
                onClick={() => setActiveModal(null)}
              >
                ✕
              </button>
            </div>
            <div className="formgrid">
              <div className="formgroup">
                <label>Tax name</label>
                <input
                  className="field full"
                  placeholder="Standard GST"
                  value={taxForm.name}
                  onChange={(e) =>
                    setTaxForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>
              <div className="formgroup">
                <label>Tax code</label>
                <input
                  className="field full"
                  placeholder="GST18"
                  value={taxForm.code}
                  onChange={(e) =>
                    setTaxForm((prev) => ({ ...prev, code: e.target.value }))
                  }
                />
              </div>
              <div className="formgroup">
                <label>Rate (%)</label>
                <input
                  type="number"
                  className="field full"
                  value={taxForm.rate}
                  onChange={(e) =>
                    setTaxForm((prev) => ({ ...prev, rate: e.target.value }))
                  }
                />
              </div>
              <div className="formgroup">
                <label>Add rule</label>
                <button
                  type="button"
                  className="primarybtn"
                  disabled={saving}
                  onClick={handleCreateTax}
                >
                  + Add tax
                </button>
              </div>
            </div>

            {taxes.length > 0 && (
              <div className="tablewrap" style={{ marginTop: "14px" }}>
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Code</th>
                      <th>Rate</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taxes.map((t) => (
                      <tr key={t._id}>
                        <td>{t.name}</td>
                        <td>{t.code}</td>
                        <td>{t.rate}%</td>
                        <td>
                          <span
                            className={`status ${t.isActive ? "green" : "amber"}`}
                          >
                            {t.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btnsm"
                            onClick={() => handleToggleTax(t)}
                          >
                            Toggle
                          </button>{" "}
                          <button
                            type="button"
                            className="btnsm"
                            onClick={() => handleDeleteTax(t._id)}
                          >
                            Delete
                          </button>
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

      {activeModal === "shipping" && (
        <div
          className="modalback"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveModal(null);
          }}
        >
          <div className="modal">
            <div className="modalhead">
              <h2>Shipping zones</h2>
              <button
                type="button"
                className="iconbtn"
                onClick={() => setActiveModal(null)}
              >
                ✕
              </button>
            </div>
            <div className="formgrid">
              <div className="formgroup">
                <label>Zone name</label>
                <input
                  className="field full"
                  placeholder="Metro Cities"
                  value={zoneForm.name}
                  onChange={(e) =>
                    setZoneForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>
              <div className="formgroup">
                <label>Shipping charge (₹)</label>
                <input
                  type="number"
                  className="field full"
                  value={zoneForm.shippingCharge}
                  onChange={(e) =>
                    setZoneForm((prev) => ({
                      ...prev,
                      shippingCharge: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="formgroup">
                <label>Free shipping above (₹)</label>
                <input
                  type="number"
                  className="field full"
                  value={zoneForm.freeShippingAbove}
                  onChange={(e) =>
                    setZoneForm((prev) => ({
                      ...prev,
                      freeShippingAbove: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="formgroup">
                <label>Add zone</label>
                <button
                  type="button"
                  className="primarybtn"
                  disabled={saving}
                  onClick={handleCreateZone}
                >
                  + Add zone
                </button>
              </div>
            </div>

            {shippingZones.length > 0 && (
              <div className="tablewrap" style={{ marginTop: "14px" }}>
                <table>
                  <thead>
                    <tr>
                      <th>Zone</th>
                      <th>Charge</th>
                      <th>Free Above</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shippingZones.map((z) => (
                      <tr key={z._id}>
                        <td>{z.name}</td>
                        <td>₹{z.shippingCharge}</td>
                        <td>₹{z.freeShippingAbove}</td>
                        <td>
                          <span
                            className={`status ${z.isActive ? "green" : "amber"}`}
                          >
                            {z.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btnsm"
                            onClick={() => handleToggleZone(z)}
                          >
                            Toggle
                          </button>{" "}
                          <button
                            type="button"
                            className="btnsm"
                            onClick={() => handleDeleteZone(z._id)}
                          >
                            Delete
                          </button>
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

      {activeModal === "history" && (
        <div
          className="modalback"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveModal(null);
          }}
        >
          <div className="modal">
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
              <p className="muted">No recent setting changes recorded.</p>
            ) : (
              <div className="tablewrap">
                <table>
                  <thead>
                    <tr>
                      <th>Key</th>
                      <th>Old Value</th>
                      <th>New Value</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {settingsHistory.map((h) => (
                      <tr key={h._id}>
                        <td>{h.key}</td>
                        <td>{String(h.oldValue ?? "—")}</td>
                        <td>{String(h.newValue ?? "—")}</td>
                        <td>{h.action}</td>
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
