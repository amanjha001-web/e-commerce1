import { useMemo } from "react";
import AddressCard from "./AddressCard";
import AddAddress from "./AddAddress";

const AddressSelector = ({
  addresses = [],
  selectedAddress,
  selectedAddressId,
  onSelect,
  onAdd,
  onEdit,
  onDelete,
  loading = false,
  saving = false,
}) => {
  const selectedId =
    selectedAddress?._id ||
    selectedAddress?.id ||
    selectedAddressId?._id ||
    selectedAddressId?.id ||
    selectedAddressId;

  const sortedAddresses = useMemo(() => {
    return [...addresses].sort(
      (a, b) => Number(b?.isDefault === true || b?.default === true) - Number(a?.isDefault === true || a?.default === true),
    );
  }, [addresses]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-[var(--line)] bg-white p-6 dark:bg-card">
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-40 rounded bg-[var(--soft)]" />
          <div className="h-24 rounded-xl bg-[var(--soft)]/50" />
          <div className="h-24 rounded-xl bg-[var(--soft)]/50" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-[var(--muted)]">
            Choose Delivery Address ({sortedAddresses.length} saved)
          </h3>
          <p className="mt-0.5 text-xs text-[var(--muted)]">
            Click on any address below to select it for this order.
          </p>
        </div>

        {addresses.length > 0 && onAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="btnsm text-xs shrink-0"
          >
            + Add new address
          </button>
        )}
      </div>

      {/* Addresses list */}
      {sortedAddresses.length > 0 ? (
        <div className="space-y-3">
          {sortedAddresses.map((address, index) => {
            const addressId = address?._id || address?.id || index;

            return (
              <AddressCard
                key={addressId}
                address={address}
                selected={String(addressId) === String(selectedId)}
                onSelect={onSelect}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--soft)] p-8 text-center">
          <div className="text-3xl">🏠</div>
          <h4 className="mt-2 text-sm font-black text-[var(--text)] dark:text-foreground">
            No saved addresses
          </h4>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Add a delivery address to complete your checkout.
          </p>
          {onAdd && (
            <button
              type="button"
              onClick={onAdd}
              className="primarybtn mt-4 !py-2 !px-4 !text-xs"
            >
              + Add Address
            </button>
          )}
        </div>
      )}

      {/* Inline Add Address */}
      {saving && <AddAddress loading={saving} onSubmit={onAdd} />}
    </div>
  );
};

export default AddressSelector;

