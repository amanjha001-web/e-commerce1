import ProductCard from "../product/ProductCard";
import SectionHeader from "../ui/SectionHeader";
import { products } from "../../data/products";

const FeaturedProducts = () => {
  return (
    <section className="bg-slate-50 py-20">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          title="Featured Products"
          subtitle="Handpicked products from top vendors."
          buttonText="View All"
        />

        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
