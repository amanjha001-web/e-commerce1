import { useMemo } from "react";
import AddressCard from "./AddressCard";
import AddAddress from "./AddAddress";

const AddressSelector = ({
  addresses = [],
  selectedAddressId,
  onSelect,
  onAdd,
  onEdit,
  onDelete,
  loading = false,
  saving = false,
}) => {
  const selectedId =
    selectedAddressId?._id || selectedAddressId?.id || selectedAddressId;

  const sortedAddresses = useMemo(() => {
    return [...addresses].sort(
      (a, b) => Number(b?.isDefault === true) - Number(a?.isDefault === true),
    );
  }, [addresses]);

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-40 rounded bg-gray-200 dark:bg-gray-700" />

          <div className="h-24 rounded-lg bg-gray-100 dark:bg-gray-800" />
          <div className="h-24 rounded-lg bg-gray-100 dark:bg-gray-800" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Delivery Address
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Choose where you want your order delivered.
          </p>
        </div>

        {addresses.length > 0 && onAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="shrink-0 rounded-lg border border-blue-600 px-3 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
          >
            + Add Address
          </button>
        )}
      </div>

      {/* Addresses */}
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
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800/50">
          <div className="text-4xl">🏠</div>

          <h3 className="mt-3 text-sm font-bold text-gray-900 dark:text-white">
            No saved addresses
          </h3>

          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Add a delivery address to continue.
          </p>

          {onAdd && (
            <button
              type="button"
              onClick={onAdd}
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
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
