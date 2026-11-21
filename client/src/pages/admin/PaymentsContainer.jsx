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
  clearAdminPaymentsError,
} from "../../store/slices/Admin/adminPaymentsSlice";

const PaymentsContainer = () => {
  const dispatch = useDispatch();

  const {
    payments = [],
    summary = null,
    selectedPayment,
    vendorPayouts = [],
    payoutSummary = null,
    selectedPayout,
    loading,
    saving,
    detailsLoading,
    error,
    pagination,
    payoutPagination,
  } = useSelector((state) => state.adminPayments || {});

  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    method: "all",
    dateRange: "all",
    page: 1,
    limit: 10,
  });

  const [payoutFilters, setPayoutFilters] = useState({
    search: "",
    status: "all",
    page: 1,
    limit: 10,
  });

  useEffect(() => {
    const timer = setTimeout(
      () => {
        dispatch(fetchPayments(filters));
      },
      filters.search ? 300 : 0,
    );
    return () => clearTimeout(timer);
  }, [dispatch, filters]);

  useEffect(() => {
    const timer = setTimeout(
      () => {
        dispatch(fetchVendorPayouts(payoutFilters));
      },
      payoutFilters.search ? 300 : 0,
    );
    return () => clearTimeout(timer);
  }, [dispatch, payoutFilters]);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: Object.prototype.hasOwnProperty.call(newFilters, "page")
        ? newFilters.page
        : 1,
    }));
  }, []);

  const handlePayoutFilterChange = useCallback((newFilters) => {
    setPayoutFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: Object.prototype.hasOwnProperty.call(newFilters, "page")
        ? newFilters.page
        : 1,
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
      const result = await dispatch(
        refundPayment({
          paymentId,
          amount,
          reason: reason || "Admin initiated refund",
        }),
      ).unwrap();
      dispatch(fetchPayments(filters));
      return result;
    },
    [dispatch, filters],
  );

  const handleReconcilePayment = useCallback(
    async (paymentId) => {
      const result = await dispatch(reconcilePayment(paymentId)).unwrap();
      dispatch(fetchPayments(filters));
      return result;
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
    async (payoutId, statusOrPayload) => {
      const payload =
        typeof statusOrPayload === "object" && statusOrPayload !== null
          ? statusOrPayload
          : { status: statusOrPayload };
      const result = await dispatch(
        updateVendorPayoutStatus({ payoutId, ...payload }),
      ).unwrap();
      dispatch(fetchVendorPayouts(payoutFilters));
      return result;
    },
    [dispatch, payoutFilters],
  );

  const handleClearError = useCallback(() => {
    dispatch(clearAdminPaymentsError());
  }, [dispatch]);

  return (
    <Payments
      payments={payments}
      summary={summary}
      vendorPayouts={vendorPayouts}
      payoutSummary={payoutSummary}
      selectedPayout={selectedPayout}
      loading={loading}
      saving={saving}
      detailsLoading={detailsLoading}
      error={error}
      selectedPayment={selectedPayment}
      filters={filters}
      payoutFilters={payoutFilters}
      onClearError={handleClearError}
      onFilterChange={handleFilterChange}
      onPayoutFilterChange={handlePayoutFilterChange}
      onViewPayment={handleViewPayment}
      onRefundPayment={handleRefundPayment}
      onReconcilePayment={handleReconcilePayment}
      onViewPayout={handleViewPayout}
      onUpdatePayoutStatus={handleUpdatePayoutStatus}
      pagination={pagination}
      payoutPagination={payoutPagination}
    />
  );
};

export default PaymentsContainer;
