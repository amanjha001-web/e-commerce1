import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import Payments from "./Payments";

import {
  fetchPayments,
  fetchPaymentById,
  refundPayment,
} from "../../store/slices/Admin/adminPaymentsSlice";

const PaymentsContainer = () => {
  const dispatch = useDispatch();

  const {
    payments = [],
    selectedPayment,
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
  }, [dispatch, filters]);

  const handleFilterChange = useCallback(
    (newFilters) => {
      setFilters((prev) => ({
        ...prev,
        ...newFilters,
        page: newFilters.page || 1,
      }));
    },
    []
  );

  const handleViewPayment = useCallback(
    (payment) => {
      dispatch(fetchPaymentById(payment._id));
    },
    [dispatch]
  );

  const handleDeletePayment = useCallback(
    async (payment) => {
      if (
        !window.confirm(
          `Delete payment for order ${payment?.orderId || payment?._id}? This cannot be undone.`
        )
      ) {
        return;
      }
      // Payments cannot be deleted via API, only status can be changed
      // This is a no-op placeholder
    },
    []
  );

  const handleStatusChange = useCallback(
    async (payment, status, reason) => {
      if (status === "refund") {
        if (
          !window.confirm(
            `Request refund for payment ${payment?._id}? Reason: ${reason || "Not specified"}`
          )
        ) {
          return;
        }
        dispatch(
          refundPayment({
            paymentId: payment._id,
            amount: payment?.amount || 0,
            reason: reason || "Customer request",
          })
        );
      }
    },
    [dispatch]
  );

  /* eslint-disable no-unused-vars */
  const handleEditPayment = useCallback(
    (_payment) => {
      // Payments cannot be edited directly, only status can be changed
    },
    []
  );
  /* eslint-enable no-unused-vars */

  return (
    <Payments
      payments={payments}
      totalPayments={pagination?.total || payments.length}
      loading={loading}
      saving={saving}
      detailsLoading={detailsLoading}
      error={error}
      selectedPayment={selectedPayment}
      filters={filters}
      onFilterChange={handleFilterChange}
      onViewPayment={handleViewPayment}
      onEditPayment={handleEditPayment}
      onDeletePayment={handleDeletePayment}
      onStatusChange={handleStatusChange}
      pagination={pagination}
    />
  );
};

export default PaymentsContainer;