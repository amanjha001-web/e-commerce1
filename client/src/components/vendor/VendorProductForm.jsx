import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import categoryService from "../../services/category.service";
import brandService from "../../services/brand.service";
import productService from "../../services/product.service";

import Button from "../common/Button";
import Input from "../common/Input";
import Select from "../common/Select";
import Textarea from "../common/Textarea";
import Breadcrumb from "../common/Breadcrumb";

const STATUS_BADGE = {
  published: { label: "Published", cls: "green" },
  pending_approval: { label: "Pending approval", cls: "amber" },
  draft: { label: "Draft", cls: "amber" },
  rejected: { label: "Rejected", cls: "red" },
  archived: { label: "Archived", cls: "" },
};

const normalizeOptions = (list = []) =>
  (Array.isArray(list) ? list : [])
    .map((item) => {
      if (typeof item === "string") return { label: item, value: item };
      if (!item) return null;
      return {
        label: item.label || item.name || item.title || "",
        value: item.value || item._id || item.id || "",
      };
    })
    .filter((o) => o && o.value && o.label);

const normalizeEditStatus = (raw) => {
  const s = String(raw || "").trim().toLowerCase();
  if (s === "draft") return "draft";
  if (s === "archived" || s === "inactive") return "archived";
  return "pending_approval";
};

const VendorProductForm = ({
  mode = "create",
  initialProduct = null,
  categories: propCategories = [],
  brands: propBrands = [],
  saving: propSaving = false,
  onSubmitOverride,
  onNavigate,
  onProductUpdated,
}) => {
  const navigate = useNavigate();
  const isEdit = mode === "edit";

  const [fetchedCategories, setFetchedCategories] = useState([]);
  const [fetchedBrands, setFetchedBrands] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [variantBusy, setVariantBusy] = useState(false);

  const [form, setForm] = useState(() => ({
    name: initialProduct?.name || "",
    shortDescription: initialProduct?.shortDescription || "",
    description: initialProduct?.description || "",
    category: initialProduct?.category?._id || initialProduct?.category || "",
    brand: initialProduct?.brand?._id || initialProduct?.brand || "",
    price: initialProduct?.price ?? "",
    compareAtPrice: initialProduct?.compareAtPrice || "",
    stock: initialProduct?.stock ?? initialProduct?.quantity ?? "",
    sku: initialProduct?.sku || "",
    tagsText: Array.isArray(initialProduct?.tags) ? initialProduct.tags.join(", ") : "",
    status: isEdit
      ? normalizeEditStatus(initialProduct?.status)
      : "pending_approval",
  }));

  const [existingImages, setExistingImages] = useState(
    () => (Array.isArray(initialProduct?.images) ? initialProduct.images : []),
  );
  const [queuedFiles, setQueuedFiles] = useState([]); // [{ file, previewUrl }]
  const [variants, setVariants] = useState(() =>
    Array.isArray(initialProduct?.variants) ? initialProduct.variants : [],
  );
  const [variantDraft, setVariantDraft] = useState({
    title: "",
    sku: "",
    price: "",
    stock: "",
    attrName: "Size",
    attrValue: "",
  });

  useEffect(() => {
    let cancelled = false;
    const needCats = !propCategories?.length;
    const needBrands = !propBrands?.length;
    if (!needCats && !needBrands) return undefined;

    Promise.all([
      needCats ? categoryService.getCategories().catch(() => null) : Promise.resolve(null),
      needBrands ? brandService.getBrands().catch(() => null) : Promise.resolve(null),
    ]).then(([catRes, brandRes]) => {
      if (cancelled) return;
      if (catRes) {
        const list = catRes?.data?.categories || catRes?.data || catRes?.categories || catRes || [];
        if (Array.isArray(list)) setFetchedCategories(list);
      }
      if (brandRes) {
        const list = brandRes?.data?.brands || brandRes?.data || brandRes?.brands || brandRes || [];
        if (Array.isArray(list)) setFetchedBrands(list);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [propCategories?.length, propBrands?.length]);

  useEffect(() => {
    return () => {
      queuedFiles.forEach((item) => {
        if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, [queuedFiles]);

  const categoryOptions = useMemo(
    () => normalizeOptions(propCategories?.length ? propCategories : fetchedCategories),
    [propCategories, fetchedCategories],
  );
  const brandOptions = useMemo(
    () => normalizeOptions(propBrands?.length ? propBrands : fetchedBrands),
    [propBrands, fetchedBrands],
  );

  const goTo = (target) => {
    if (onNavigate) {
      onNavigate(target);
      return;
    }
    const map = {
      dashboard: "/vendor",
      products: "/vendor/products",
    };
    navigate(map[target] || target);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFilePick = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const allowedSlots = Math.max(0, 5 - queuedFiles.length);
    const selected = files.slice(0, allowedSlots);
    if (files.length > allowedSlots) {
      toast.info("Up to 5 images can be uploaded per batch.");
    }
    const items = selected.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setQueuedFiles((prev) => [...prev, ...items]);
    event.target.value = "";
  };

  const removeQueuedFile = (index) => {
    setQueuedFiles((prev) => {
      const target = prev[index];
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, idx) => idx !== index);
    });
  };

  const handleDeleteExistingImage = async (imageId) => {
    if (!initialProduct?._id || !imageId) return;
    try {
      setUploadingImages(true);
      const res = await productService.deleteProductImage(initialProduct._id, imageId);
      const updated = res?.data || res;
      setExistingImages(
        Array.isArray(updated?.images)
          ? updated.images
          : existingImages.filter((img) => img._id !== imageId),
      );
      toast.success("Image removed");
      onProductUpdated?.(updated);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to delete image");
    } finally {
      setUploadingImages(false);
    }
  };

  const uploadQueuedImagesForProduct = async (productId) => {
    if (!queuedFiles.length || !productId) return null;
    const formData = new FormData();
    queuedFiles.forEach((item) => formData.append("images", item.file));
    const res = await productService.uploadProductImages(productId, formData);
    const updated = res?.data || res;
    queuedFiles.forEach((item) => {
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
    setQueuedFiles([]);
    if (Array.isArray(updated?.images)) {
      setExistingImages(updated.images);
    }
    return updated;
  };

  const handleUploadNow = async () => {
    if (!isEdit || !initialProduct?._id || !queuedFiles.length) return;
    try {
      setUploadingImages(true);
      const updated = await uploadQueuedImagesForProduct(initialProduct._id);
      toast.success("Images uploaded successfully");
      onProductUpdated?.(updated);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to upload images");
    } finally {
      setUploadingImages(false);
    }
  };

  const handleAddVariant = async () => {
    const title = variantDraft.title.trim();
    const priceNum = Number(variantDraft.price || form.price || 0);
    const stockNum = Number(variantDraft.stock || 0);
    if (!title) {
      toast.error("Please enter a variant title (e.g., Red / L)");
      return;
    }
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      toast.error("Variant price must be greater than zero");
      return;
    }
    const payload = {
      title,
      ...(variantDraft.sku.trim() ? { sku: variantDraft.sku.trim() } : {}),
      price: priceNum,
      stock: Number.isFinite(stockNum) && stockNum >= 0 ? Math.trunc(stockNum) : 0,
      attributes: variantDraft.attrValue.trim()
        ? [{ name: variantDraft.attrName.trim() || "Option", value: variantDraft.attrValue.trim() }]
        : [],
    };

    if (isEdit && initialProduct?._id) {
      try {
        setVariantBusy(true);
        const res = await productService.createProductVariant(initialProduct._id, payload);
        const created = res?.data || res;
        setVariants((prev) => [...prev, created]);
        toast.success("Variant added");
      } catch (err) {
        toast.error(err?.response?.data?.message || err?.message || "Failed to add variant");
        return;
      } finally {
        setVariantBusy(false);
      }
    } else {
      setVariants((prev) => [...prev, { ...payload, _localId: Date.now() }]);
    }

    setVariantDraft({
      title: "",
      sku: "",
      price: "",
      stock: "",
      attrName: "Size",
      attrValue: "",
    });
  };

  const handleRemoveVariant = async (variant, index) => {
    if (isEdit && variant?._id) {
      try {
        setVariantBusy(true);
        await productService.deleteProductVariant(variant._id);
        setVariants((prev) => prev.filter((v) => v._id !== variant._id));
        toast.success("Variant removed");
      } catch (err) {
        toast.error(err?.response?.data?.message || err?.message || "Failed to delete variant");
      } finally {
        setVariantBusy(false);
      }
      return;
    }
    setVariants((prev) => prev.filter((_, idx) => idx !== index));
  };

  const validateBeforeSubmit = () => {
    if (form.name.trim().length < 3) {
      toast.error("Product name must be at least 3 characters");
      return false;
    }
    if (form.description.trim().length < 10) {
      toast.error("Description must be at least 10 characters");
      return false;
    }
    if (!form.category) {
      toast.error("Please select a category");
      return false;
    }
    const priceNum = Number(form.price);
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      toast.error("Price must be greater than zero");
      return false;
    }
    const stockNum = Number(form.stock);
    if (!Number.isFinite(stockNum) || stockNum < 0) {
      toast.error("Stock cannot be negative");
      return false;
    }
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving || propSaving) return;
    if (!validateBeforeSubmit()) return;

    const tags = form.tagsText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      name: form.name.trim(),
      shortDescription: form.shortDescription.trim(),
      description: form.description.trim(),
      category: form.category,
      ...(form.brand ? { brand: form.brand } : isEdit ? { brand: "" } : {}),
      price: Number(form.price),
      ...(form.compareAtPrice !== "" && form.compareAtPrice !== null
        ? { compareAtPrice: Number(form.compareAtPrice) }
        : {}),
      stock: Math.trunc(Number(form.stock)),
      ...(form.sku.trim() ? { sku: form.sku.trim() } : {}),
      tags,
      status: form.status,
    };

    if (onSubmitOverride) {
      await onSubmitOverride({
        ...payload,
        images: existingImages,
        files: queuedFiles.map((q) => q.file),
        variants,
      });
      return;
    }

    try {
      setSaving(true);
      if (isEdit && initialProduct?._id) {
        await productService.updateProduct(initialProduct._id, payload);
        if (queuedFiles.length > 0) {
          await uploadQueuedImagesForProduct(initialProduct._id);
        }
        toast.success("Product updated successfully");
        navigate("/vendor/products");
      } else {
        const res = await productService.createProduct(payload);
        const created = res?.data || res;
        const createdId = created?._id;
        if (createdId && queuedFiles.length > 0) {
          await uploadQueuedImagesForProduct(createdId);
        }
        if (createdId && variants.length > 0) {
          await Promise.all(
            variants.map((v) =>
              productService
                .createProductVariant(createdId, {
                  title: v.title,
                  ...(v.sku ? { sku: v.sku } : {}),
                  price: v.price,
                  stock: v.stock,
                  attributes: v.attributes || [],
                })
                .catch(() => null),
            ),
          );
        }
        toast.success(
          form.status === "draft"
            ? "Product saved as draft"
            : "Product created and submitted for admin approval",
        );
        navigate("/vendor/products");
      }
    } catch (err) {
      const details = err?.response?.data?.errors?.[0]?.message;
      toast.error(details || err?.response?.data?.message || err?.message || "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const currentStatusBadge =
    STATUS_BADGE[String(initialProduct?.status || "").toLowerCase()] || null;
  const busy = saving || propSaving || uploadingImages;

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Vendor", onClick: () => goTo("dashboard") },
          { label: "My products", onClick: () => goTo("products") },
          { label: isEdit ? initialProduct?.name || "Edit Product" : "Add Product" },
        ]}
      />

      <div className="pagehead mt-4 flex-wrap gap-3">
        <div>
          <div className="eyebrow">Store Catalog</div>
          <h1>{isEdit ? "Edit Product" : "Add Product"}</h1>
          <p className="mt-1 text-xs font-medium text-[var(--muted)]">
            {isEdit
              ? "Update details, pricing, stock, images, and variants."
              : "Create a new product and submit it for catalog approval."}
          </p>
        </div>

        {isEdit && currentStatusBadge && (
          <span className={`status ${currentStatusBadge.cls}`}>
            Current: {currentStatusBadge.label}
          </span>
        )}
      </div>

      {isEdit &&
        String(initialProduct?.status || "").toLowerCase() === "rejected" &&
        initialProduct?.rejectionReason && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-[#f3cbd0] bg-[#fff0f1] p-3.5 text-xs font-bold text-[var(--red)]"
          >
            Rejection reason: {initialProduct.rejectionReason}
          </div>
        )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="panel">
          <h2 className="text-base font-black text-[var(--text)]">Basic Information</h2>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <Input
                label="Product Name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter product name (min 3 characters)"
                required
              />
            </div>

            <div className="md:col-span-2">
              <Input
                label="Short Summary"
                name="shortDescription"
                value={form.shortDescription}
                onChange={handleChange}
                placeholder="One-line highlight shown in search/cards"
              />
            </div>

            <div className="md:col-span-2">
              <Textarea
                label="Description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe features, material, sizing, and care (min 10 characters)"
                rows={5}
                required
              />
            </div>

            <Select
              label="Category"
              name="category"
              value={form.category}
              onChange={handleChange}
              options={categoryOptions}
              placeholder={categoryOptions.length ? "Select category" : "Loading categories..."}
              required
            />

            <Select
              label="Brand (Optional)"
              name="brand"
              value={form.brand}
              onChange={handleChange}
              options={brandOptions}
              placeholder="No brand / Generic"
            />

            <div className="md:col-span-2">
              <Input
                label="Tags (Comma separated)"
                name="tagsText"
                value={form.tagsText}
                onChange={handleChange}
                placeholder="e.g. leather, office, bestseller"
              />
            </div>
          </div>
        </section>

        <section className="panel">
          <h2 className="text-base font-black text-[var(--text)]">Pricing & Inventory</h2>

          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              label="Selling Price (₹)"
              type="number"
              name="price"
              value={form.price}
              onChange={handleChange}
              placeholder="0"
              min="1"
              step="0.01"
              required
            />

            <Input
              label="Compare At MRP (₹)"
              type="number"
              name="compareAtPrice"
              value={form.compareAtPrice}
              onChange={handleChange}
              placeholder="0"
              min="0"
              step="0.01"
            />

            <Input
              label="Stock Quantity"
              type="number"
              name="stock"
              value={form.stock}
              onChange={handleChange}
              placeholder="0"
              min="0"
              required
            />

            <Input
              label="SKU"
              name="sku"
              value={form.sku}
              onChange={handleChange}
              placeholder="SKU-001"
            />
          </div>
        </section>

        <section className="panel">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-black text-[var(--text)]">Product Images</h2>
              <p className="mt-0.5 text-xs text-[var(--muted)]">
                Upload up to 5 images per batch (JPG, PNG, WebP).
              </p>
            </div>
            {isEdit && queuedFiles.length > 0 && (
              <Button
                type="button"
                variant="outline"
                disabled={uploadingImages}
                onClick={handleUploadNow}
                className="outlinebtn"
              >
                {uploadingImages ? "Uploading..." : `Upload ${queuedFiles.length} selected`}
              </Button>
            )}
          </div>

          <div className="mt-4 space-y-4">
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[var(--line)] bg-[var(--soft)]/40 px-4 py-6 text-center transition hover:border-[var(--primary)]">
              <span className="text-sm font-bold text-[var(--primary)]">
                + Choose product images
              </span>
              <span className="mt-1 text-xs text-[var(--muted)]">
                {queuedFiles.length > 0
                  ? `${queuedFiles.length} image(s) queued to upload`
                  : "Click to select image files from your device"}
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFilePick}
                className="hidden"
              />
            </label>

            {(existingImages.length > 0 || queuedFiles.length > 0) && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5">
                {existingImages.map((img, idx) => (
                  <div
                    key={img._id || img.url || idx}
                    className="group relative overflow-hidden rounded-xl border border-[var(--line)] bg-white"
                  >
                    <img
                      src={img.url || img.secure_url || img}
                      alt={`Product ${idx + 1}`}
                      className="aspect-square w-full object-cover"
                    />
                    {img.isDefault && (
                      <span className="absolute left-1.5 top-1.5 rounded bg-[var(--primary)] px-1.5 py-0.5 text-[10px] font-bold text-white">
                        Main
                      </span>
                    )}
                    {isEdit && img._id && (
                      <button
                        type="button"
                        disabled={uploadingImages}
                        onClick={() => handleDeleteExistingImage(img._id)}
                        className="btnsm absolute right-1.5 top-1.5 bg-white/95 text-[var(--red)]"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}

                {queuedFiles.map((item, idx) => (
                  <div
                    key={item.previewUrl}
                    className="relative overflow-hidden rounded-xl border border-dashed border-[var(--primary)] bg-white"
                  >
                    <img
                      src={item.previewUrl}
                      alt={`Queued ${idx + 1}`}
                      className="aspect-square w-full object-cover"
                    />
                    <span className="absolute left-1.5 top-1.5 rounded bg-amber-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      New
                    </span>
                    <button
                      type="button"
                      onClick={() => removeQueuedFile(idx)}
                      className="btnsm absolute right-1.5 top-1.5 bg-white/95 text-[var(--red)]"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="panel">
          <h2 className="text-base font-black text-[var(--text)]">
            Product Variants (Optional)
          </h2>
          <p className="mt-0.5 text-xs text-[var(--muted)]">
            Add size, color, or edition variants with individual pricing and stock.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <Input
              label="Variant Title"
              value={variantDraft.title}
              onChange={(e) =>
                setVariantDraft((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="e.g. Black / L"
            />
            <Input
              label="Attribute"
              value={variantDraft.attrName}
              onChange={(e) =>
                setVariantDraft((prev) => ({ ...prev, attrName: e.target.value }))
              }
              placeholder="Size"
            />
            <Input
              label="Option Value"
              value={variantDraft.attrValue}
              onChange={(e) =>
                setVariantDraft((prev) => ({ ...prev, attrValue: e.target.value }))
              }
              placeholder="L"
            />
            <Input
              label="Price (₹)"
              type="number"
              min="1"
              value={variantDraft.price}
              onChange={(e) =>
                setVariantDraft((prev) => ({ ...prev, price: e.target.value }))
              }
              placeholder={form.price ? String(form.price) : "0"}
            />
            <Input
              label="Stock"
              type="number"
              min="0"
              value={variantDraft.stock}
              onChange={(e) =>
                setVariantDraft((prev) => ({ ...prev, stock: e.target.value }))
              }
              placeholder="0"
            />
            <div className="flex items-end">
              <button
                type="button"
                disabled={variantBusy}
                onClick={handleAddVariant}
                className="outlinebtn w-full cursor-pointer"
              >
                {variantBusy ? "Adding..." : "+ Add variant"}
              </button>
            </div>
          </div>

          {variants.length > 0 && (
            <div className="tablewrap mt-4">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Attribute</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((v, idx) => (
                    <tr key={v._id || v._localId || idx}>
                      <td className="font-bold">{v.title}</td>
                      <td>
                        {Array.isArray(v.attributes) && v.attributes.length > 0
                          ? v.attributes.map((a) => `${a.name}: ${a.value}`).join(", ")
                          : "—"}
                      </td>
                      <td>₹{Number(v.price || 0).toLocaleString("en-IN")}</td>
                      <td>{v.stock ?? 0}</td>
                      <td>
                        <button
                          type="button"
                          disabled={variantBusy}
                          onClick={() => handleRemoveVariant(v, idx)}
                          className="btnsm text-[var(--red)]"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel">
          <h2 className="text-base font-black text-[var(--text)]">Submission Status</h2>
          <div className="mt-4 max-w-sm">
            <Select
              label="Catalog Action"
              name="status"
              value={form.status}
              onChange={handleChange}
              options={
                isEdit
                  ? [
                      { label: "Submit for approval", value: "pending_approval" },
                      { label: "Save as draft", value: "draft" },
                      { label: "Archive product", value: "archived" },
                    ]
                  : [
                      { label: "Submit for approval", value: "pending_approval" },
                      { label: "Save as draft", value: "draft" },
                    ]
              }
            />
            <p className="mt-2 text-xs text-[var(--muted)]">
              Published products go live after admin verification. Editing price, name, or description sends updates back for approval.
            </p>
          </div>
        </section>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => goTo("products")}
            disabled={busy}
            className="outlinebtn"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={busy} className="primarybtn">
            {busy
              ? isEdit
                ? "Saving..."
                : "Creating..."
              : isEdit
                ? "Save Changes"
                : "Create Product"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default VendorProductForm;
