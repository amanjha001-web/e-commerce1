import { useState } from "react";

import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Textarea from "../../components/common/Textarea";
import Loader from "../../components/common/Loader";

const StoreSettings = ({
  user = null,
  store = null,
  loading = false,
  saving = false,
  onUpdateStore,
}) => {
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
