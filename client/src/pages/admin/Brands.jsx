import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Modal from "../../components/common/Modal";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import adminService from "../../services/admin.service";

const EMPTY_FORM = {
  name: "",
  logo: "",
  description: "",
  status: true,
};

const Brands = ({
  brands: propBrands = [],
  totalBrands = 0,
  loading: propLoading = false,
  saving: propSaving = false,

  onCreateBrand,
  onEditBrand,
  onDeleteBrand,
  onToggleBrandStatus,
}) => {
  const [apiBrands, setApiBrands] = useState([]);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiSaving, setApiSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const fetchBrands = useCallback(async () => {
    try {
      setApiLoading(true);
      const res = await adminService.getBrands({ limit: 50 });
      const data = res?.data ?? res;
      if (Array.isArray(data?.brands)) {
        setApiBrands(data.brands);
      }
    } catch {
      // Ignore fallback error
    } finally {
      setApiLoading(false);
    }
  }, []);

  useEffect(() => {
    if (propBrands.length === 0) {
      fetchBrands();
    }
  }, [propBrands.length, fetchBrands]);

  const brands = propBrands.length > 0 ? propBrands : apiBrands;
  const loading = propLoading || apiLoading;
  const saving = propSaving || apiSaving;

  const resetForm = () => {
    setForm({ ...EMPTY_FORM });
    setSelectedBrand(null);
  };

  const handleCreate = () => {
    resetForm();
    setFormOpen(true);
  };

  const handleEdit = async (brand) => {
    setSelectedBrand(brand);

    setForm({
      name: brand?.name || "",
      logo: brand?.logo?.url || brand?.logo || brand?.logoUrl || "",
      description: brand?.description || "",
      status: brand?.status ?? brand?.isActive ?? true,
    });

    setFormOpen(true);

    if (brand?._id) {
      try {
        const res = await adminService.getBrandById(brand._id);
        const detail = res?.data ?? res;
        if (detail && typeof detail === "object") {
          setSelectedBrand(detail);
        }
      } catch {
        // Ignore detail fetch error
      }
    }
  };

  const handleCloseForm = () => {
    if (saving) return;

    setFormOpen(false);
    resetForm();
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

    if (saving || !form.name.trim()) return;

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      isActive: Boolean(form.status),
    };

    try {
      setApiSaving(true);
      if (selectedBrand) {
        if (onEditBrand) {
          await onEditBrand(selectedBrand, payload);
        } else if (selectedBrand._id) {
          await adminService.updateBrand(selectedBrand._id, payload);
          await fetchBrands();
        }
        toast.success("Brand updated");
      } else {
        if (onCreateBrand) {
          await onCreateBrand(payload);
        } else {
          await adminService.createBrand(payload);
          await fetchBrands();
        }
        toast.success("Brand created");
      }
      setFormOpen(false);
      resetForm();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save brand");
    } finally {
      setApiSaving(false);
    }
  };

  const handleDelete = async (brand) => {
    if (saving) return;
    if (onDeleteBrand) {
      await onDeleteBrand(brand);
      return;
    }
    if (!brand?._id) return;
    if (!window.confirm(`Delete brand "${brand.name}"?`)) return;
    try {
      setApiSaving(true);
      await adminService.deleteBrand(brand._id);
      toast.success("Brand deleted");
      fetchBrands();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete brand");
    } finally {
      setApiSaving(false);
    }
  };

  const handleToggleStatus = async (brand) => {
    if (saving) return;
    if (onToggleBrandStatus) {
      await onToggleBrandStatus(brand);
      return;
    }
    if (!brand?._id) return;
    const nextActive = !(brand?.status ?? brand?.isActive ?? false);
    try {
      setApiSaving(true);
      await adminService.updateBrandStatus(brand._id, nextActive);
      toast.success(nextActive ? "Brand activated" : "Brand deactivated");
      fetchBrands();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update status");
    } finally {
      setApiSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <main className="min-w-0 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="eyebrow">Catalog Management</div>
              <h1 className="text-2xl font-black text-[var(--text)] dark:text-foreground">
                Brands
              </h1>

              <p className="mt-1 text-xs font-medium text-[var(--muted)]">
                Manage product brands and their visibility.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="stat-card py-2.5 px-4 w-fit">
                <p className="text-[11px] font-bold text-[var(--muted)]">
                  Total Brands
                </p>
                <p className="text-xl font-black text-[var(--text)] dark:text-foreground">
                  {totalBrands || brands.length}
                </p>
              </div>

              <Button
                type="button"
                onClick={handleCreate}
                disabled={saving}
                className="primarybtn"
              >
                + Add Brand
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-48 items-center justify-center panel">
              <Loader />
            </div>
          ) : brands.length === 0 ? (
            <div className="panel p-8 text-center">
              <EmptyState
                title="No brands found"
                description="Create your first brand to start organizing products."
                actionLabel="Add Brand"
                onAction={handleCreate}
              />
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-xs dark:border-line dark:bg-card">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px]">
                  <thead className="border-b border-[var(--line)] bg-[#fcf9fa] text-[11px] font-black uppercase tracking-wider text-[var(--muted)] dark:bg-card">
                    <tr>
                      <th className="px-5 py-3.5 text-left">Brand</th>
                      <th className="px-5 py-3.5 text-left">Description</th>
                      <th className="px-5 py-3.5 text-left">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#f0e8eb] dark:divide-line">
                    {brands.map((brand) => {
                      const brandId = brand?._id || brand?.id;
                      const logo =
                        brand?.logo?.url || brand?.logo || brand?.logoUrl;
                      const name = brand?.name || "Unnamed Brand";
                      const isActive =
                        brand?.status ?? brand?.isActive ?? false;

                      return (
                        <tr
                          key={brandId || name}
                          className="transition hover:bg-[var(--soft)]/50"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--soft)]">
                                {logo ? (
                                  <img
                                    src={logo}
                                    alt={name}
                                    className="h-full w-full object-contain"
                                  />
                                ) : (
                                  <span className="text-[10px] font-bold text-[var(--muted)]">
                                    N/A
                                  </span>
                                )}
                              </div>

                              <span className="font-bold text-xs text-[var(--text)] dark:text-foreground">
                                {name}
                              </span>
                            </div>
                          </td>

                          <td className="max-w-md px-5 py-4">
                            <p className="truncate text-xs font-medium text-[var(--muted)]">
                              {brand?.description || "No description"}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(brand)}
                              disabled={saving}
                              className={[
                                "cursor-pointer transition disabled:opacity-50",
                                isActive
                                  ? "status-badge green"
                                  : "status-badge",
                              ].join(" ")}
                            >
                              {isActive ? "Active" : "Inactive"}
                            </button>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleEdit(brand)}
                                disabled={saving}
                                className="btnsm primary"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDelete(brand)}
                                disabled={saving}
                                className="btnsm text-[var(--red)] border-[#f3cbd0] hover:bg-[#fff0f1]"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      <Modal
        open={formOpen}
        onClose={handleCloseForm}
        title={selectedBrand ? "Edit Brand" : "Create Brand"}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Brand Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Enter brand name"
            required
          />

          <Input
            label="Logo URL"
            name="logo"
            value={form.logo}
            onChange={handleChange}
            placeholder="Enter logo URL"
          />

          <Input
            label="Description"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Enter brand description"
          />

          <label className="flex cursor-pointer items-center gap-3 text-sm">
            <input
              type="checkbox"
              name="status"
              checked={Boolean(form.status)}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  status: event.target.checked,
                }))
              }
              disabled={saving}
              className="h-4 w-4 rounded border-border"
            />

            <span>Active Brand</span>
          </label>

          <div className="flex justify-end gap-3 border-t border-border pt-5">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseForm}
              disabled={saving}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={saving || !form.name.trim()}>
              {saving
                ? "Saving..."
                : selectedBrand
                  ? "Update Brand"
                  : "Create Brand"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Brands;
