const WishlistEmpty = ({
  title = "Your Wishlist is Empty",
  message = "Save products you love and find them here later.",
  buttonText = "Continue Shopping",
  onContinueShopping,
}) => {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-12 text-center dark:border-gray-800 dark:bg-gray-900">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-4xl dark:bg-red-900/20">
        ❤️
      </div>

      <h2 className="mt-5 text-xl font-bold text-gray-900 dark:text-white">
        {title}
      </h2>

      <p className="mt-2 max-w-md text-sm leading-6 text-gray-500 dark:text-gray-400">
        {message}
      </p>

      {onContinueShopping && (
        <button
          type="button"
          onClick={onContinueShopping}
          className="mt-6 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        >
          {buttonText}
        </button>
      )}
    </div>
  );
};

export default WishlistEmpty;
