
import { useMemo, useState } from "react";

import VendorHeader from "../../components/vendor/VendorHeader";
import VendorSidebar from "../../components/vendor/VendorSidebar";

import PayoutTable from "../../components/vendor/PayoutTable";

import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import Modal from "../../components/common/Modal";
import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/common/Loader";

const Payouts = ({
  user = null,
  payouts = [],
  balance = {},
  loading = false,
  submitting = false,
  notificationCount = 0,

  onRequestPayout,
  onViewPayout,
  onNavigate,
  onLogout,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [amount, setAmount] = useState("");

  const handleNavigate = (item) => {
    setSidebarOpen(false);
    onNavigate?.(item);
  };

  const filteredPayouts = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return payouts.filter((payout) => {
      const payoutId = String(
        payout?.payoutId ||
          payout?.transactionId ||
          payout?._id ||
          ""
      ).toLowerCase();

      const payoutStatus = String(
        payout?.status || ""
      ).toLowerCase();

      const matchesSearch =
        !keyword ||
        payoutId.includes(keyword);

      const matchesStatus =
        status === "all" ||
        payoutStatus === status;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [payouts, search, status]);

  const availableBalance =
    Number(
      balance?.availableBalance ??
        balance?.available ??
        balance?.amount ??
        0
    );

  const pendingBalance =
    Number(
      balance?.pendingBalance ??
        balance?.pending ??
        0
    );

  const totalPaid =
    payouts
      .filter(
        (payout) =>
          String(
            payout?.status || ""
          ).toLowerCase() === "paid"
      )
      .reduce(
        (total, payout) =>
          total +
          Number(
            payout?.amount || 0
          ),
        0
      );

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payoutAmount = Number(amount);

    if (
      !payoutAmount ||
      payoutAmount <= 0 ||
      payoutAmount > availableBalance
    ) {
      return;
    }

    await onRequestPayout?.(
      payoutAmount
    );

    setAmount("");
    setModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <VendorSidebar
        activeItem="payouts"
        collapsed={false}
        onNavigate={handleNavigate}
        onLogout={onLogout}
        mobileOpen={sidebarOpen}
        onMobileClose={() =>
          setSidebarOpen(false)
        }
      />

      <div className="lg:pl-64">
        <VendorHeader
          title="Payouts"
          subtitle="Manage your payout requests and transaction history"
          user={user}
          notificationCount={notificationCount}
          onMenuClick={() =>
            setSidebarOpen(true)
          }
          onLogout={onLogout}
          onProfileClick={() =>
            handleNavigate("profile")
          }
          onNotificationsClick={() =>
            handleNavigate("notifications")
          }
        />

        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
                  Payouts
                </h1>

                <p className="mt-1 text-sm text-muted-foreground">
                  Withdraw your available earnings and review payout history.
                </p>
              </div>

              <Button
                disabled={
                  submitting ||
                  availableBalance <= 0
                }
                onClick={() =>
                  setModalOpen(true)
                }
              >
                Request Payout
              </Button>
            </div>

            {/* Balance Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <p className="text-sm text-muted-foreground">
                  Available Balance
                </p>

                <p className="mt-2 text-2xl font-bold text-primary">
                  ₹
                  {availableBalance.toLocaleString(
                    "en-IN"
                  )}
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <p className="text-sm text-muted-foreground">
                  Pending Balance
                </p>

                <p className="mt-2 text-2xl font-bold text-warning">
                  ₹
                  {pendingBalance.toLocaleString(
                    "en-IN"
                  )}
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <p className="text-sm text-muted-foreground">
                  Total Payouts
                </p>

                <p className="mt-2 text-2xl font-bold text-foreground">
                  {payouts.length}
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <p className="text-sm text-muted-foreground">
                  Total Paid
                </p>

                <p className="mt-2 text-2xl font-bold text-success">
                  ₹
                  {totalPaid.toLocaleString(
                    "en-IN"
                  )}
                </p>
              </div>
            </div>

            {/* Filters */}
            <div className="rounded-2xl border border-border bg-background p-4 shadow-sm">
              <div className="grid gap-4 md:grid-cols-[1fr_220px]">
                <Input
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search payout ID or transaction ID..."
                />

                <Select
                  value={status}
                  onChange={(event) =>
                    setStatus(
                      event.target.value
                    )
                  }
                  options={[
                    {
                      label: "All Payouts",
                      value: "all",
                    },
                    {
                      label: "Pending",
                      value: "pending",
                    },
                    {
                      label: "Processing",
                      value: "processing",
                    },
                    {
                      label: "Paid",
                      value: "paid",
                    },
                    {
                      label: "Failed",
                      value: "failed",
                    },
                  ]}
                />
              </div>
            </div>

            {/* Payout Table */}
            <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="border-b border-border p-5 sm:p-6">
                <h2 className="text-lg font-semibold text-foreground">
                  Payout History
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  View all payout requests and their current status.
                </p>
              </div>

              {loading ? (
                <div className="flex min-h-[300px] items-center justify-center">
                  <Loader />
                </div>
              ) : filteredPayouts.length ===
                0 ? (
                <div className="p-8">
                  <EmptyState
                    title="No payouts found"
                    description={
                      search ||
                      status !== "all"
                        ? "Try changing your search or status filter."
                        : "Your payout history will appear here."
                    }
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <PayoutTable
                    payouts={filteredPayouts}
                    onViewPayout={
                      onViewPayout
                    }
                  />
                </div>
              )}
            </section>
          </div>
        </main>
      </div>

      {/* Request Payout Modal */}
      <Modal
        open={modalOpen}
        onClose={() => {
          if (!submitting) {
            setModalOpen(false);
            setAmount("");
          }
        }}
        title="Request Payout"
      >
        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <p className="text-sm text-muted-foreground">
              Available balance
            </p>

            <p className="mt-1 text-xl font-bold text-foreground">
              ₹
              {availableBalance.toLocaleString(
                "en-IN"
              )}
            </p>
          </div>

          <Input
            label="Payout Amount"
            type="number"
            min="1"
            max={availableBalance}
            value={amount}
            onChange={(event) =>
              setAmount(
                event.target.value
              )
            }
            placeholder="Enter amount"
            required
          />

          <p className="text-xs text-muted-foreground">
            You can request up to your current available balance.
          </p>

          <div className="flex justify-end gap-3 border-t border-border pt-5">
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() => {
                setModalOpen(false);
                setAmount("");
              }}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={
                submitting ||
                !amount ||
                Number(amount) <= 0 ||
                Number(amount) >
                  availableBalance
              }
            >
              {submitting
                ? "Submitting..."
                : "Request Payout"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Payouts;