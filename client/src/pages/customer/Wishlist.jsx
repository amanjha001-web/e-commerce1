import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import WishlistGrid from "../../components/wishlist/WishlistGrid";
import WishlistEmpty from "../../components/wishlist/WishlistEmpty";
import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/common/Loader";
import CustomerWorkspace from "../../components/layout/CustomerWorkspace";

import {
  fetchWishlist,
  removeWishlistProduct,
  clearWishlistProducts,
} from "../../store/slices/wishlistThunk.js";
import { addCartProduct } from "../../store/slices/cartThunk.js";

const Wishlist = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");

  const {
    items: wishlist,
    loading,
    actionLoading,
  } = useSelector((state) => state.wishlist);

  useEffect(() => {
    dispatch(fetchWishlist());
  }, [dispatch]);

  const filteredWishlist = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return wishlist;
    }

    return wishlist.filter((item) => {
      const product = item?.product || item;
      const name = product?.name || product?.title || "";
      const brand = product?.brand?.name || product?.brand || "";
      const category = product?.category?.name || product?.category || "";

      return (
        String(name).toLowerCase().includes(keyword) ||
        String(brand).toLowerCase().includes(keyword) ||
        String(category).toLowerCase().includes(keyword)
      );
    });
  }, [wishlist, search]);

  const handleRemove = (item) => {
    const product = item?.product || item;
    const productId = product?._id || product?.id || item?.productId;
    if (!productId) return;
    dispatch(removeWishlistProduct(productId));
  };

  const handleClearWishlist = () => {
    if (!wishlist.length || actionLoading) return;
    if (window.confirm("Are you sure you want to clear your entire wishlist?")) {
      dispatch(clearWishlistProducts());
    }
  };

  const handleProductClick = (product) => {
    const productId = product?._id || product?.id || product?.slug;
    if (productId) {
      navigate(`/products/${productId}`);
    }
  };

  const handleAddToCart = async (product) => {
    const productId = product?._id || product?.id;
    if (!productId) return;
    await dispatch(addCartProduct(productId, 1));
  };

  return (
    <CustomerWorkspace
      title="My Wishlist"
      eyebrow="Saved for later"
      action={
        <div className="flex gap-2">
          {wishlist.length > 0 && (
            <button
              type="button"
              onClick={handleClearWishlist}
              disabled={actionLoading}
              className="dangerbtn text-xs !py-1.5 !px-3"
            >
              Clear wishlist
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate("/products")}
            className="outlinebtn !py-1.5 !px-3 !text-xs"
          >
            Explore products
          </button>
        </div>
      }
    >
      {/* Search toolbar */}
      {wishlist.length > 0 && (
        <div className="mb-6 rounded-2xl border border-[var(--line)] bg-white p-4 shadow-xs dark:bg-card dark:border-line">
          <div className="flex items-center justify-between gap-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search in your saved items..."
              className="w-full sm:max-w-xs rounded-xl border border-[var(--line)] bg-white px-3.5 py-2 text-xs font-medium text-[var(--text)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[#881337]/15 dark:bg-card"
            />
            <span className="pill shrink-0">
              {filteredWishlist.length} saved
            </span>
          </div>
        </div>
      )}

      {/* Grid */}
      <section className="rounded-2xl border border-[var(--line)] bg-white p-6 shadow-xs dark:bg-card dark:border-line">
        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <Loader />
          </div>
        ) : wishlist.length === 0 ? (
          <WishlistEmpty onContinueShopping={() => navigate("/products")} />
        ) : filteredWishlist.length === 0 ? (
          <div className="p-8 text-center">
            <EmptyState
              title="No items found"
              message="No saved items match your search term."
              action={() => setSearch("")}
              actionText="Reset search"
            />
          </div>
        ) : (
          <WishlistGrid
            items={filteredWishlist}
            loading={actionLoading}
            onRemove={handleRemove}
            onAddToCart={handleAddToCart}
            onProductClick={handleProductClick}
          />
        )}
      </section>
    </CustomerWorkspace>
  );
};

export default Wishlist;
