import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import VendorRequests from "./VendorRequests";

import {
  fetchVendorRequests,
  fetchVendorRequestById,
  approveVendorRequest,
  rejectVendorRequest,
  deleteVendorRequest,
  clearSelectedVendorRequest,
} from "../../store/slices/vendorRequestSlice";

const VendorRequestsContainer = () => {
  const dispatch = useDispatch();

  const {
    requests,
    selectedRequest,
    pagination,
    loading,
    detailsLoading,
    saving,
  } = useSelector((state) => state.vendorRequests);

  const [filters, setFilters] = useState({
    status: "",
    page: 1,
    limit: 10,
  });

  useEffect(() => {
    dispatch(fetchVendorRequests(filters));
  }, [dispatch, filters]);

  const handleFilterChange = (nextFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...nextFilters,
      page: Object.prototype.hasOwnProperty.call(nextFilters, "page")
        ? nextFilters.page
        : 1,
    }));
  };

  const handleViewRequest = (request) => {
    if (request?._id) {
      dispatch(fetchVendorRequestById(request._id));
    }
  };

  const handleApproveRequest = async (request) => {
    if (!request?._id) return;
    const result = await dispatch(approveVendorRequest(request._id));
    if (approveVendorRequest.fulfilled.match(result)) {
      dispatch(fetchVendorRequests(filters));
    }
  };

  const handleRejectRequest = async (request, suppliedReason) => {
    if (!request?._id) return;
    const reason =
      typeof suppliedReason === "string" && suppliedReason.trim()
        ? suppliedReason.trim()
        : "Rejected by admin";

    const result = await dispatch(
      rejectVendorRequest({
        requestId: request._id,
        reason,
      }),
    );

    if (rejectVendorRequest.fulfilled.match(result)) {
      dispatch(fetchVendorRequests(filters));
    }
  };

  const handleDeleteRequest = async (request) => {
    if (!request?._id) return;
    const result = await dispatch(deleteVendorRequest(request._id));
    if (deleteVendorRequest.fulfilled.match(result)) {
      dispatch(fetchVendorRequests(filters));
    }
  };

  return (
    <VendorRequests
      requests={requests}
      selectedRequest={selectedRequest}
      totalRequests={pagination.total}
      pagination={pagination}
      loading={loading}
      detailsLoading={detailsLoading}
      saving={saving}
      filters={filters}
      onFilterChange={handleFilterChange}
      onViewRequest={handleViewRequest}
      onApproveRequest={handleApproveRequest}
      onRejectRequest={handleRejectRequest}
      onDeleteRequest={handleDeleteRequest}
      onCloseDetails={() => dispatch(clearSelectedVendorRequest())}
    />
  );
};

export default VendorRequestsContainer;
