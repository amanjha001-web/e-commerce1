const AddressCard = ({
  address,
  selected = false,
  onSelect,
  onEdit,
  onDelete,
}) => {
  if (!address) {
    return null;
  }

  const addressId = address?._id || address?.id;

  const name = address?.fullName || address?.name || "Customer";

  const phone = address?.phone || address?.mobile || "";

  const addressLine1 = address?.addressLine1 || address?.address || "";

  const addressLine2 = address?.addressLine2 || "";

  const city = address?.city || "";

  const state = address?.state || "";

  const pincode = address?.pincode || address?.postalCode || "";

  const landmark = address?.landmark || "";

  const type = address?.addressType || "home";

  const isDefault = address?.isDefault === true;

  const typeLabel = {
    home: "Home",
    work: "Work",
    office: "Work",
    other: "Other",
  };

  return (
    <div
      className={`relative rounded-xl border p-4 transition ${
        selected
          ? "border-blue-600 bg-blue-50/50 shadow-sm dark:border-blue-500 dark:bg-blue-900/10"
          : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700"
      }`}
    >
      {/* Selection */}
      {onSelect && (
        <button
          type="button"
          onClick={() => onSelect(address)}
          className="absolute left-4 top-4 flex items-center gap-2"
          aria-label={`Select ${typeLabel[type] || "address"} address`}
        >
          <span
            className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
              selected
                ? "border-blue-600 bg-blue-600 dark:border-blue-500 dark:bg-blue-500"
                : "border-gray-300 dark:border-gray-600"
            }`}
          >
            {selected && <span className="h-2 w-2 rounded-full bg-white" />}
          </span>
        </button>
      )}

      {/* Header */}
      <div
        className={`flex items-start justify-between gap-3 ${
          onSelect ? "pl-8" : ""
        }`}
      >
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              {name}
            </h3>

            <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-gray-600 dark:bg-gray-800 dark:text-gray-400">
              {typeLabel[type] || type}
            </span>

            {isDefault && (
              <span className="rounded-md bg-green-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-green-700 dark:bg-green-900/30 dark:text-green-400">
                Default
              </span>
            )}
          </div>

          {phone && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {phone}
            </p>
          )}
        </div>

        {/* Actions */}
        {(onEdit || onDelete) && (
          <div className="flex shrink-0 items-center gap-1">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(address)}
                className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
              >
                Edit
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(addressId, address)}
                className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>

      {/* Address */}
      <div className="mt-3 pl-8">
        <p className="text-sm leading-6 text-gray-600 dark:text-gray-300">
          {addressLine1}

          {addressLine2 && (
            <>
              <br />
              {addressLine2}
            </>
          )}

          {landmark && (
            <>
              <br />
              <span className="text-gray-500 dark:text-gray-400">
                Near {landmark}
              </span>
            </>
          )}

          {(city || state || pincode) && (
            <>
              <br />
              {city}
              {city && state ? ", " : ""}
              {state}
              {pincode ? ` - ${pincode}` : ""}
            </>
          )}
        </p>
      </div>

      {/* Selected indicator */}
      {selected && (
        <div className="mt-3 flex items-center gap-1.5 pl-8 text-xs font-semibold text-blue-600 dark:text-blue-400">
          <span>✓</span>
          <span>Selected for delivery</span>
        </div>
      )}
    </div>
  );
};

export default AddressCard;
