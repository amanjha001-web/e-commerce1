import { useMemo, useState } from "react";

import AdminHeader from "../../components/admin/AdminHeader";
import AdminSidebar from "../../components/admin/AdminSidebar";

import Button from "../../components/common/Button";
import EmptyState from "../../components/common/EmptyState";
import Input from "../../components/common/Input";
import Loader from "../../components/common/Loader";
import Modal from "../../components/common/Modal";

const EMPTY_FORM = {
  name: "",
  description: "",
  image: "",
  status: true,
};

const getCategoryForm = (category) => ({
  name: category?.name || "",
  description: category?.description || "",
  image: category?.image || "",
  status: category?.status ?? category?.isActive ?? true,
});

const getCategoryId = (category) => category?._id || category?.id || "";

const getStatus = (category) =>
  Boolean(category?.status ?? category?.isActive ?? false);

const Categories = ({
  user = null,
  categories = [],
  totalCategories = 0,
  loading = false,
  saving = false,
  notificationCount = 0,
  onCreateCategory,
  onEditCategory,
  onDeleteCategory,
  onToggleCategoryStatus,
  onLogout,
  onNavigate,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState(EMPTY_FORM);

  const filteredCategories = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return categories;
    }

    return categories.filter((category) => {
      const name = String(category?.name || "").toLowerCase();
      const description = String(category?.description || "").toLowerCase();

      return name.includes(keyword) || description.includes(keyword);
    });
  }, [categories, search]);

  const openCreateModal = () => {
    setSelectedCategory(null);
    setForm({ ...EMPTY_FORM });
    setFormOpen(true);
  };

  const openEditModal = (category) => {
    setSelectedCategory(category);
    setForm(getCategoryForm(category));
    setFormOpen(true);
  };

  const closeFormModal = () => {
    if (saving) return;

    setFormOpen(false);
    setSelectedCategory(null);
    setForm({ ...EMPTY_FORM });
  };

  const openDeleteModal = (category) => {
    setSelectedCategory(category);
    setDeleteOpen(true);
  };

  const closeDeleteModal = () => {
    if (saving) return;

    setDeleteOpen(false);
    setSelectedCategory(null);
  };

  const handleNavigate = (item) => {
    setSidebarOpen(false);
    onNavigate?.(item);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleStatusChange = (event) => {
    const { checked } = event.target;

    setForm((previous) => ({
      ...previous,
      status: checked,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim() || saving) {
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      image: form.image.trim(),
      status: Boolean(form.status),
    };

    if (selectedCategory) {
      await onEditCategory?.(getCategoryId(selectedCategory), payload);
    } else {
      await onCreateCategory?.(payload);
    }

    setFormOpen(false);
    setSelectedCategory(null);
    setForm({ ...EMPTY_FORM });
  };

  const handleDelete = async () => {
    if (!selectedCategory || saving) {
      return;
    }

    await onDeleteCategory?.(getCategoryId(selectedCategory));

    setDeleteOpen(false);
    setSelectedCategory(null);
  };

  const handleStatusToggle = async (category) => {
    if (saving) return;

    const id = getCategoryId(category);

    await onToggleCategoryStatus?.(id, !getStatus(category));
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
        onNavigate={handleNavigate}
        onLogout={onLogout}
      />

      <div className="lg:pl-72">
        {/* Header */}
        <AdminHeader
          user={user}
          notificationCount={notificationCount}
          onMenuClick={() => setSidebarOpen(true)}
          onNavigate={onNavigate}
          onLogout={onLogout}
        />

        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {/* Page Header */}
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="mb-1 text-sm font-medium text-primary">
                  Catalog Management
                </p>

                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Categories
                </h1>

                <p className="mt-2 text-sm text-muted-foreground">
                  Create, update and manage product categories.
                </p>
              </div>

              <Button onClick={openCreateModal}>+ Add Category</Button>
            </div>

            {/* Stats */}
            <div className="mb-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <p className="text-sm text-muted-foreground">
                  Total Categories
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {totalCategories || categories.length}
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <p className="text-sm text-muted-foreground">
                  Active Categories
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {categories.filter(getStatus).length}
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="mb-6 rounded-2xl border border-border bg-card p-4 shadow-sm">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search categories..."
              />
            </div>

            {/* Categories */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              {loading ? (
                <div className="flex min-h-[300px] items-center justify-center">
                  <Loader />
                </div>
              ) : filteredCategories.length === 0 ? (
                <div className="p-8">
                  <EmptyState
                    title="No categories found"
                    description={
                      search
                        ? "Try a different search term."
                        : "Create your first category to get started."
                    }
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-left">
                        <th className="px-6 py-4 text-sm font-semibold">
                          Category
                        </th>

                        <th className="px-6 py-4 text-sm font-semibold">
                          Description
                        </th>

                        <th className="px-6 py-4 text-sm font-semibold">
                          Status
                        </th>

                        <th className="px-6 py-4 text-right text-sm font-semibold">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredCategories.map((category) => {
                        const id = getCategoryId(category);
                        const active = getStatus(category);

                        return (
                          <tr
                            key={id}
                            className="border-b border-border last:border-0 hover:bg-muted/20"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {category?.image ? (
                                  <img
                                    src={category.image}
                                    alt={category.name || "Category"}
                                    className="h-11 w-11 rounded-xl object-cover"
                                  />
                                ) : (
                                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-lg font-semibold text-primary">
                                    {category?.name?.charAt(0)?.toUpperCase() ||
                                      "C"}
                                  </div>
                                )}

                                <div>
                                  <p className="font-semibold">
                                    {category?.name || "Unnamed Category"}
                                  </p>

                                  <p className="text-xs text-muted-foreground">
                                    ID: {id || "N/A"}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="max-w-sm px-6 py-4">
                              <p className="truncate text-sm text-muted-foreground">
                                {category?.description || "No description"}
                              </p>
                            </td>

                            <td className="px-6 py-4">
                              <button
                                type="button"
                                onClick={() => handleStatusToggle(category)}
                                disabled={saving}
                                className={[
                                  "rounded-full px-3 py-1 text-xs font-semibold transition",
                                  "disabled:cursor-not-allowed disabled:opacity-50",
                                  active
                                    ? "bg-green-500/10 text-green-600"
                                    : "bg-red-500/10 text-red-600",
                                ].join(" ")}
                              >
                                {active ? "Active" : "Inactive"}
                              </button>
                            </td>

                            <td className="px-6 py-4">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditModal(category)}
                                  disabled={saving}
                                >
                                  Edit
                                </Button>

                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => openDeleteModal(category)}
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
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Create / Edit Modal */}
      {formOpen && (
        <Modal
          key={
            selectedCategory
              ? getCategoryId(selectedCategory)
              : "create-category"
          }
          open={formOpen}
          onClose={closeFormModal}
          title={selectedCategory ? "Edit Category" : "Create Category"}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Category Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter category name"
              required
            />

            <Input
              label="Description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Enter category description"
            />

            <Input
              label="Image URL"
              name="image"
              value={form.image}
              onChange={handleChange}
              placeholder="https://example.com/category.jpg"
            />

            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border p-4">
              <div>
                <p className="text-sm font-semibold">Category Status</p>

                <p className="text-xs text-muted-foreground">
                  Enable this category for customers.
                </p>
              </div>

              <input
                type="checkbox"
                checked={Boolean(form.status)}
                onChange={handleStatusChange}
                disabled={saving}
                className="h-4 w-4"
              />
            </label>

            <div className="flex justify-end gap-3 border-t border-border pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={closeFormModal}
                disabled={saving}
              >
                Cancel
              </Button>

              <Button type="submit" disabled={saving || !form.name.trim()}>
                {saving
                  ? "Saving..."
                  : selectedCategory
                    ? "Update Category"
                    : "Create Category"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {deleteOpen && selectedCategory && (
        <Modal
          open={deleteOpen}
          onClose={closeDeleteModal}
          title="Delete Category"
        >
          <div className="space-y-6">
            <p className="text-sm leading-6 text-muted-foreground">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">
                {selectedCategory.name || "this category"}
              </span>
              ? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3 border-t border-border pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={closeDeleteModal}
                disabled={saving}
              >
                Cancel
              </Button>

              <Button
                type="button"
                variant="danger"
                onClick={handleDelete}
                disabled={saving}
              >
                {saving ? "Deleting..." : "Delete Category"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Categories;
