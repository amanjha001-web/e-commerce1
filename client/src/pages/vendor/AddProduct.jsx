import { useState } from "react";

import ProductGallery from "../../components/product/ProductGallery";
import ProductImages from "../../components/product/ProductImages";
import ProductVariants from "../../components/product/ProductVariants";

import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import Textarea from "../../components/common/Textarea";
import Breadcrumb from "../../components/common/Breadcrumb";
import Loader from "../../components/common/Loader";

const AddProduct = ({
  loading = false,
  saving = false,
  categories = [],
  brands = [],
  onCreateProduct,
  onNavigate,
}) => {
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    brand: "",
    price: "",
    compareAtPrice: "",
    stock: "",
    sku: "",
    status: "active",
  });

  const [images, setImages] = useState([]);
  const [variants, setVariants] = useState([]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!onCreateProduct || saving) {
      return;
    }

    await onCreateProduct({
      ...form,
      price: Number(form.price),
      compareAtPrice: form.compareAtPrice
        ? Number(form.compareAtPrice)
        : undefined,
      stock: Number(form.stock),
      images,
      variants,
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            {
              label: "Vendor",
              onClick: () => onNavigate?.("/vendor/dashboard"),
            },
            {
              label: "Products",
              onClick: () => onNavigate?.("/vendor/products"),
            },
            {
              label: "Add Product",
            },
          ]}
        />

        {/* Page Header */}
        <div className="mb-8 mt-6">
          <h1 className="text-2xl font-bold text-foreground">Add Product</h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Add a new product to your store.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">
              Basic Information
            </h2>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              {/* Product Name */}
              <div className="md:col-span-2">
                <Input
                  label="Product Name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter product name"
                  required
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <Textarea
                  label="Description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Enter product description"
                  rows={6}
                  required
                />
              </div>

              {/* Category */}
              <Select
                label="Category"
                name="category"
                value={form.category}
                onChange={handleChange}
                options={categories}
                placeholder="Select category"
                required
              />

              {/* Brand */}
              <Select
                label="Brand"
                name="brand"
                value={form.brand}
                onChange={handleChange}
                options={brands}
                placeholder="Select brand"
              />
            </div>
          </section>

          {/* Pricing & Inventory */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">
              Pricing & Inventory
            </h2>

            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {/* Price */}
              <Input
                label="Price"
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                placeholder="0"
                min="0"
                required
              />

              {/* Compare At Price */}
              <Input
                label="Compare At Price"
                type="number"
                name="compareAtPrice"
                value={form.compareAtPrice}
                onChange={handleChange}
                placeholder="0"
                min="0"
              />

              {/* Stock */}
              <Input
                label="Stock"
                type="number"
                name="stock"
                value={form.stock}
                onChange={handleChange}
                placeholder="0"
                min="0"
                required
              />

              {/* SKU */}
              <Input
                label="SKU"
                name="sku"
                value={form.sku}
                onChange={handleChange}
                placeholder="SKU-001"
              />
            </div>
          </section>

          {/* Product Images */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">
              Product Images
            </h2>

            <div className="mt-5">
              <ProductImages images={images} onChange={setImages} />
            </div>

            {images.length > 0 && (
              <div className="mt-6">
                <ProductGallery images={images} />
              </div>
            )}
          </section>

          {/* Product Variants */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">
              Product Variants
            </h2>

            <div className="mt-5">
              <ProductVariants variants={variants} onChange={setVariants} />
            </div>
          </section>

          {/* Product Status */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">
              Product Status
            </h2>

            <div className="mt-5 max-w-sm">
              <Select
                label="Status"
                name="status"
                value={form.status}
                onChange={handleChange}
                options={[
                  {
                    label: "Active",
                    value: "active",
                  },
                  {
                    label: "Draft",
                    value: "draft",
                  },
                  {
                    label: "Inactive",
                    value: "inactive",
                  },
                ]}
              />
            </div>
          </section>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onNavigate?.("/vendor/products")}
              disabled={saving}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={saving}>
              {saving ? "Creating..." : "Create Product"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;
