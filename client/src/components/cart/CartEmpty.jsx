import { Link } from "react-router-dom";

const CartEmpty = ({
  title = "Your cart is empty",
  message = "Looks like you haven't added anything to your cart yet.",
  buttonText = "Continue Shopping",
  buttonPath = "/products",
}) => {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-12 text-center dark:border-gray-800 dark:bg-gray-900">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 text-4xl dark:bg-gray-800">
        🛒
      </div>

      <h2 className="mt-6 text-xl font-semibold text-gray-900 dark:text-white">
        {title}
      </h2>

      <p className="mt-2 max-w-md text-sm leading-6 text-gray-500 dark:text-gray-400">
        {message}
      </p>

      <Link
        to={buttonPath}
        className="mt-6 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        {buttonText}
      </Link>
    </div>
  );
};

export default CartEmpty;
