
import { useState } from "react";

import AddressCard from "../../components/checkout/AddressCard";
import AddAddress from "../../components/checkout/AddAddress";

import Button from "../../components/common/Button";
import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/common/Loader";

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

  const getAddressId = (address) =>
    address?._id || address?.id;

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
      await onEditAddress?.(
        getAddressId(editingAddress),
        data
      );
    } else {
      await onAddAddress?.(data);
    }

    setShowForm(false);
    setEditingAddress(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-1 text-sm font-medium text-primary">
              Account
            </p>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              My Addresses
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Manage your saved delivery addresses.
            </p>
          </div>

          <Button onClick={handleAdd}>
            + Add Address
          </Button>
        </div>

        {/* Address Form */}
        {showForm && (
          <div className="mb-8 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <h2 className="text-lg font-semibold">
                {editingAddress
                  ? "Edit Address"
                  : "Add New Address"}
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Enter your complete delivery details.
              </p>
            </div>

            <AddAddress
              address={editingAddress}
              loading={saving}
              onSubmit={handleSubmit}
              onCancel={handleCloseForm}
            />
          </div>
        )}

        {/* Address List */}
        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <Loader />
          </div>
        ) : addresses.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            <EmptyState
              title="No saved addresses"
              description="Add an address to make checkout faster and easier."
            />

            <div className="mt-5 flex justify-center">
              <Button onClick={handleAdd}>
                Add Your First Address
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {addresses.map((address) => {
              const id = getAddressId(address);
              const isDefault = isDefaultAddress(address);

              return (
                <div
                  key={id}
                  className={[
                    "relative rounded-2xl border bg-card p-4 shadow-sm transition",
                    isDefault
                      ? "border-primary ring-1 ring-primary/20"
                      : "border-border",
                  ].join(" ")}
                >
                  {/* Default Badge */}
                  {isDefault && (
                    <span className="absolute right-4 top-4 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      Default
                    </span>
                  )}

                  <AddressCard
                    address={address}
                    selected={isDefault}
                    onSelect={() =>
                      !isDefault &&
                      onSetDefaultAddress?.(id)
                    }
                  />

                  <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(address)}
                    >
                      Edit
                    </Button>

                    {!isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          onSetDefaultAddress?.(id)
                        }
                      >
                        Make Default
                      </Button>
                    )}

                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() =>
                        onDeleteAddress?.(id)
                      }
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Back */}
        <div className="mt-8">
          <button
            type="button"
            onClick={() => onNavigate?.("/profile")}
            className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            ← Back to Profile
          </button>
        </div>
      </main>
    </div>
  );
};

export default Addresses;
