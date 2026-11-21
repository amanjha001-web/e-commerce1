import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import Banners from "./Banners";

import {
  fetchBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBannerStatus,
  clearBannersError,
} from "../../store/slices/Admin/adminBannersSlice";

const BannersContainer = () => {
  const dispatch = useDispatch();

  const {
    banners = [],
    summary = {},
    pagination = {},
    loading,
    error,
    actionLoading,
  } = useSelector((state) => state.adminBanners || {});

  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    position: "all",
    page: 1,
    limit: 10,
  });

  useEffect(() => {
    dispatch(fetchBanners(filters));
  }, [dispatch, filters]);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: newFilters.page !== undefined ? newFilters.page : 1,
    }));
  }, []);

  const handleCreateBanner = useCallback(
    async (payload) => {
      await dispatch(createBanner(payload)).unwrap();
      dispatch(fetchBanners(filters));
    },
    [dispatch, filters],
  );

  const handleEditBanner = useCallback(
    async (banner, data) => {
      await dispatch(
        updateBanner({
          bannerId: banner._id || banner.id,
          bannerData: data,
        }),
      ).unwrap();
      dispatch(fetchBanners(filters));
    },
    [dispatch, filters],
  );

  const handleDeleteBanner = useCallback(
    async (banner) => {
      await dispatch(deleteBanner(banner._id || banner.id)).unwrap();
      dispatch(fetchBanners(filters));
    },
    [dispatch, filters],
  );

  const handleToggleBannerStatus = useCallback(
    async (banner, nextActive) => {
      await dispatch(
        toggleBannerStatus({
          bannerId: banner._id || banner.id,
          isActive: nextActive,
        }),
      ).unwrap();
      dispatch(fetchBanners(filters));
    },
    [dispatch, filters],
  );

  const handleClearError = useCallback(() => {
    dispatch(clearBannersError());
  }, [dispatch]);

  return (
    <Banners
      banners={banners}
      summary={summary}
      totalBanners={pagination?.total ?? banners.length}
      pagination={pagination}
      loading={loading}
      saving={actionLoading}
      error={error}
      filters={filters}
      onFilterChange={handleFilterChange}
      onCreateBanner={handleCreateBanner}
      onEditBanner={handleEditBanner}
      onDeleteBanner={handleDeleteBanner}
      onToggleBannerStatus={handleToggleBannerStatus}
      onClearError={handleClearError}
    />
  );
};

export default BannersContainer;
