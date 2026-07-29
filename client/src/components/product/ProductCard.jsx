import { FiHeart, FiShoppingCart, FiEye } from "react-icons/fi";
import { FaStar } from "react-icons/fa";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";

import { addToCart } from "../../redux/features/cartSlice";
import { addWishlist } from "../../redux/features/wishlistSlice";

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();

  return (
    <div className="group overflow-hidden rounded-3xl bg-white shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
      {/* Product Image */}
      <div className="relative overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="h-72 w-full object-cover transition duration-500 group-hover:scale-110"
        />

        {/* Discount */}
        <span className="absolute left-4 top-4 rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white">
          {product.discount}% OFF
        </span>

        {/* Wishlist */}
        <button
          onClick={() => {
            dispatch(addWishlist(product));
            toast.success("Added to Wishlist ❤️");
          }}
        >
          <FiHeart size={18} />
        </button>

        {/* Quick View */}
        <button className="absolute bottom-4 right-4 rounded-full bg-black/80 p-3 text-white opacity-0 transition-all duration-300 group-hover:opacity-100">
          <FiEye size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="space-y-3 p-5">
        <p className="text-sm font-medium text-indigo-600">
          {product.category}
        </p>

        <h3 className="line-clamp-2 text-xl font-semibold">{product.name}</h3>

        <p className="text-sm text-gray-500">Sold by {product.vendor}</p>

        {/* Rating */}
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((item) => (
            <FaStar
              key={item}
              className={`${
                item <= product.rating ? "text-yellow-400" : "text-gray-300"
              }`}
            />
          ))}

          <span className="ml-2 text-sm text-gray-500">
            ({product.reviews})
          </span>
        </div>

        {/* Price */}

        <div className="flex items-center gap-3">
          <span className="text-3xl font-bold text-indigo-600">
            ₹{product.price}
          </span>

          <span className="text-lg text-gray-400 line-through">
            ₹{product.oldPrice}
          </span>
        </div>

        {/* Delivery */}

        <div className="rounded-xl bg-green-50 p-2 text-center text-sm font-semibold text-green-600">
          🚚 Free Delivery
        </div>

        {/* Button */}

        <button
          onClick={() => {
            dispatch(addToCart(product));
            toast.success("Added to Cart 🛒");
          }}
        >
          <FiShoppingCart />
          Add To Cart
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
