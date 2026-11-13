import { useEffect, useState } from "react";
import { toast } from "sonner";
import vendorService from "../../services/vendor.service";

import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Textarea from "../../components/common/Textarea";
import Loader from "../../components/common/Loader";

const StoreSettings = ({
  user = null,
  store: propStore = null,
  loading: propLoading = false,
  saving: propSaving = false,
  onUpdateStore,
}) => {
  const [loading, setLoading] = useState(propLoading || !propStore);
  const [saving, setSaving] = useState(propSaving);
  const [form, setForm] = useState(() => ({
    storeName: propStore?.storeName || propStore?.name || "",
    description: propStore?.description || "",
    email: propStore?.email || user?.email || "",
    phone: propStore?.phone || user?.phone || "",
    address: propStore?.address || "",
    city: propStore?.city || "",
    state: propStore?.state || "",
    pincode: propStore?.pincode || propStore?.postalCode || "",
  }));

  useEffect(() => {
    if (propStore) {
      setForm({
        storeName: propStore?.storeName || propStore?.name || "",
        description: propStore?.description || "",
        email: propStore?.email || user?.email || "",
        phone: propStore?.phone || user?.phone || "",
        address: typeof propStore?.address === "string" ? propStore.address : propStore?.address?.street || "",
        city: propStore?.city || propStore?.address?.city || "",
        state: propStore?.state || propStore?.address?.state || "",
        pincode: propStore?.pincode || propStore?.address?.pinCode || "",
      });
      return;
    }

    let isMounted = true;
    const fetchStore = async () => {
      try {
        setLoading(true);
        const res = await vendorService.getMyStore();
        const s = res?.data?.store || res?.data || res;
        if (isMounted && s && typeof s === "object") {
          setForm({
            storeName: s.name || s.storeName || "",
            description: s.description || "",
            email: s.email || user?.email || "",
            phone: s.phone || user?.phone || "",
            address: typeof s.address === "string" ? s.address : s.address?.street || "",
            city: s.city || s.address?.city || "",
            state: s.state || s.address?.state || "",
            pincode: s.pincode || s.postalCode || s.address?.pinCode || "",
          });
        }
      } catch (err) {
        console.error("Failed to load store settings:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStore();
    return () => {
      isMounted = false;
    };
  }, [propStore, user]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (onUpdateStore) {
      await onUpdateStore(form);
      return;
    }

    try {
      setSaving(true);
      await vendorService.updateStore({
        name: form.storeName,
        storeName: form.storeName,
        description: form.description,
        email: form.email,
        phone: form.phone,
        address: form.address,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
      });
      toast.success("Store settings updated successfully");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update store settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-5xl space-y-6">
          {/* Page Header */}
          <div>
            <div className="eyebrow">Seller Centre</div>
            <h1 className="text-2xl font-black text-[var(--text)] dark:text-foreground">
              Store Settings
            </h1>

            <p className="mt-1 text-xs font-medium text-[var(--muted)]">
              Update the information customers see about your store.
            </p>
          </div>

          {/* Store Information */}
          <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-xs dark:border-line dark:bg-card">
            <div className="border-b border-[var(--line)] p-6 bg-[#fcf9fa] dark:bg-card">
              <h2 className="text-base font-black text-[var(--text)] dark:text-foreground">
                Store Information
              </h2>

              <p className="mt-0.5 text-xs font-medium text-[var(--muted)]">
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
                <h3 className="mb-4 text-sm font-black text-[var(--text)] dark:text-foreground">
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
              <div className="flex justify-end border-t border-[var(--line)] pt-5">
                <Button type="submit" disabled={saving} className="primarybtn">
                  {saving ? "Saving..." : "Save Store Settings"}
                </Button>
              </div>
            </form>
          </section>

          {/* Store Preview */}
          <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-xs dark:border-line dark:bg-card">
            <div className="border-b border-[var(--line)] p-6 bg-[#fcf9fa] dark:bg-card">
              <h2 className="text-base font-black text-[var(--text)] dark:text-foreground">
                Store Preview
              </h2>

              <p className="mt-0.5 text-xs font-medium text-[var(--muted)]">
                Preview the basic information customers will see.
              </p>
            </div>

            <div className="p-6">
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--soft)]/40 p-6">
                <h3 className="text-xl font-black text-[var(--primary)]">
                  {form.storeName || "Your Store"}
                </h3>

                <p className="mt-2 text-xs font-medium leading-5 text-[var(--muted)]">
                  {form.description ||
                    "Your store description will appear here."}
                </p>

                <div className="mt-5 grid gap-3 text-xs sm:grid-cols-2">
                  <div>
                    <span className="font-bold text-[var(--muted)]">Email:</span>{" "}
                    <span className="font-bold text-[var(--text)] dark:text-foreground">
                      {form.email || "—"}
                    </span>
                  </div>

                  <div>
                    <span className="font-bold text-[var(--muted)]">Phone:</span>{" "}
                    <span className="font-bold text-[var(--text)] dark:text-foreground">
                      {form.phone || "—"}
                    </span>
                  </div>

                  <div className="sm:col-span-2">
                    <span className="font-bold text-[var(--muted)]">Address:</span>{" "}
                    <span className="font-bold text-[var(--text)] dark:text-foreground">
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
  );
};

export default StoreSettings;
