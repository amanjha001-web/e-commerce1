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
  const phone = address?.phone || address?.mobile || address?.mobileNumber || "";
  const addressLine1 = address?.street || address?.addressLine1 || address?.address || "";
  const addressLine2 = address?.apartment || address?.addressLine2 || "";
  const city = address?.city || "";
  const state = address?.state || "";
  const pincode = address?.postalCode || address?.pincode || address?.zipCode || "";
  const landmark = address?.landmark || "";
  const type = address?.addressType || address?.type || "home";
  const isDefault = address?.isDefault === true || address?.default === true;

  const typeLabel = {
    home: "Home",
    work: "Work",
    office: "Work",
    other: "Other",
  };

  return (
    <div
      onClick={() => onSelect?.(address)}
      className={`relative rounded-2xl border p-4 sm:p-5 transition-all duration-200 shadow-xs ${
        onSelect ? "cursor-pointer" : ""
      } ${
        selected
          ? "border-[var(--primary)] bg-[var(--soft)]/40 ring-2 ring-[var(--primary)]/30 dark:bg-card"
          : "border-[var(--line)] bg-white hover:border-[var(--primary)]/50 dark:bg-card dark:border-line"
      }`}
    >
      {/* Selection radio button */}
      {onSelect && (
        <div className="absolute left-4 top-4 flex items-center gap-2">
          <span
            className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition ${
              selected
                ? "border-[var(--primary)] bg-[var(--primary)]"
                : "border-[var(--line)] bg-white"
            }`}
          >
            {selected && <span className="h-2 w-2 rounded-full bg-white" />}
          </span>
        </div>
      )}

      {/* Header */}
      <div
        className={`flex items-start justify-between gap-3 ${
          onSelect ? "pl-7" : ""
        }`}
      >
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-black text-[var(--text)] dark:text-foreground">
              {name}
            </h3>

            <span className="pill text-[10px] uppercase tracking-wider">
              {typeLabel[type] || type}
            </span>

            {isDefault && (
              <span className="rounded-full bg-[#ecfdf5] px-2 py-0.5 text-[10px] font-bold text-[#059669] border border-[#a7f3d0]">
                Default
              </span>
            )}
          </div>

          {phone && (
            <p className="mt-1 text-xs text-[var(--muted)]">
              📞 {phone}
            </p>
          )}
        </div>

        {/* Actions */}
        {(onEdit || onDelete) && (
          <div className="flex shrink-0 items-center gap-1.5">
            {onEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(address);
                }}
                className="btnsm text-xs"
              >
                Edit
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(addressId, address);
                }}
                className="btnsm text-xs text-[#dc2626] hover:bg-[#fee2e2]"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>

      {/* Address Text */}
      <div className={`mt-2.5 ${onSelect ? "pl-7" : ""}`}>
        <p className="text-xs leading-relaxed text-[var(--muted)]">
          {addressLine1}
          {addressLine2 && <>, {addressLine2}</>}
          {landmark && <> (Near {landmark})</>}
          {(city || state || pincode) && (
            <>
              <br />
              {city}
              {city && state ? ", " : ""}
              {state}
              {pincode ? ` — ${pincode}` : ""}
            </>
          )}
        </p>
      </div>

      {/* Selected Indicator Badge */}
      {selected && (
        <div className={`mt-3 flex items-center gap-1.5 ${onSelect ? "pl-7" : ""}`}>
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--soft)] px-2.5 py-0.5 text-[11px] font-bold text-[var(--primary)] border border-[var(--primary)]/20">
            ✓ Deliver to this address
          </span>
        </div>
      )}
    </div>
  );
};

export default AddressCard;
