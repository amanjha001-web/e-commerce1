import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import Coupons from "./Coupons";

import {
  fetchCoupons,
  fetchCouponById,
  fetchCouponUsage,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
} from "../../store/slices/Admin/adminCouponsSlice";

const CouponsContainer = () => {
  const dispatch = useDispatch();

  const {
    coupons = [],
    selectedCoupon,
    couponUsage,
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

  const handleFilterChange = useCallback((newFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: newFilters.page || 1,
    }));
  }, []);

  const handleInspectCoupon = useCallback(
    (couponId) => {
      if (couponId) {
        dispatch(fetchCouponById(couponId));
        dispatch(fetchCouponUsage(couponId));
      }
    },
    [dispatch],
  );

  const handleCreateCoupon = useCallback(
    async (couponData) => {
      await dispatch(createCoupon(couponData)).unwrap();
      dispatch(fetchCoupons(filters));
    },
    [dispatch, filters],
  );

  const handleEditCoupon = useCallback(
    async (coupon, data) => {
      await dispatch(
        updateCoupon({ couponId: coupon._id, couponData: data }),
      ).unwrap();
      dispatch(fetchCoupons(filters));
    },
    [dispatch, filters],
  );

  const handleDeleteCoupon = useCallback(
    async (coupon) => {
      await dispatch(deleteCoupon(coupon._id)).unwrap();
      dispatch(fetchCoupons(filters));
    },
    [dispatch, filters],
  );

  const handleToggleCouponStatus = useCallback(
    async (coupon, nextActive) => {
      await dispatch(
        toggleCouponStatus({
          couponId: coupon._id,
          isActive: nextActive,
        }),
      ).unwrap();
      dispatch(fetchCoupons(filters));
    },
    [dispatch, filters],
  );

  return (
    <Coupons
      coupons={coupons}
      selectedCoupon={selectedCoupon}
      couponUsage={couponUsage}
      totalCoupons={pagination?.total || coupons.length}
      loading={loading}
      saving={saving}
      error={error}
      filters={filters}
      onFilterChange={handleFilterChange}
      onInspectCoupon={handleInspectCoupon}
      onCreateCoupon={handleCreateCoupon}
      onEditCoupon={handleEditCoupon}
      onDeleteCoupon={handleDeleteCoupon}
      onToggleCouponStatus={handleToggleCouponStatus}
      pagination={pagination}
    />
  );
};

export default CouponsContainer;
