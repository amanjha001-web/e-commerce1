import { useEffect, useState } from "react";
import { toast } from "sonner";
import vendorService from "../../services/vendor.service";

const Profile = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState({
    storeName: "Northstar Store",
    slug: "northstar-store",
    email: "northstar@email.com",
    phone: "9876543210",
    gstin: "09ABCDE1234F1Z5",
    address: "Delhi, India",
    description: "Premium curated lifestyle & fashion goods.",
  });

  useEffect(() => {
    let isMounted = true;
    const fetchStore = async () => {
      try {
        setLoading(true);
        const res = await vendorService.getMyStore();
        const store = res?.data?.store || res?.data || res;
        if (isMounted && store && typeof store === "object") {
          setValues((prev) => ({
            ...prev,
            storeName: store.name || store.storeName || prev.storeName,
            slug: store.slug || prev.slug,
            email: store.email || prev.email,
            phone: store.phone || prev.phone,
            gstin: store.gstin || store.taxNumber || prev.gstin,
            address: typeof store.address === "string" ? store.address : store.address?.street || prev.address,
            description: store.description || prev.description,
          }));
        }
      } catch (err) {
        console.error("Failed to load store profile:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStore();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      await vendorService.updateStore({
        name: values.storeName,
        storeName: values.storeName,
        email: values.email,
        phone: values.phone,
        gstin: values.gstin,
        address: values.address,
        description: values.description,
      });
      toast.success("Shop profile saved successfully");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update shop profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="pagehead">
        <div>
          <div className="eyebrow">Seller centre</div>
          <h1 className="text-2xl font-black text-[var(--text)] dark:text-foreground">Shop Profile</h1>
          <p className="mt-1 text-xs text-[var(--muted)]">Manage your business details and public store presence.</p>
        </div>
      </div>

      <div className="panel p-6">
        <h2 className="text-base font-black text-[var(--text)] dark:text-foreground">Shop Information</h2>
        
        {loading ? (
          <p className="mt-4 text-xs text-[var(--muted)]">Loading shop details...</p>
        ) : (
          <div className="formgrid mt-4">
            <div className="formgroup">
              <label className="text-xs font-bold text-[var(--muted)]">Shop Name</label>
              <input
                className="field full"
                value={values.storeName}
                onChange={(e) => setValues({ ...values, storeName: e.target.value })}
              />
            </div>

            <div className="formgroup">
              <label className="text-xs font-bold text-[var(--muted)]">Store Slug / URL</label>
              <input
                className="field full"
                value={values.slug}
                disabled
                title="Store handle cannot be modified directly"
              />
            </div>

            <div className="formgroup">
              <label className="text-xs font-bold text-[var(--muted)]">Business Email</label>
              <input
                className="field full"
                type="email"
                value={values.email}
                onChange={(e) => setValues({ ...values, email: e.target.value })}
              />
            </div>

            <div className="formgroup">
              <label className="text-xs font-bold text-[var(--muted)]">Contact Phone</label>
              <input
                className="field full"
                value={values.phone}
                onChange={(e) => setValues({ ...values, phone: e.target.value })}
              />
            </div>

            <div className="formgroup">
              <label className="text-xs font-bold text-[var(--muted)]">GSTIN / Tax ID</label>
              <input
                className="field full"
                value={values.gstin}
                onChange={(e) => setValues({ ...values, gstin: e.target.value })}
              />
            </div>

            <div className="formgroup">
              <label className="text-xs font-bold text-[var(--muted)]">Business Address</label>
              <input
                className="field full"
                value={values.address}
                onChange={(e) => setValues({ ...values, address: e.target.value })}
              />
            </div>

            <div className="formgroup sm:col-span-2">
              <label className="text-xs font-bold text-[var(--muted)]">Store Description</label>
              <textarea
                className="field full min-h-[80px]"
                value={values.description}
                onChange={(e) => setValues({ ...values, description: e.target.value })}
              />
            </div>
          </div>
        )}

        <button
          type="button"
          disabled={saving || loading}
          className="primarybtn mt-6"
          onClick={handleSave}
        >
          {saving ? "Saving Changes..." : "Save Profile"}
        </button>
      </div>
    </div>
  );
};

export default Profile;
