import ProductCard from "../product/ProductCard";
import SectionHeader from "../ui/SectionHeader";
import { products } from "../../data/products";

const FlashSale = () => {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          title="⚡ Flash Sale"
          subtitle="Limited time deals. Grab them before they're gone!"
          buttonText="View All"
          onButtonClick={() => console.log("View All Clicked")}
        />

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FlashSale;
