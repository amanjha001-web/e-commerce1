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
    error,
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
    dispatch(fetchVendorRequestById(request._id));
  };

  const handleApproveRequest = async (request) => {
    if (
      !window.confirm(`Approve ${request.shopName || request.businessName}?`)
    ) {
      return;
    }

    const result = await dispatch(approveVendorRequest(request._id));

    if (approveVendorRequest.fulfilled.match(result)) {
      dispatch(fetchVendorRequests(filters));
    }
  };

  // Accept a reason from the details drawer.
  // If called from the table, prompt for a reason.
  const handleRejectRequest = async (request, suppliedReason) => {
    let reason = suppliedReason;

    if (typeof reason !== "string") {
      reason = window.prompt("Enter rejection reason:");
    }

    if (reason === null || !reason?.trim()) return;

    const result = await dispatch(
      rejectVendorRequest({
        requestId: request._id,
        reason: reason.trim(),
      }),
    );

    if (rejectVendorRequest.fulfilled.match(result)) {
      dispatch(fetchVendorRequests(filters));
    }
  };

  const handleDeleteRequest = async (request) => {
    if (
      !window.confirm(
        `Delete vendor request for ${
          request.shopName || request.businessName
        }?`,
      )
    ) {
      return;
    }

    const result = await dispatch(deleteVendorRequest(request._id));

    if (deleteVendorRequest.fulfilled.match(result)) {
      dispatch(fetchVendorRequests(filters));
    }
  };

  return (
    <>
      {error && (
        <div
          role="alert"
          className="mx-4 mt-4 rounded-lg border border-red-300 p-3 text-sm text-red-600"
        >
          {error}
        </div>
      )}

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
    </>
  );
};

export default VendorRequestsContainer;
