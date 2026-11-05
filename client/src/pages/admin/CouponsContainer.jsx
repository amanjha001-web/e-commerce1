import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import Coupons from "./Coupons";

import {
  fetchCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
} from "../../store/slices/Admin/adminCouponsSlice";

const CouponsContainer = () => {
  const dispatch = useDispatch();

  const {
    coupons = [],
    loading,
    saving,
    error,
    pagination,
  } = useSelector((state) => state.adminCoupons || {});

  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    type: "all",
    page: 1,
    limit: 20,
  });

  useEffect(() => {
    dispatch(fetchCoupons(filters));
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

  const handleCreateCoupon = useCallback(
    async (couponData) => {
      dispatch(createCoupon(couponData));
    },
    [dispatch]
  );

  const handleEditCoupon = useCallback(
    async (coupon, data) => {
      dispatch(updateCoupon({ couponId: coupon._id, couponData: data }));
    },
    [dispatch]
  );

  const handleDeleteCoupon = useCallback(
    async (coupon) => {
      if (
        !window.confirm(
          `Are you sure you want to delete coupon "${
            coupon?.code || coupon?.name || "this coupon"
          }"? This action cannot be undone.`
        )
      ) {
        return;
      }
      dispatch(deleteCoupon(coupon._id));
    },
    [dispatch]
  );

  const handleToggleCouponStatus = useCallback(
    async (coupon) => {
      dispatch(toggleCouponStatus(coupon._id));
    },
    [dispatch]
  );

  return (
    <Coupons
      coupons={coupons}
      totalCoupons={pagination?.total || coupons.length}
      loading={loading}
      saving={saving}
      error={error}
      filters={filters}
      onFilterChange={handleFilterChange}
      onCreateCoupon={handleCreateCoupon}
      onEditCoupon={handleEditCoupon}
      onDeleteCoupon={handleDeleteCoupon}
      onToggleCouponStatus={handleToggleCouponStatus}
      pagination={pagination}
    />
  );
};

export default CouponsContainer;