const WishlistEmpty = ({
  title = "Your Wishlist is Empty",
  message = "Save products you love and find them here later.",
  buttonText = "Continue Shopping",
  onContinueShopping,
}) => {
  return (
    <div className="panel flex min-h-[360px] flex-col items-center justify-center px-5 py-12 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--soft)] text-4xl text-[var(--primary)]">
        ♡
      </div>

      <h2 className="mt-5 text-xl font-black text-[var(--text)]">
        {title}
      </h2>

      <p className="mt-2 max-w-md text-xs font-medium leading-6 text-[var(--muted)]">
        {message}
      </p>

      {onContinueShopping && (
        <button
          type="button"
          onClick={onContinueShopping}
          className="primarybtn mt-6"
        >
          {buttonText}
        </button>
      )}
    </div>
  );
};

export default WishlistEmpty;
