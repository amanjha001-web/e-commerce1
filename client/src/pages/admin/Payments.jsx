import { useState } from "react";

import PaymentTable from "../../components/admin/payments/PaymentTable";
import PaymentDetails from "../../components/admin/payments/PaymentDetails";
import PaymentStatus from "../../components/admin/payments/PaymentStatus";

const AdminPayments = ({
  payments = [],
  loading = false,
  saving = false,

  onViewPayment,
  onEditPayment,
  onDeletePayment,
  onStatusChange,
}) => {
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [statusPayment, setStatusPayment] = useState(null);
  const [statusOpen, setStatusOpen] = useState(false);

  const handleViewPayment = (payment) => {
    setSelectedPayment(payment);
    setDetailsOpen(true);

    onViewPayment?.(payment);
  };

  const handleEditPayment = (payment) => {
    onEditPayment?.(payment);
  };

  const handleDeletePayment = (payment) => {
    onDeletePayment?.(payment);
  };

  const handleOpenStatus = (payment) => {
    setStatusPayment(payment);
    setStatusOpen(true);
  };

  const handleCloseDetails = () => {
    if (loading) return;

    setDetailsOpen(false);
    setSelectedPayment(null);
  };

  const handleCloseStatus = () => {
    if (saving) return;

    setStatusOpen(false);
    setStatusPayment(null);
  };

  const handleConfirmStatus = async (payment, status, reason) => {
    if (!onStatusChange || saving) return;

    await onStatusChange(payment, status, reason);

    setStatusOpen(false);
    setStatusPayment(null);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <main className="min-w-0 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Page Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                All Payments
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                View and manage payment transactions.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-background px-4 py-2 shadow-sm">
              <span className="font-semibold text-foreground">
                {payments.length}
              </span>

              <span className="ml-1 text-sm text-muted-foreground">
                transactions
              </span>
            </div>
          </div>

          {/* Payment Table */}
          <PaymentTable
            payments={payments}
            loading={loading}
            onViewPayment={handleViewPayment}
            onEditPayment={handleEditPayment}
            onDeletePayment={handleDeletePayment}
            onStatusChange={handleOpenStatus}
          />
        </div>
      </main>

      {/* Payment Details */}
      <PaymentDetails
        payment={selectedPayment}
        open={detailsOpen}
        loading={loading}
        onClose={handleCloseDetails}
        onEdit={handleEditPayment}
        onStatusChange={handleOpenStatus}
      />

      {/* Payment Status */}
      <PaymentStatus
        payment={statusPayment}
        open={statusOpen}
        loading={saving}
        onClose={handleCloseStatus}
        onConfirm={handleConfirmStatus}
      />
    </div>
  );
};

export default AdminPayments;
