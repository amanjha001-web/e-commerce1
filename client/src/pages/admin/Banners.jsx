import { useState } from "react";

import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Modal from "../../components/common/Modal";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";

const EMPTY_FORM = {
  title: "",
  image: "",
  link: "",
  status: true,
};

const Banners = ({
  banners = [],
  totalBanners = 0,
  loading = false,
  saving = false,

  onCreateBanner,
  onEditBanner,
  onDeleteBanner,
  onToggleBannerStatus,
}) => {
  const [formOpen, setFormOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const resetForm = () => {
    setForm({ ...EMPTY_FORM });
    setSelectedBanner(null);
  };

  const handleCreate = () => {
    resetForm();
    setFormOpen(true);
  };

  const handleEdit = (banner) => {
    setSelectedBanner(banner);

    setForm({
      title: banner?.title || "",
      image: banner?.image || banner?.imageUrl || "",
      link: banner?.link || banner?.url || "",
      status: banner?.status ?? banner?.isActive ?? true,
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

    if (saving || !form.title.trim() || !form.image.trim()) {
      return;
    }

    const payload = {
      ...form,
      title: form.title.trim(),
      image: form.image.trim(),
      link: form.link.trim(),
      status: Boolean(form.status),
    };

    if (selectedBanner) {
      await onEditBanner?.(selectedBanner, payload);
    } else {
      await onCreateBanner?.(payload);
    }

    setFormOpen(false);
    resetForm();
  };

  const handleDelete = async (banner) => {
    if (saving) return;

    await onDeleteBanner?.(banner);
  };

  const handleToggleStatus = async (banner) => {
    if (saving) return;

    await onToggleBannerStatus?.(banner);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="min-w-0 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          {/* Page Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Banners
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                Manage promotional banners displayed across the store.
              </p>
            </div>

            <Button type="button" onClick={handleCreate} disabled={saving}>
              Add Banner
            </Button>
          </div>

          {/* Banner Count */}
          <div className="mb-6">
            <p className="text-sm text-muted-foreground">Total Banners</p>

            <p className="text-2xl font-semibold">
              {totalBanners || banners.length}
            </p>
          </div>

          {/* Banner Content */}
          {loading ? (
            <div className="flex min-h-48 items-center justify-center rounded-2xl border border-border bg-card">
              <Loader />
            </div>
          ) : banners.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
              <EmptyState
                title="No banners found"
                description="Create your first promotional banner to display on the store."
                actionLabel="Add Banner"
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
                        Banner
                      </th>

                      <th className="px-5 py-4 text-left text-sm font-semibold">
                        Title
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
                    {banners.map((banner) => {
                      const bannerId = banner?._id || banner?.id;

                      const image =
                        banner?.image ||
                        banner?.imageUrl ||
                        banner?.bannerImage;

                      const title = banner?.title || "Untitled Banner";

                      const isActive =
                        banner?.status ?? banner?.isActive ?? false;

                      return (
                        <tr
                          key={bannerId || title}
                          className="transition hover:bg-muted/30"
                        >
                          <td className="px-5 py-4">
                            <div className="h-16 w-28 overflow-hidden rounded-lg border border-border bg-muted">
                              {image ? (
                                <img
                                  src={image}
                                  alt={title}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                                  No Image
                                </div>
                              )}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <p className="font-medium">{title}</p>

                            {(banner?.link || banner?.url) && (
                              <p className="mt-1 max-w-xs truncate text-xs text-muted-foreground">
                                {banner.link || banner.url}
                              </p>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(banner)}
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
                                onClick={() => handleEdit(banner)}
                                disabled={saving}
                              >
                                Edit
                              </Button>

                              <Button
                                type="button"
                                variant="danger"
                                onClick={() => handleDelete(banner)}
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

      {/* Create / Edit Banner Modal */}
      <Modal
        open={formOpen}
        onClose={handleCloseForm}
        title={selectedBanner ? "Edit Banner" : "Create Banner"}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Banner Title"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Enter banner title"
            required
          />

          <Input
            label="Image URL"
            name="image"
            value={form.image}
            onChange={handleChange}
            placeholder="Enter banner image URL"
            required
          />

          <Input
            label="Redirect Link"
            name="link"
            value={form.link}
            onChange={handleChange}
            placeholder="Enter redirect URL"
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

            <span>Active Banner</span>
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

            <Button
              type="submit"
              disabled={saving || !form.title.trim() || !form.image.trim()}
            >
              {saving
                ? "Saving..."
                : selectedBanner
                  ? "Update Banner"
                  : "Create Banner"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Banners;
