import ProductGrid from "../../components/product/ProductGrid";

import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";

const Home = ({
  user = null,
  banners = [],
  categories = [],
  featuredProducts = [],
  latestProducts = [],
  loading = false,
  productsLoading = false,
  onCategoryClick,
  onProductClick,
  onAddToCart,
  onToggleWishlist,
  onShopNow,
  onNavigate,
}) => {
  const products =
    featuredProducts.length > 0 ? featuredProducts : latestProducts;

  const activeBanner = banners?.[0] || null;

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        {loading ? (
          <div className="flex min-h-[420px] items-center justify-center">
            <Loader />
          </div>
        ) : activeBanner ? (
          <div className="relative min-h-[420px] sm:min-h-[500px]">
            {/* Banner Image */}
            {activeBanner.image && (
              <img
                src={activeBanner.image}
                alt={activeBanner.title || "ShopSphere"}
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/50" />

            {/* Banner Content */}
            <div className="relative mx-auto flex min-h-[420px] max-w-7xl items-center px-4 py-16 sm:min-h-[500px] sm:px-6 lg:px-8">
              <div className="max-w-2xl text-white">
                {activeBanner.subtitle && (
                  <p className="mb-3 text-sm font-semibold uppercase tracking-wider">
                    {activeBanner.subtitle}
                  </p>
                )}

                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                  {activeBanner.title ||
                    "Everything You Need, All in One Place"}
                </h1>

                {activeBanner.description && (
                  <p className="mt-5 max-w-xl text-base text-white/80 sm:text-lg">
                    {activeBanner.description}
                  </p>
                )}

                <div className="mt-8">
                  <Button onClick={onShopNow}>
                    {activeBanner.buttonText || "Shop Now"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex min-h-[420px] max-w-7xl items-center px-4 py-16 sm:min-h-[500px] sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
                Welcome to ShopSphere
              </p>

              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Shop smarter.
                <br />
                Live better.
              </h1>

              <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
                Discover quality products from trusted sellers, all in one
                marketplace.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button onClick={onShopNow}>Shop Now</Button>

                <Button
                  variant="outline"
                  onClick={() => onNavigate?.("/categories")}
                >
                  Explore Categories
                </Button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-primary">Explore</p>

              <h2 className="mt-1 text-2xl font-bold">Shop by Category</h2>
            </div>

            <button
              type="button"
              onClick={() => onNavigate?.("/categories")}
              className="text-sm font-semibold text-primary hover:underline"
            >
              View All
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {categories.slice(0, 6).map((category) => {
              const id = category?._id || category?.id;

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onCategoryClick?.(category)}
                  className="group overflow-hidden rounded-2xl border border-border bg-card text-left shadow-sm transition hover:-translate-y-1 hover:border-primary/40"
                >
                  <div className="aspect-square overflow-hidden bg-muted">
                    {category?.image ? (
                      <img
                        src={category.image}
                        alt={category.name || "Category"}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-primary">
                        {category?.name?.charAt(0)?.toUpperCase() || "C"}
                      </div>
                    )}
                  </div>

                  <div className="p-3">
                    <p className="truncate text-sm font-semibold">
                      {category?.name || "Category"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Featured / Latest Products */}
      <section className="bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-primary">Just for You</p>

              <h2 className="mt-1 text-2xl font-bold">
                {featuredProducts.length > 0
                  ? "Featured Products"
                  : "Latest Products"}
              </h2>
            </div>

            <button
              type="button"
              onClick={() => onNavigate?.("/products")}
              className="text-sm font-semibold text-primary hover:underline"
            >
              View All
            </button>
          </div>

          {productsLoading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <Loader />
            </div>
          ) : products.length > 0 ? (
            <ProductGrid
              products={products.slice(0, 8)}
              onProductClick={onProductClick}
              onAddToCart={onAddToCart}
              onToggleWishlist={onToggleWishlist}
            />
          ) : (
            <div className="rounded-2xl border border-border bg-card p-10 text-center">
              <p className="text-sm text-muted-foreground">
                No products available right now.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl bg-primary px-6 py-12 text-center text-primary-foreground shadow-xl sm:px-10 lg:px-16">
          <p className="text-sm font-semibold uppercase tracking-wider opacity-80">
            {user?.fullName
              ? `Welcome back, ${user.fullName}`
              : "ShopSphere Marketplace"}
          </p>

          <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
            Find something you'll love today.
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-sm opacity-80 sm:text-base">
            Explore thousands of products from trusted vendors and enjoy a
            simple shopping experience.
          </p>

          <div className="mt-7">
            <Button variant="secondary" onClick={onShopNow}>
              Start Shopping
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
