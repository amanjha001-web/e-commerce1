import { FiSearch } from "react-icons/fi";

const HeroSearch = () => {
  return (
    <div className="mt-8 flex overflow-hidden rounded-2xl border bg-white shadow-lg">
      <input
        type="text"
        placeholder="Search products..."
        className="flex-1 px-6 py-5 outline-none"
      />

      <button className="bg-indigo-600 px-8 text-white">
        <FiSearch size={22} />
      </button>
    </div>
  );
};

export default HeroSearch;
