import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import Payments from "./Payments";

import {
  fetchPayments,
  fetchPaymentById,
  refundPayment,
  reconcilePayment,
  fetchVendorPayouts,
  fetchVendorPayoutById,
  updateVendorPayoutStatus,
} from "../../store/slices/Admin/adminPaymentsSlice";

const PaymentsContainer = () => {
  const dispatch = useDispatch();

  const {
    payments = [],
    selectedPayment,
    vendorPayouts = [],
    selectedPayout,
    loading,
    saving,
    detailsLoading,
    error,
    pagination,
  } = useSelector((state) => state.adminPayments || {});

  const [filters, setFilters] = useState({
    status: "all",
    method: "all",
    dateRange: "all",
    page: 1,
    limit: 20,
  });

  useEffect(() => {
    dispatch(fetchPayments(filters));
    dispatch(fetchVendorPayouts({ limit: 20 }));
  }, [dispatch, filters]);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: newFilters.page || 1,
    }));
  }, []);

  const handleViewPayment = useCallback(
    (payment) => {
      if (payment?._id) {
        dispatch(fetchPaymentById(payment._id));
      }
    },
    [dispatch],
  );

  const handleRefundPayment = useCallback(
    async (paymentId, amount, reason) => {
      await dispatch(
        refundPayment({
          paymentId,
          amount,
          reason: reason || "Admin initiated refund",
        }),
      ).unwrap();
      dispatch(fetchPayments(filters));
    },
    [dispatch, filters],
  );

  const handleReconcilePayment = useCallback(
    async (paymentId) => {
      await dispatch(reconcilePayment(paymentId)).unwrap();
      dispatch(fetchPayments(filters));
    },
    [dispatch, filters],
  );

  const handleViewPayout = useCallback(
    (payoutId) => {
      if (payoutId) {
        dispatch(fetchVendorPayoutById(payoutId));
      }
    },
    [dispatch],
  );

  const handleUpdatePayoutStatus = useCallback(
    async (payoutId, status) => {
      await dispatch(updateVendorPayoutStatus({ payoutId, status })).unwrap();
      dispatch(fetchVendorPayouts({ limit: 20 }));
    },
    [dispatch],
  );

  return (
    <Payments
      payments={payments}
      vendorPayouts={vendorPayouts}
      selectedPayout={selectedPayout}
      totalPayments={pagination?.total || payments.length}
      loading={loading}
      saving={saving}
      detailsLoading={detailsLoading}
      error={error}
      selectedPayment={selectedPayment}
      filters={filters}
      onFilterChange={handleFilterChange}
      onViewPayment={handleViewPayment}
      onRefundPayment={handleRefundPayment}
      onReconcilePayment={handleReconcilePayment}
      onViewPayout={handleViewPayout}
      onUpdatePayoutStatus={handleUpdatePayoutStatus}
      pagination={pagination}
    />
  );
};

export default PaymentsContainer;
