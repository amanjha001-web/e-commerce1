
import { useMemo, useState } from "react";

import PayoutTable from "../../components/vendor/PayoutTable";

import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import Modal from "../../components/common/Modal";
import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/common/Loader";

const Payouts = ({
  payouts = [],
  balance = {},
  loading = false,
  submitting = false,

  onRequestPayout,
  onViewPayout,
}) => {
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [amount, setAmount] = useState("");

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
        !keyword || payoutId.includes(keyword);

      const matchesStatus =
        status === "all" || payoutStatus === status;

      return matchesSearch && matchesStatus;
    });
  }, [payouts, search, status]);

  const availableBalance = Number(
    balance?.availableBalance ??
      balance?.available ??
      balance?.amount ??
      0
  );

  const pendingBalance = Number(
    balance?.pendingBalance ??
      balance?.pending ??
      0
  );

  const totalPaid = payouts
    .filter(
      (payout) =>
        String(payout?.status || "").toLowerCase() ===
        "paid"
    )
    .reduce(
      (total, payout) =>
        total + Number(payout?.amount || 0),
      0
    );

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payoutAmount = Number(amount);

    if (
      !Number.isFinite(payoutAmount) ||
      payoutAmount <= 0 ||
      payoutAmount > availableBalance
    ) {
      return;
    }

    try {
      await onRequestPayout?.(payoutAmount);
      setAmount("");
      setModalOpen(false);
    } catch (error) {
      console.log(error);
      // Keep the modal open if the request fails.
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Page Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="eyebrow">Finances & Withdrawals</div>
              <h1 className="text-2xl font-black text-[var(--text)] dark:text-foreground">
                Payouts
              </h1>
              <p className="mt-1 text-xs font-medium text-[var(--muted)]">
                Withdraw your available earnings and review payout history.
              </p>
            </div>

            <Button
              disabled={
                submitting || availableBalance <= 0
              }
              onClick={() => setModalOpen(true)}
              className="primarybtn"
            >
              Request Payout
            </Button>
          </div>

          {/* Balance Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="stat-card">
              <p className="text-xs font-bold text-[var(--muted)]">
                Available Balance
              </p>
              <p className="mt-2 text-2xl font-black text-[var(--primary)]">
                ₹{availableBalance.toLocaleString("en-IN")}
              </p>
            </div>

            <div className="stat-card">
              <p className="text-xs font-bold text-[var(--muted)]">
                Pending Balance
              </p>
              <p className="mt-2 text-2xl font-black text-[var(--amber)]">
                ₹{pendingBalance.toLocaleString("en-IN")}
              </p>
            </div>

            <div className="stat-card">
              <p className="text-xs font-bold text-[var(--muted)]">
                Total Payouts
              </p>
              <p className="mt-2 text-2xl font-black text-[var(--text)] dark:text-foreground">
                {payouts.length}
              </p>
            </div>

            <div className="stat-card">
              <p className="text-xs font-bold text-[var(--muted)]">
                Total Paid
              </p>
              <p className="mt-2 text-2xl font-black text-[var(--green)]">
                ₹{totalPaid.toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="panel p-4">
            <div className="grid gap-4 md:grid-cols-[1fr_220px]">
              <Input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search payout ID or transaction ID..."
              />

              <Select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value)
                }
                options={[
                  { label: "All Payouts", value: "all" },
                  { label: "Pending", value: "pending" },
                  { label: "Processing", value: "processing" },
                  { label: "Paid", value: "paid" },
                  { label: "Failed", value: "failed" },
                ]}
              />
            </div>
          </div>

          {/* Payout History */}
          <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-xs dark:border-line dark:bg-card">
            <div className="border-b border-[var(--line)] p-5 sm:p-6 bg-[#fcf9fa] dark:bg-card">
              <h2 className="text-base font-black text-[var(--text)] dark:text-foreground">
                Payout History
              </h2>

              <p className="mt-0.5 text-xs font-medium text-[var(--muted)]">
                View all payout requests and their current status.
              </p>
            </div>

            {loading ? (
              <div className="flex min-h-[300px] items-center justify-center">
                <Loader />
              </div>
            ) : filteredPayouts.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  title="No payouts found"
                  description={
                    search || status !== "all"
                      ? "Try changing your search or status filter."
                      : "Your payout history will appear here."
                  }
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <PayoutTable
                  payouts={filteredPayouts}
                  onViewPayout={onViewPayout}
                />
              </div>
            )}
          </section>
        </div>
      </main>

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
          <div className="rounded-xl border border-[var(--line)] bg-[var(--soft)] p-4">
            <p className="text-xs font-bold text-[var(--muted)]">
              Available balance
            </p>

            <p className="mt-1 text-2xl font-black text-[var(--primary)]">
              ₹{availableBalance.toLocaleString("en-IN")}
            </p>
          </div>

          <Input
            label="Payout Amount"
            type="number"
            min="1"
            max={availableBalance}
            value={amount}
            onChange={(event) =>
              setAmount(event.target.value)
            }
            placeholder="Enter amount"
            required
          />

          <p className="text-[11px] font-medium text-[var(--muted)]">
            You can request up to your current available balance.
          </p>

          <div className="flex justify-end gap-3 border-t border-[var(--line)] pt-5">
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() => {
                setModalOpen(false);
                setAmount("");
              }}
              className="outlinebtn"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={
                submitting ||
                !amount ||
                !Number.isFinite(Number(amount)) ||
                Number(amount) <= 0 ||
                Number(amount) > availableBalance
              }
              className="primarybtn"
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
