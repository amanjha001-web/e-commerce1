import { FiSearch } from "react-icons/fi";

const SearchBar = () => {
  return (
    <div className="hidden w-80 items-center rounded-xl border bg-white px-4 py-2 lg:flex">
      <FiSearch className="text-gray-400" />

      <input
        type="text"
        placeholder="Search products..."
        className="ml-3 w-full outline-none"
      />
    </div>
  );
};

export default SearchBar;
