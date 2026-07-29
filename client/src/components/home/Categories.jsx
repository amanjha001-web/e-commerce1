import {
  FaLaptop,
  FaTshirt,
  FaCouch,
  FaMobileAlt,
  FaBook,
  FaBasketballBall,
} from "react-icons/fa";
import { GiLipstick } from "react-icons/gi";
import { MdKitchen } from "react-icons/md";

const categories = [
  { id: 1, name: "Electronics", icon: <FaLaptop size={34} /> },
  { id: 2, name: "Fashion", icon: <FaTshirt size={34} /> },
  { id: 3, name: "Furniture", icon: <FaCouch size={34} /> },
  { id: 4, name: "Mobiles", icon: <FaMobileAlt size={34} /> },
  { id: 5, name: "Beauty", icon: <GiLipstick size={34} /> },
  { id: 6, name: "Books", icon: <FaBook size={34} /> },
  { id: 7, name: "Sports", icon: <FaBasketballBall size={34} /> },
  { id: 8, name: "Kitchen", icon: <MdKitchen size={34} /> },
];

const Categories = () => {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-bold text-gray-900">Shop by Category</h2>

          <p className="mt-3 text-gray-500">
            Explore thousands of products across different categories.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 md:grid-cols-4 lg:grid-cols-8">
          {categories.map((category) => (
            <div
              key={category.id}
              className="cursor-pointer rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm transition duration-300 hover:-translate-y-2 hover:border-indigo-500 hover:shadow-xl"
            >
              <div className="mb-4 flex justify-center text-indigo-600">
                {category.icon}
              </div>

              <h3 className="font-semibold">{category.name}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;
