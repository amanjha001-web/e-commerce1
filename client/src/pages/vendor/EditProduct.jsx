import { useState } from "react";

import VendorHeader from "../../components/vendor/VendorHeader";
import VendorSidebar from "../../components/vendor/VendorSidebar";

import ProductGallery from "../../components/product/ProductGallery";
import ProductImages from "../../components/product/ProductImages";
import ProductVariants from "../../components/product/ProductVariants";

import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import Textarea from "../../components/common/Textarea";
import Breadcrumb from "../../components/common/Breadcrumb";
import Loader from "../../components/common/Loader";

const EditProduct = ({
  user = null,
  product = null,
  categories = [],
  brands = [],
  loading = false,
  saving = false,
  notificationCount = 0,

  onUpdateProduct,
  onNavigate,
  onLogout,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [form, setForm] = useState(() => ({
    name: product?.name || "",
    description: product?.description || "",
    category: product?.category?._id || product?.category || "",
    brand: product?.brand?._id || product?.brand || "",
    price: product?.price ?? "",
    compareAtPrice: product?.compareAtPrice ?? "",
    stock: product?.stock ?? product?.quantity ?? "",
    sku: product?.sku || "",
    status: product?.status || "active",
  }));

  const [images, setImages] = useState(() => product?.images || []);
  const [variants, setVariants] = useState(() => product?.variants || []);

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

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!product || !onUpdateProduct || saving) return;

    await onUpdateProduct(product, {
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
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
        <Loader />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[var(--bg)]">
        <VendorSidebar
          activeItem="products"
          collapsed={false}
          onNavigate={handleNavigate}
          onLogout={onLogout}
          mobileOpen={sidebarOpen}
          onMobileClose={() => setSidebarOpen(false)}
        />

        <div className="lg:pl-64">
          <VendorHeader
            title="Edit Product"
            subtitle="Update your product information"
            user={user}
            notificationCount={notificationCount}
            onMenuClick={() => setSidebarOpen(true)}
            onLogout={onLogout}
            onProfileClick={() => handleNavigate("profile")}
            onNotificationsClick={() => handleNavigate("notifications")}
          />

          <main className="p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">
              <div className="panel p-8 text-center">
                <h1 className="text-xl font-black text-[var(--text)] dark:text-foreground">
                  Product not found
                </h1>

                <p className="mt-2 text-xs font-medium text-[var(--muted)]">
                  The product you are trying to edit could not be found.
                </p>

                <div className="mt-6">
                  <Button onClick={() => handleNavigate("products")} className="primarybtn">
                    Back to Products
                  </Button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <VendorSidebar
        activeItem="products"
        collapsed={false}
        onNavigate={handleNavigate}
        onLogout={onLogout}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      <div className="lg:pl-64">
        <VendorHeader
          title="Edit Product"
          subtitle="Update your product information"
          user={user}
          notificationCount={notificationCount}
          onMenuClick={() => setSidebarOpen(true)}
          onLogout={onLogout}
          onProfileClick={() => handleNavigate("profile")}
          onNotificationsClick={() => handleNavigate("notifications")}
        />

        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Breadcrumb
              items={[
                {
                  label: "Vendor",
                  onClick: () => handleNavigate("dashboard"),
                },
                {
                  label: "Products",
                  onClick: () => handleNavigate("products"),
                },
                {
                  label: product?.name || "Edit Product",
                },
              ]}
            />

            <div className="mb-8 mt-6">
              <div className="eyebrow">Store Catalog</div>
              <h1 className="text-2xl font-black text-[var(--text)] dark:text-foreground">
                Edit Product
              </h1>

              <p className="mt-1 text-xs font-medium text-[var(--muted)]">
                Update details, pricing, inventory and images.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <section className="panel">
                <h2 className="text-base font-black text-[var(--text)] dark:text-foreground">
                  Basic Information
                </h2>

                <div className="mt-5 grid gap-5 md:grid-cols-2">
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

                  <Select
                    label="Category"
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    options={categories}
                    placeholder="Select category"
                    required
                  />

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
              <section className="panel">
                <h2 className="text-base font-black text-[var(--text)] dark:text-foreground">
                  Pricing & Inventory
                </h2>

                <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  <Input
                    label="Price"
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    min="0"
                    required
                  />

                  <Input
                    label="Compare At Price"
                    type="number"
                    name="compareAtPrice"
                    value={form.compareAtPrice}
                    onChange={handleChange}
                    min="0"
                  />

                  <Input
                    label="Stock"
                    type="number"
                    name="stock"
                    value={form.stock}
                    onChange={handleChange}
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

              {/* Images */}
              <section className="panel">
                <h2 className="text-base font-black text-[var(--text)] dark:text-foreground">
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

              {/* Variants */}
              <section className="panel">
                <h2 className="text-base font-black text-[var(--text)] dark:text-foreground">
                  Product Variants
                </h2>

                <div className="mt-5">
                  <ProductVariants variants={variants} onChange={setVariants} />
                </div>
              </section>

              {/* Status */}
              <section className="panel">
                <h2 className="text-base font-black text-[var(--text)] dark:text-foreground">
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
                  disabled={saving}
                  onClick={() => handleNavigate("products")}
                  className="outlinebtn"
                >
                  Cancel
                </Button>

                <Button type="submit" disabled={saving} className="primarybtn">
                  {saving ? "Saving..." : "Update Product"}
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default EditProduct;
