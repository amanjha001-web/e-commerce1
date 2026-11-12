import { useState } from "react";

import AddressCard from "../../components/checkout/AddressCard";
import AddAddress from "../../components/checkout/AddAddress";
import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/common/Loader";
import CustomerWorkspace from "../../components/layout/CustomerWorkspace";

const Addresses = ({
  addresses = [],
  loading = false,
  saving = false,
  defaultAddressId = null,
  onAddAddress,
  onEditAddress,
  onDeleteAddress,
  onSetDefaultAddress,
  onNavigate,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  const getAddressId = (address) => address?._id || address?.id;

  const isDefaultAddress = (address) => {
    const id = getAddressId(address);

    return (
      address?.isDefault === true ||
      address?.default === true ||
      (defaultAddressId && id === defaultAddressId)
    );
  };

  const handleAdd = () => {
    setEditingAddress(null);
    setShowForm(true);
  };

  const handleEdit = (address) => {
    setEditingAddress(address);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingAddress(null);
  };

  const handleSubmit = async (data) => {
    if (editingAddress) {
      await onEditAddress?.(getAddressId(editingAddress), data);
    } else {
      await onAddAddress?.(data);
    }

    setShowForm(false);
    setEditingAddress(null);
  };

  return (
    <CustomerWorkspace
      title="Saved Addresses"
      eyebrow="Customer workspace"
      action={
        <button
          type="button"
          onClick={handleAdd}
          className="primarybtn !py-2 !px-3.5 !text-xs !rounded-xl"
        >
          + Add new address
        </button>
      }
    >
      {/* Address Form Container */}
      {showForm && (
        <div className="mb-8 rounded-2xl border border-[var(--line)] bg-white p-6 shadow-md dark:bg-card dark:border-line">
          <div className="mb-5 flex items-center justify-between border-b border-[var(--line)] pb-4">
            <div>
              <h2 className="text-base font-bold text-[var(--text)] dark:text-foreground">
                {editingAddress ? "Edit delivery address" : "Add new delivery address"}
              </h2>
              <p className="mt-0.5 text-xs text-[var(--muted)]">
                Enter your complete address details.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCloseForm}
              className="btnsm"
            >
              Cancel
            </button>
          </div>

          <AddAddress
            address={editingAddress}
            loading={saving}
            onSubmit={handleSubmit}
            onCancel={handleCloseForm}
          />
        </div>
      )}

      {/* Address Cards Grid */}
      {loading ? (
        <div className="flex min-h-[250px] items-center justify-center rounded-2xl border border-[var(--line)] bg-white">
          <Loader />
        </div>
      ) : addresses.length === 0 ? (
        <div className="rounded-2xl border border-[var(--line)] bg-white p-10 text-center">
          <EmptyState
            title="No saved addresses"
            message="Add your home, office, or shipping address for faster checkout."
            action={handleAdd}
            actionText="+ Add Address"
          />
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {addresses.map((address) => {
            const id = getAddressId(address);
            const isDefault = isDefaultAddress(address);

            return (
              <div
                key={id || Math.random()}
                className={`flex flex-col justify-between rounded-2xl border p-6 transition-all duration-200 shadow-xs ${
                  isDefault
                    ? "border-[var(--primary)] bg-[var(--soft)]/30 ring-1 ring-[var(--primary)]/30"
                    : "border-[var(--line)] bg-white dark:bg-card hover:border-[var(--primary)]/50"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="pill text-[10px]">
                      {isDefault ? "DEFAULT · " : ""}
                      {address?.type?.toUpperCase() || "HOME"}
                    </span>
                    {!isDefault && onSetDefaultAddress && (
                      <button
                        type="button"
                        onClick={() => onSetDefaultAddress(id)}
                        className="text-xs font-semibold text-[var(--primary)] hover:underline"
                      >
                        Set as default
                      </button>
                    )}
                  </div>

                  <h3 className="mt-3 text-sm font-black text-[var(--text)] dark:text-foreground">
                    {address?.name || address?.fullName || "Recipient"}
                  </h3>

                  <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
                    {address?.street || address?.addressLine1 || address?.address}
                    {address?.addressLine2 ? `, ${address.addressLine2}` : ""}
                    <br />
                    {address?.city}, {address?.state} — {address?.postalCode || address?.pinCode || address?.zipCode}
                    <br />
                    {address?.country || "India"} · Phone: {address?.phone || address?.mobileNumber || "N/A"}
                  </p>
                </div>

                <div className="mt-5 flex items-center gap-2 border-t border-[var(--line)] pt-4">
                  <button
                    type="button"
                    onClick={() => handleEdit(address)}
                    className="btnsm"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteAddress?.(id)}
                    className="btnsm text-[var(--red)] hover:bg-[#fff0f1]"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </CustomerWorkspace>
  );
};

export default Addresses;
