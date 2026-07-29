import { Link } from "react-router-dom";

const HeroButtons = () => {
  return (
    <div className="mt-8 flex flex-wrap gap-4">
      <Link
        to="/shop"
        className="rounded-xl bg-indigo-600 px-8 py-4 font-semibold text-white transition hover:bg-indigo-700"
      >
        Shop Now
      </Link>

      <Link
        to="/shop"
        className="rounded-xl border border-gray-300 px-8 py-4 font-semibold transition hover:bg-gray-100"
      >
        Explore Deals
      </Link>
    </div>
  );
};

export default HeroButtons;
