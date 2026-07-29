import SectionHeader from "../ui/SectionHeader";

const vendors = [
  {
    id: 1,
    name: "Tech World",
    image: "https://i.pravatar.cc/150?img=11",
    products: 245,
  },
  {
    id: 2,
    name: "Fashion Hub",
    image: "https://i.pravatar.cc/150?img=12",
    products: 180,
  },
  {
    id: 3,
    name: "Home Decor",
    image: "https://i.pravatar.cc/150?img=13",
    products: 320,
  },
  {
    id: 4,
    name: "Sports Zone",
    image: "https://i.pravatar.cc/150?img=14",
    products: 96,
  },
];

const TopVendors = () => {
  return (
    <section className="bg-slate-50 py-20">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          title="Top Vendors"
          subtitle="Trusted sellers with quality products."
          buttonText="View All"
        />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {vendors.map((vendor) => (
            <div
              key={vendor.id}
              className="rounded-2xl bg-white p-6 text-center shadow transition hover:-translate-y-2 hover:shadow-xl"
            >
              <img
                src={vendor.image}
                alt={vendor.name}
                className="mx-auto h-24 w-24 rounded-full object-cover"
              />

              <h3 className="mt-4 text-xl font-semibold">{vendor.name}</h3>

              <p className="mt-2 text-gray-500">{vendor.products} Products</p>

              <button className="mt-5 rounded-lg bg-indigo-600 px-5 py-2 text-white hover:bg-indigo-700">
                Visit Store
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TopVendors;
