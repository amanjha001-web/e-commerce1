import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";

import VendorRequests from "./VendorRequests";

import {
  fetchVendorRequests,
  fetchVendorRequestById,
  approveVendorRequest,
  rejectVendorRequest,
  reviewVendorRequest,
  deleteVendorRequest,
  clearSelectedVendorRequest,
  clearVendorRequestMessages,
} from "../../store/slices/vendorRequestSlice";

const initialFilters = {
  search: "",
  status: "",
  page: 1,
  limit: 12,
};

const VendorRequestsContainer = () => {
  const dispatch = useDispatch();

  const {
    requests,
    summary,
    selectedRequest,
    pagination,
    loading,
    detailsLoading,
    saving,
    error,
  } = useSelector((state) => state.vendorRequests);

  const [filters, setFilters] = useState(initialFilters);

  const refreshRequests = (targetFilters = filters) => {
    const params = {
      page: targetFilters.page || 1,
      limit: targetFilters.limit || 12,
    };
    if (targetFilters.search?.trim()) {
      params.search = targetFilters.search.trim();
    }
    if (targetFilters.status && targetFilters.status !== "all") {
      params.status = targetFilters.status;
    }
    dispatch(fetchVendorRequests(params));
  };

  useEffect(() => {
    const timer = setTimeout(
      () => {
        refreshRequests(filters);
      },
      filters.search ? 300 : 0,
    );
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, filters.search, filters.status, filters.page, filters.limit]);

  const handleFilterChange = (nextFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...nextFilters,
      page: Object.prototype.hasOwnProperty.call(nextFilters, "page")
        ? nextFilters.page
        : 1,
    }));
  };

  const handleResetFilters = () => {
    setFilters(initialFilters);
  };

  const handleViewRequest = async (request) => {
    if (!request?._id) return;
    try {
      await dispatch(fetchVendorRequestById(request._id)).unwrap();
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Failed to load application details");
    }
  };

  const handleApproveRequest = async (request) => {
    if (!request?._id) return false;
    try {
      await dispatch(approveVendorRequest(request._id)).unwrap();
      toast.success("Vendor application approved & store activated");
      refreshRequests();
      return true;
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Failed to approve request");
      return false;
    }
  };

  const handleRejectRequest = async (request, suppliedReason) => {
    if (!request?._id) return false;
    const reason =
      typeof suppliedReason === "string" && suppliedReason.trim()
        ? suppliedReason.trim()
        : "Application rejected by administrator";

    try {
      await dispatch(
        rejectVendorRequest({
          requestId: request._id,
          reason,
        }),
      ).unwrap();
      toast.success("Vendor application rejected");
      refreshRequests();
      return true;
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Failed to reject request");
      return false;
    }
  };

  const handleReviewRequest = async (request, notes = "") => {
    if (!request?._id) return false;
    try {
      await dispatch(
        reviewVendorRequest({
          requestId: request._id,
          reviewData: { notes },
        }),
      ).unwrap();
      toast.success("Application marked as Under Review");
      refreshRequests();
      return true;
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Failed to update review status");
      return false;
    }
  };

  const handleDeleteRequest = async (request) => {
    if (!request?._id) return false;
    try {
      await dispatch(deleteVendorRequest(request._id)).unwrap();
      toast.success("Vendor request archived");
      if (filters.page > 1 && requests.length <= 1) {
        handleFilterChange({ page: filters.page - 1 });
      } else {
        refreshRequests();
      }
      return true;
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Failed to delete vendor request");
      return false;
    }
  };

  return (
    <VendorRequests
      requests={requests}
      summary={summary}
      selectedRequest={selectedRequest}
      totalRequests={pagination.total}
      pagination={pagination}
      loading={loading}
      detailsLoading={detailsLoading}
      saving={saving}
      error={error}
      filters={filters}
      onClearError={() => dispatch(clearVendorRequestMessages())}
      onFilterChange={handleFilterChange}
      onResetFilters={handleResetFilters}
      onViewRequest={handleViewRequest}
      onApproveRequest={handleApproveRequest}
      onRejectRequest={handleRejectRequest}
      onReviewRequest={handleReviewRequest}
      onDeleteRequest={handleDeleteRequest}
      onCloseDetails={() => dispatch(clearSelectedVendorRequest())}
    />
  );
};

export default VendorRequestsContainer;
