import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import vendorService from "../../services/vendor.service";

const EMPTY_FORM = {
  storeName: "",
  slug: "",
  email: "",
  phone: "",
  website: "",
  businessType: "",
  description: "",
  street: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
  taxNumber: "",
  businessLicense: "",
  accountHolderName: "",
  bankName: "",
  accountNumber: "",
  ifscCode: "",
};

const STATUS_BADGE = {
  approved: { label: "Approved", cls: "green" },
  pending: { label: "Pending approval", cls: "amber" },
  under_review: { label: "Under review", cls: "amber" },
  rejected: { label: "Rejected", cls: "red" },
  suspended: { label: "Suspended", cls: "red" },
};

const mapStoreToForm = (store = {}) => {
  const addr =
    store.address && typeof store.address === "object"
      ? store.address
      : { street: typeof store.address === "string" ? store.address : "" };
  const biz = store.businessDetails || {};
  const bank = biz.bankAccount || store.bankDetails || {};

  return {
    storeName: store.storeName || store.name || "",
    slug: store.slug || "",
    email: store.email || store.userId?.email || "",
    phone: store.phone || store.userId?.phone || "",
    website: store.website || "",
    businessType: store.businessType || "",
    description: store.description || "",
    street: addr.street || "",
    city: addr.city || store.city || "",
    state: addr.state || store.state || "",
    postalCode: addr.postalCode || addr.pincode || addr.pinCode || store.pincode || "",
    country: addr.country || "India",
    taxNumber: biz.taxNumber || store.gstin || store.taxNumber || "",
    businessLicense: biz.businessLicense || "",
    accountHolderName: bank.accountHolderName || "",
    bankName: bank.bankName || "",
    accountNumber: bank.accountNumber || "",
    ifscCode: bank.ifscCode || "",
  };
};

const Profile = () => {
  const [storeDoc, setStoreDoc] = useState(null);
  const [values, setValues] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const loadStore = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await vendorService.getMyStore();
      const store = res?.data?.store || res?.data || res;
      if (store && typeof store === "object") {
        setStoreDoc(store);
        setValues(mapStoreToForm(store));
      }
    } catch (err) {
      setError(
        err?.response?.data?.message || err?.message || "Failed to load shop profile",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadStore();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadStore]);

  const handleField = (name) => (event) => {
    const val = event.target.value;
    setValues((prev) => ({ ...prev, [name]: val }));
  };

  const handleLogoUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Logo file size must be under 5MB");
      return;
    }

    const formData = new FormData();
    formData.append("logo", file);

    try {
      setUploadingLogo(true);
      const res = await vendorService.updateStoreLogo(formData);
      const updated = res?.data || res;
      if (updated && typeof updated === "object") {
        setStoreDoc(updated);
      }
      toast.success("Store logo updated");
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to upload logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleBannerUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Banner file size must be under 5MB");
      return;
    }

    const formData = new FormData();
    formData.append("banner", file);

    try {
      setUploadingBanner(true);
      const res = await vendorService.updateStoreBanner(formData);
      const updated = res?.data || res;
      if (updated && typeof updated === "object") {
        setStoreDoc(updated);
      }
      toast.success("Store banner updated");
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to upload banner");
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleSave = async (event) => {
    event?.preventDefault();
    if (saving || loading) return;

    if (values.storeName.trim().length < 2) {
      toast.error("Shop name must be at least 2 characters");
      return;
    }
    if (values.email.trim() && !/^\S+@\S+\.\S+$/.test(values.email.trim())) {
      toast.error("Please enter a valid business email address");
      return;
    }

    try {
      setSaving(true);
      const res = await vendorService.updateStore({
        storeName: values.storeName.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        website: values.website.trim(),
        businessType: values.businessType.trim(),
        description: values.description.trim(),
        address: {
          street: values.street.trim(),
          city: values.city.trim(),
          state: values.state.trim(),
          postalCode: values.postalCode.trim(),
          country: values.country.trim() || "India",
        },
        businessDetails: {
          taxNumber: values.taxNumber.trim().toUpperCase(),
          businessLicense: values.businessLicense.trim(),
          bankAccount: {
            accountHolderName: values.accountHolderName.trim(),
            bankName: values.bankName.trim(),
            accountNumber: values.accountNumber.trim(),
            ifscCode: values.ifscCode.trim().toUpperCase(),
          },
        },
      });
      const updated = res?.data || res;
      if (updated && typeof updated === "object") {
        setStoreDoc(updated);
        setValues(mapStoreToForm(updated));
      }
      toast.success("Shop profile saved successfully");
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to update shop profile");
    } finally {
      setSaving(false);
    }
  };

  const statusKey = String(storeDoc?.status || "approved").toLowerCase();
  const statusMeta = STATUS_BADGE[statusKey] || { label: statusKey, cls: "amber" };
  const logoUrl = storeDoc?.logo?.url || "";
  const bannerUrl = storeDoc?.banner?.url || "";

  return (
    <div className="space-y-6">
      <div className="pagehead flex-wrap gap-3">
        <div>
          <div className="eyebrow">Seller centre</div>
          <h1 className="text-2xl font-black text-[var(--text)] dark:text-foreground">
            Shop Profile
          </h1>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Manage your business identity, address, branding, tax ID, and payout bank details.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {storeDoc && (
            <>
              <span className={`status ${statusMeta.cls}`}>
                {statusMeta.label}
              </span>
              <span className="pill">
                Commission: {Number(storeDoc.commissionRate ?? 10)}%
              </span>
            </>
          )}
          <button
            type="button"
            disabled={loading}
            onClick={loadStore}
            className="outlinebtn cursor-pointer disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "↻ Refresh"}
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#f3cbd0] bg-[#fff0f1] p-3.5 text-xs font-bold text-[var(--red)]"
        >
          <span>{error}</span>
          <button type="button" onClick={loadStore} className="btnsm text-[var(--red)]">
            Retry
          </button>
        </div>
      )}

      {storeDoc?.status === "rejected" && storeDoc?.rejectionReason && (
        <div
          role="alert"
          className="rounded-xl border border-[#f3cbd0] bg-[#fff0f1] p-3.5 text-xs font-bold text-[var(--red)]"
        >
          Verification feedback: {storeDoc.rejectionReason}
        </div>
      )}

      {/* Store Branding: Logo & Banner */}
      <div className="panel p-6">
        <h2 className="text-base font-black text-[var(--text)] dark:text-foreground">
          Store Branding
        </h2>
        <p className="mt-0.5 text-xs text-[var(--muted)]">
          Upload your shop logo and storefront banner (max 5MB each).
        </p>

        <div className="mt-4 grid gap-6 md:grid-cols-[220px_1fr]">
          <div>
            <p className="mb-2 text-xs font-bold text-[var(--muted)]">Store Logo</p>
            <div className="flex items-center gap-4">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={values.storeName || "Store Logo"}
                  className="h-20 w-20 rounded-2xl border border-[var(--line)] object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--soft)] text-2xl font-black text-[var(--primary)]">
                  {(values.storeName || "S").charAt(0).toUpperCase()}
                </div>
              )}
              <label className="btnsm cursor-pointer">
                {uploadingLogo ? "Uploading..." : "Change Logo"}
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploadingLogo || loading}
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold text-[var(--muted)]">Store Banner</p>
            <div className="relative flex h-28 items-center justify-center overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--soft)]/40">
              {bannerUrl ? (
                <img
                  src={bannerUrl}
                  alt="Store Banner"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-xs font-medium text-[var(--muted)]">
                  No banner uploaded yet
                </span>
              )}
              <label className="btnsm absolute right-3 bottom-3 cursor-pointer bg-white/95 shadow-xs">
                {uploadingBanner ? "Uploading..." : "Upload Banner"}
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploadingBanner || loading}
                  onChange={handleBannerUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="panel p-6">
          <h2 className="text-base font-black text-[var(--text)] dark:text-foreground">
            Shop Information
          </h2>

          {loading && !storeDoc ? (
            <p className="mt-4 text-xs text-[var(--muted)]">Loading shop details...</p>
          ) : (
            <div className="formgrid mt-4">
              <div className="formgroup">
                <label className="text-xs font-bold text-[var(--muted)]">
                  Shop Name *
                </label>
                <input
                  className="field full"
                  value={values.storeName}
                  onChange={handleField("storeName")}
                  placeholder="Enter your shop name"
                  required
                />
              </div>

              <div className="formgroup">
                <label className="text-xs font-bold text-[var(--muted)]">
                  Store Slug / URL
                </label>
                <input
                  className="field full"
                  value={values.slug}
                  disabled
                  title="Store handle cannot be modified directly"
                />
              </div>

              <div className="formgroup">
                <label className="text-xs font-bold text-[var(--muted)]">
                  Business Email
                </label>
                <input
                  className="field full"
                  type="email"
                  value={values.email}
                  onChange={handleField("email")}
                  placeholder="business@yourstore.com"
                />
              </div>

              <div className="formgroup">
                <label className="text-xs font-bold text-[var(--muted)]">
                  Contact Phone
                </label>
                <input
                  className="field full"
                  value={values.phone}
                  onChange={handleField("phone")}
                  placeholder="+91 9876543210"
                />
              </div>

              <div className="formgroup">
                <label className="text-xs font-bold text-[var(--muted)]">
                  Business Type
                </label>
                <input
                  className="field full"
                  value={values.businessType}
                  onChange={handleField("businessType")}
                  placeholder="e.g. Individual, Sole Proprietorship, Pvt Ltd"
                />
              </div>

              <div className="formgroup">
                <label className="text-xs font-bold text-[var(--muted)]">
                  Website
                </label>
                <input
                  className="field full"
                  type="url"
                  value={values.website}
                  onChange={handleField("website")}
                  placeholder="https://yourstore.com"
                />
              </div>

              <div className="formgroup sm:col-span-2">
                <label className="text-xs font-bold text-[var(--muted)]">
                  Store Description
                </label>
                <textarea
                  className="field full min-h-[80px]"
                  value={values.description}
                  onChange={handleField("description")}
                  placeholder="Describe your products, quality standards, and brand story..."
                />
              </div>
            </div>
          )}
        </div>

        <div className="panel p-6">
          <h2 className="text-base font-black text-[var(--text)] dark:text-foreground">
            Business Address
          </h2>

          <div className="formgrid mt-4">
            <div className="formgroup sm:col-span-2">
              <label className="text-xs font-bold text-[var(--muted)]">
                Street / Address Line
              </label>
              <input
                className="field full"
                value={values.street}
                onChange={handleField("street")}
                placeholder="Building, street, locality"
              />
            </div>

            <div className="formgroup">
              <label className="text-xs font-bold text-[var(--muted)]">City</label>
              <input
                className="field full"
                value={values.city}
                onChange={handleField("city")}
                placeholder="City"
              />
            </div>

            <div className="formgroup">
              <label className="text-xs font-bold text-[var(--muted)]">State</label>
              <input
                className="field full"
                value={values.state}
                onChange={handleField("state")}
                placeholder="State"
              />
            </div>

            <div className="formgroup">
              <label className="text-xs font-bold text-[var(--muted)]">
                Postal / PIN Code
              </label>
              <input
                className="field full"
                value={values.postalCode}
                onChange={handleField("postalCode")}
                placeholder="PIN code"
              />
            </div>

            <div className="formgroup">
              <label className="text-xs font-bold text-[var(--muted)]">Country</label>
              <input
                className="field full"
                value={values.country}
                onChange={handleField("country")}
                placeholder="Country"
              />
            </div>
          </div>
        </div>

        <div className="panel p-6">
          <h2 className="text-base font-black text-[var(--text)] dark:text-foreground">
            Tax Compliance & Bank Payout Account
          </h2>
          <p className="mt-0.5 text-xs text-[var(--muted)]">
            Your earnings payout requests will be transferred to these saved bank details.
          </p>

          <div className="formgrid mt-4">
            <div className="formgroup">
              <label className="text-xs font-bold text-[var(--muted)]">
                GSTIN / Tax ID
              </label>
              <input
                className="field full uppercase"
                value={values.taxNumber}
                onChange={handleField("taxNumber")}
                placeholder="e.g. 09ABCDE1234F1Z5"
              />
            </div>

            <div className="formgroup">
              <label className="text-xs font-bold text-[var(--muted)]">
                Business License / Trade Reg No.
              </label>
              <input
                className="field full"
                value={values.businessLicense}
                onChange={handleField("businessLicense")}
                placeholder="Optional trade registration number"
              />
            </div>

            <div className="formgroup">
              <label className="text-xs font-bold text-[var(--muted)]">
                Account Holder Name
              </label>
              <input
                className="field full"
                value={values.accountHolderName}
                onChange={handleField("accountHolderName")}
                placeholder="Name as on bank account"
              />
            </div>

            <div className="formgroup">
              <label className="text-xs font-bold text-[var(--muted)]">
                Bank Name
              </label>
              <input
                className="field full"
                value={values.bankName}
                onChange={handleField("bankName")}
                placeholder="e.g. HDFC Bank, SBI"
              />
            </div>

            <div className="formgroup">
              <label className="text-xs font-bold text-[var(--muted)]">
                Bank Account Number
              </label>
              <input
                className="field full"
                value={values.accountNumber}
                onChange={handleField("accountNumber")}
                placeholder="Account number"
              />
            </div>

            <div className="formgroup">
              <label className="text-xs font-bold text-[var(--muted)]">
                IFSC Code
              </label>
              <input
                className="field full uppercase"
                value={values.ifscCode}
                onChange={handleField("ifscCode")}
                placeholder="e.g. HDFC0001234"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end border-t border-[var(--line)] pt-5">
            <button
              type="submit"
              disabled={saving || loading}
              className="primarybtn cursor-pointer disabled:opacity-50"
            >
              {saving ? "Saving Changes..." : "Save Profile"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Profile;
