import { FiHeart, FiShoppingCart, FiUser } from "react-icons/fi";
import { useSelector } from "react-redux";

const NavActions = () => {
  const cartItems = useSelector((state) => state.cart.cartItems);

  const wishlistItems = useSelector((state) => state.wishlist.wishlistItems);

  return (
    <div className="flex items-center gap-4">
      <button className="relative rounded-full p-2 hover:bg-gray-100">
        <FiHeart size={22} />
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
          {wishlistItems.length}
        </span>
      </button>

      <button className="relative rounded-full p-2 hover:bg-gray-100">
        <FiShoppingCart size={22} />
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-xs text-white">
          {cartItems.length}
        </span>
      </button>

      <button className="rounded-full p-2 hover:bg-gray-100">
        <FiUser size={22} />
      </button>
    </div>
  );
};

export default NavActions;

