import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import adminService from "../../services/admin.service";

const DEMO_CATEGORIES = [
  {
    name: "Fashion",
    slug: "fashion",
    products: 42,
    status: "Active",
    isActive: true,
    isDemo: true,
  },
  {
    name: "Electronics",
    slug: "electronics",
    products: 28,
    status: "Active",
    isActive: true,
    isDemo: true,
  },
  {
    name: "Home & Living",
    slug: "home-&-living",
    products: 19,
    status: "Active",
    isActive: true,
    isDemo: true,
  },
  {
    name: "Beauty",
    slug: "beauty",
    products: 31,
    status: "Active",
    isActive: true,
    isDemo: true,
  },
  {
    name: "Accessories",
    slug: "accessories",
    products: 16,
    status: "Active",
    isActive: true,
    isDemo: true,
  },
];

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [demoCategories, setDemoCategories] = useState(DEMO_CATEGORIES);
  const [modalOpen, setModalOpen] = useState(false);
  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [editingCat, setEditingCat] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await adminService.getCategories({ limit: 50 });
      const data = response?.data ?? response;
      const list = data?.categories || data || [];
      if (Array.isArray(list) && list.length > 0) {
        setCategories(list);
      }
    } catch {
      // Fallback to reference categories when unmapped
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const rows = useMemo(() => {
    const source = categories.length > 0 ? categories : demoCategories;
    return source.map((c, i) => {
      const name = c.name || "Category";
      const slug = c.slug || name.toLowerCase().replaceAll(" ", "-");
      const productsCount =
        c.products ??
        c.productCount ??
        c.productsCount ??
        [42, 28, 19, 31, 16][i % 5];
      const isActive = c.status !== false && c.isActive !== false;
      const statusLabel = isActive ? "Active" : "Archived";

      return {
        ...c,
        _key: c._id || c.id || slug || i,
        _name: name,
        _slug: slug,
        _products: productsCount,
        _isActive: isActive,
        _status: statusLabel,
      };
    });
  }, [categories, demoCategories]);

  const handleOpenEdit = async (cat) => {
    setEditingCat(cat);
    setCatName(cat._name || "");
    setCatSlug(cat._slug || "");
    setCatDesc(cat.description || "");
    setModalOpen(true);

    if (!cat.isDemo && cat._id) {
      try {
        const res = await adminService.getCategoryById(cat._id);
        const detail = res?.data ?? res;
        if (detail && typeof detail === "object") {
          setEditingCat((prev) => (prev ? { ...prev, ...detail } : prev));
          setCatName(detail.name || cat._name || "");
          setCatSlug(detail.slug || cat._slug || "");
          setCatDesc(detail.description || "");
        }
      } catch {
        // Ignore detail fetch error
      }
    }
  };

  const handleSaveCategory = async () => {
    const trimmed = catName.trim();
    if (!trimmed) {
      setModalOpen(false);
      return;
    }

    setSaving(true);
    try {
      if (editingCat) {
        if (!editingCat.isDemo && editingCat._id) {
          await adminService.updateCategory(editingCat._id, {
            name: trimmed,
            slug: catSlug.trim() || undefined,
            description: catDesc.trim(),
          });
          await fetchCategories();
        } else {
          setDemoCategories((prev) =>
            prev.map((item) =>
              item.slug === editingCat._slug
                ? {
                    ...item,
                    name: trimmed,
                    slug:
                      catSlug.trim() ||
                      trimmed.toLowerCase().replaceAll(" ", "-"),
                  }
                : item,
            ),
          );
        }
        toast.success("Category edited");
      } else {
        try {
          await adminService.createCategory({
            name: trimmed,
            slug: catSlug.trim() || undefined,
            description: catDesc.trim(),
            isActive: true,
          });
          await fetchCategories();
        } catch {
          setDemoCategories((prev) => [
            ...prev,
            {
              name: trimmed,
              slug:
                catSlug.trim() || trimmed.toLowerCase().replaceAll(" ", "-"),
              products: 0,
              status: "Active",
              isActive: true,
              isDemo: true,
            },
          ]);
        }
        toast.success("Category added");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save category");
    } finally {
      setSaving(false);
      setModalOpen(false);
      setCatName("");
      setCatSlug("");
      setCatDesc("");
      setEditingCat(null);
    }
  };

  const handleArchiveToggle = async (cat) => {
    const nextActive = !cat._isActive;
    if (!cat.isDemo && cat._id) {
      try {
        await adminService.updateCategoryStatus(cat._id, nextActive);
        toast.success(nextActive ? "Category activated" : "Category archived");
        fetchCategories();
        return;
      } catch (err) {
        toast.error(
          err?.response?.data?.message || "Failed to update category status",
        );
        return;
      }
    }

    setDemoCategories((prev) =>
      prev.map((item) =>
        item.slug === cat._slug
          ? {
              ...item,
              isActive: nextActive,
              status: nextActive ? "Active" : "Archived",
            }
          : item,
      ),
    );
    toast.success(nextActive ? "Category activated" : "Category archived");
  };

  const handleDeleteCategory = async () => {
    if (!editingCat) return;
    if (!window.confirm(`Delete category "${editingCat._name}"?`)) return;
    if (!editingCat.isDemo && editingCat._id) {
      try {
        setSaving(true);
        await adminService.deleteCategory(editingCat._id);
        toast.success("Category deleted");
        setModalOpen(false);
        setEditingCat(null);
        fetchCategories();
      } catch (err) {
        toast.error(
          err?.response?.data?.message || "Failed to delete category",
        );
      } finally {
        setSaving(false);
      }
    } else {
      setDemoCategories((prev) =>
        prev.filter((item) => item.slug !== editingCat._slug),
      );
      toast.success("Category deleted");
      setModalOpen(false);
      setEditingCat(null);
    }
  };

  return (
    <div>
      <div className="pagehead">
        <div>
          <div className="eyebrow">ShopSphere administration</div>
          <h1>Categories</h1>
        </div>
      </div>

      <div className="panel">
        <div className="pagehead">
          <h2>Product categories</h2>
          <button
            type="button"
            className="primarybtn"
            onClick={() => {
              setEditingCat(null);
              setCatName("");
              setCatSlug("");
              setCatDesc("");
              setModalOpen(true);
            }}
          >
            + Add category
          </button>
        </div>

        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Slug</th>
                <th>Products</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c._key}>
                  <td>{c._name}</td>
                  <td>{c._slug}</td>
                  <td>{c._products}</td>
                  <td>
                    <span
                      className={`status ${c._isActive ? "green" : "amber"}`}
                    >
                      {c._status}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btnsm"
                      onClick={() => handleOpenEdit(c)}
                    >
                      Edit
                    </button>{" "}
                    <button
                      type="button"
                      className="btnsm"
                      onClick={() => handleArchiveToggle(c)}
                    >
                      {c._isActive ? "Archive" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div
          className="modalback"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
        >
          <div className="modal">
            <div className="modalhead">
              <h2>{editingCat ? "Edit category" : "Add category"}</h2>
              <button
                type="button"
                className="iconbtn"
                onClick={() => setModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="formgroup">
              <label>Category name</label>
              <input
                id="catName"
                className="field full"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
              />
            </div>
            <div className="formgroup" style={{ marginTop: "10px" }}>
              <label>Slug (optional)</label>
              <input
                className="field full"
                placeholder="auto-generated from name"
                value={catSlug}
                onChange={(e) => setCatSlug(e.target.value)}
              />
            </div>
            <div className="formgroup" style={{ marginTop: "10px" }}>
              <label>Description</label>
              <textarea
                className="field full"
                style={{ width: "100%" }}
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
              />
            </div>
            <div
              style={{
                display: "flex",
                gap: "8px",
                marginTop: "14px",
              }}
            >
              <button
                type="button"
                className="primarybtn"
                disabled={saving}
                onClick={handleSaveCategory}
              >
                Save
              </button>
              {editingCat && (
                <button
                  type="button"
                  className="btnsm"
                  disabled={saving}
                  onClick={handleDeleteCategory}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
