import { useState } from "react";

import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Modal from "../../components/common/Modal";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";

const EMPTY_FORM = {
  name: "",
  logo: "",
  description: "",
  status: true,
};

const Brands = ({
  brands = [],
  totalBrands = 0,
  loading = false,
  saving = false,

  onCreateBrand,
  onEditBrand,
  onDeleteBrand,
  onToggleBrandStatus,
}) => {
  const [formOpen, setFormOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const resetForm = () => {
    setForm({ ...EMPTY_FORM });
    setSelectedBrand(null);
  };

  const handleCreate = () => {
    resetForm();
    setFormOpen(true);
  };

  const handleEdit = (brand) => {
    setSelectedBrand(brand);

    setForm({
      name: brand?.name || "",
      logo: brand?.logo || brand?.logoUrl || "",
      description: brand?.description || "",
      status: brand?.status ?? brand?.isActive ?? true,
    });

    setFormOpen(true);
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
      ...form,
      name: form.name.trim(),
      logo: form.logo.trim(),
      description: form.description.trim(),
      status: Boolean(form.status),
    };

    if (selectedBrand) {
      await onEditBrand?.(selectedBrand, payload);
    } else {
      await onCreateBrand?.(payload);
    }

    setFormOpen(false);
    resetForm();
  };

  const handleDelete = async (brand) => {
    if (saving) return;

    await onDeleteBrand?.(brand);
  };

  const handleToggleStatus = async (brand) => {
    if (saving) return;

    await onToggleBrandStatus?.(brand);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="min-w-0 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          {/* Page Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Brands
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                Manage product brands and their visibility.
              </p>
            </div>

            <Button type="button" onClick={handleCreate} disabled={saving}>
              Add Brand
            </Button>
          </div>

          {/* Brand Count */}
          <div className="mb-6">
            <p className="text-sm text-muted-foreground">Total Brands</p>

            <p className="text-2xl font-semibold">
              {totalBrands || brands.length}
            </p>
          </div>

          {/* Brand Content */}
          {loading ? (
            <div className="flex min-h-48 items-center justify-center rounded-2xl border border-border bg-card">
              <Loader />
            </div>
          ) : brands.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
              <EmptyState
                title="No brands found"
                description="Create your first brand to start organizing products."
                actionLabel="Add Brand"
                onAction={handleCreate}
              />
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px]">
                  <thead className="border-b border-border bg-muted/40">
                    <tr>
                      <th className="px-5 py-4 text-left text-sm font-semibold">
                        Brand
                      </th>

                      <th className="px-5 py-4 text-left text-sm font-semibold">
                        Description
                      </th>

                      <th className="px-5 py-4 text-left text-sm font-semibold">
                        Status
                      </th>

                      <th className="px-5 py-4 text-right text-sm font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border">
                    {brands.map((brand) => {
                      const brandId = brand?._id || brand?.id;

                      const logo = brand?.logo || brand?.logoUrl;

                      const name = brand?.name || "Unnamed Brand";

                      const isActive =
                        brand?.status ?? brand?.isActive ?? false;

                      return (
                        <tr
                          key={brandId || name}
                          className="transition hover:bg-muted/30"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted">
                                {logo ? (
                                  <img
                                    src={logo}
                                    alt={name}
                                    className="h-full w-full object-contain"
                                  />
                                ) : (
                                  <span className="text-xs text-muted-foreground">
                                    N/A
                                  </span>
                                )}
                              </div>

                              <span className="font-medium">{name}</span>
                            </div>
                          </td>

                          <td className="max-w-md px-5 py-4">
                            <p className="truncate text-sm text-muted-foreground">
                              {brand?.description || "No description"}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(brand)}
                              disabled={saving}
                              className={[
                                "rounded-full px-3 py-1 text-xs font-medium transition",
                                "disabled:cursor-not-allowed disabled:opacity-50",
                                isActive
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  : "bg-muted text-muted-foreground",
                              ].join(" ")}
                            >
                              {isActive ? "Active" : "Inactive"}
                            </button>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleEdit(brand)}
                                disabled={saving}
                              >
                                Edit
                              </Button>

                              <Button
                                type="button"
                                variant="danger"
                                onClick={() => handleDelete(brand)}
                                disabled={saving}
                              >
                                Delete
                              </Button>
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

      {/* Create / Edit Brand Modal */}
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
