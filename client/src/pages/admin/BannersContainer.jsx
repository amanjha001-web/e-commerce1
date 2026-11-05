import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import Banners from "./Banners";

import {
  fetchBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBannerStatus,
} from "../../store/slices/Admin/adminBannersSlice";

const BannersContainer = () => {
  const dispatch = useDispatch();

  const { banners = [], loading, error, actionLoading } = useSelector(
    (state) => state.adminBanners || {}
  );

  const [filters, setFilters] = useState({
    search: "",
    page: 1,
    limit: 20,
  });

  // Fetch banners
  useEffect(() => {
    dispatch(fetchBanners(filters));
  }, [dispatch, filters]);

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: newFilters.page || 1,
    }));
  }, []);

  // Create banner
  const handleCreateBanner = useCallback(
    async (payload) => {
      dispatch(createBanner(payload));
    },
    [dispatch]
  );

  // Edit banner
  const handleEditBanner = useCallback(
    async (banner, data) => {
      dispatch(updateBanner({ bannerId: banner._id || banner.id, bannerData: data }));
    },
    [dispatch]
  );

  // Delete banner - requires confirmation
  const handleDeleteBanner = useCallback(
    async (banner) => {
      if (
        !window.confirm(
          `Are you sure you want to delete the banner "${
            banner?.title || banner?.name || "this banner"
          }"? This action cannot be undone.`
        )
      ) {
        return;
      }

      await dispatch(deleteBanner(banner._id || banner.id));
    },
    [dispatch]
  );

  // Toggle banner status
  const handleToggleBannerStatus = useCallback(
    async (banner) => {
      await dispatch(toggleBannerStatus(banner._id || banner.id));
    },
    [dispatch]
  );

  return (
    <Banners
      banners={banners}
      totalBanners={banners.length}
      loading={loading}
      saving={actionLoading}
      error={error}
      filters={filters}
      onFilterChange={handleFilterChange}
      onCreateBanner={handleCreateBanner}
      onEditBanner={handleEditBanner}
      onDeleteBanner={handleDeleteBanner}
      onToggleBannerStatus={handleToggleBannerStatus}
    />
  );
};

export default BannersContainer;