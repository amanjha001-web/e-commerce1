import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import productService from "../../services/product.service";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import VendorProductForm from "../../components/vendor/VendorProductForm";

const EditProduct = ({
  product: propProduct = null,
  categories = [],
  brands = [],
  loading: propLoading = false,
  saving = false,
  onUpdateProduct,
  onNavigate,
}) => {
  const { productId } = useParams();
  const navigate = useNavigate();

  const [fetchedProduct, setFetchedProduct] = useState(null);
  const [fetching, setFetching] = useState(!propProduct && Boolean(productId));
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    if (propProduct || !productId) return undefined;
    let cancelled = false;

    const timer = setTimeout(() => {
      setFetching(true);
      setFetchError("");
      productService
        .getVendorProductById(productId)
        .then((res) => {
          if (cancelled) return;
          const doc = res?.data?.product || res?.data || res;
          setFetchedProduct(doc || null);
        })
        .catch((err) => {
          if (cancelled) return;
          setFetchError(
            err?.response?.data?.message || err?.message || "Product not found",
          );
          setFetchedProduct(null);
        })
        .finally(() => {
          if (!cancelled) setFetching(false);
        });
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [propProduct, productId]);

  const resolvedProduct = propProduct || fetchedProduct;
  const isLoading = propLoading || fetching;

  const handleBack = () => {
    if (onNavigate) {
      onNavigate("products");
      return;
    }
    navigate("/vendor/products");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!resolvedProduct) {
    return (
      <div className="panel p-8 text-center">
        <h1 className="text-xl font-black text-[var(--text)]">
          Product not found
        </h1>
        <p className="mt-2 text-xs font-medium text-[var(--muted)]">
          {fetchError || "The product you are trying to edit could not be found."}
        </p>
        <div className="mt-6">
          <Button onClick={handleBack} className="primarybtn">
            Back to My products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <VendorProductForm
      key={resolvedProduct._id || productId}
      mode="edit"
      initialProduct={resolvedProduct}
      categories={categories}
      brands={brands}
      saving={saving}
      onSubmitOverride={
        onUpdateProduct
          ? (payload) => onUpdateProduct(resolvedProduct, payload)
          : undefined
      }
      onNavigate={onNavigate}
      onProductUpdated={(updated) => {
        if (updated && !propProduct) setFetchedProduct(updated);
      }}
    />
  );
};

export default EditProduct;
