import { useEffect, useMemo, useState } from "react";
import adminService from "../../services/admin.service";
import Button from "../../components/common/Button";
import EmptyState from "../../components/common/EmptyState";
import Input from "../../components/common/Input";
import Loader from "../../components/common/Loader";
import Modal from "../../components/common/Modal";

const EMPTY_FORM = { name: "", description: "", image: "", status: true };

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const response = await adminService.getCategories();
        const data = response?.data ?? response;
        setCategories(data?.categories || data || []);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredCategories = useMemo(() => categories, [categories]);

  const openCreateModal = () => { setSelectedCategory(null); setForm(EMPTY_FORM); setFormOpen(true); };
  const openEditModal = (cat) => { setSelectedCategory(cat); setForm({ ...EMPTY_FORM, name: cat?.name || "", description: cat?.description || "", image: cat?.image || "", status: cat?.status ?? cat?.isActive ?? true }); setFormOpen(true); };
  const closeFormModal = () => { setFormOpen(false); setSelectedCategory(null); };
  const handleChange = (e) => { setForm(f => ({ ...f, [e.target.name]: e.target.value })); };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const payload = { name: form.name.trim(), description: form.description.trim(), image: form.image.trim(), status: Boolean(form.status) };
    try {
      if (selectedCategory) await adminService.updateCategory(selectedCategory._id || selectedCategory.id, payload);
      else await adminService.createCategory(payload);
    } catch (err) { console.error("Failed to save:", err); }
    closeFormModal();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-bold">Categories</h1>
            <Button onClick={openCreateModal}>Add Category</Button>
          </div>
          {loading ? <Loader /> : filteredCategories.length === 0 ? (
            <EmptyState title="No categories found" description="Create your first category." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead><tr><th className="text-left p-4">Name</th><th className="text-left p-4">Description</th><th className="text-left p-4">Status</th><th className="text-right p-4">Actions</th></tr></thead>
                <tbody>
                  {filteredCategories.map(cat => (
                    <tr key={cat?._id || cat?.id} className="border-t">
                      <td className="p-4">{cat?.name}</td>
                      <td className="p-4">{cat?.description || "-"}</td>
                      <td className="p-4">{cat?.status !== false ? "Active" : "Inactive"}</td>
                      <td className="p-4 text-right">
                        <button onClick={() => openEditModal(cat)} className="mr-2">Edit</button>
                        <button onClick={() => { if (window.confirm("Delete?")) { adminService.deleteCategory(cat?._id || cat?.id); } }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      <Modal open={formOpen} onClose={closeFormModal} title={selectedCategory ? "Edit Category" : "Create Category"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Name" name="name" value={form.name} onChange={handleChange} required />
          <Input label="Description" name="description" value={form.description} onChange={handleChange} />
          <Input label="Image URL" name="image" value={form.image} onChange={handleChange} />
          <label className="flex items-center"><input type="checkbox" checked={form.status} onChange={handleChange} /> <span className="ml-2">Status</span></label>
          <Button type="submit">Save</Button>
        </form>
      </Modal>
    </div>
  );
};

export default Categories;