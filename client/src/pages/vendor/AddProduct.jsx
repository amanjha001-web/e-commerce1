import Loader from "../../components/common/Loader";
import VendorProductForm from "../../components/vendor/VendorProductForm";

const AddProduct = ({
  loading = false,
  saving = false,
  categories = [],
  brands = [],
  onCreateProduct,
  onNavigate,
}) => {
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <VendorProductForm
      mode="create"
      categories={categories}
      brands={brands}
      saving={saving}
      onSubmitOverride={onCreateProduct}
      onNavigate={onNavigate}
    />
  );
};

export default AddProduct;
