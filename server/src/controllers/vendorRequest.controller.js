import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

import vendorRequestService from "../services/vendorRequest.service.js";

/*                      Submit Vendor Request                                 */

const submitVendorRequest = asyncHandler(async (req, res) => {
  const vendorRequest = await vendorRequestService.submitVendorRequest(
    req.user._id,

    req.body,
  );

  return res.status(201).json(
    new ApiResponse(
      201,

      vendorRequest,

      "Vendor request submitted successfully",
    ),
  );
});

/*                         Get My Request                                     */

const getMyRequest = asyncHandler(async (req, res) => {
  const vendorRequest = await vendorRequestService.getMyRequest(req.user._id);

  return res.status(200).json(
    new ApiResponse(
      200,

      vendorRequest,

      "Vendor request fetched successfully",
    ),
  );
});

/*                      Get Vendor Request By Id                              */

const getVendorRequestById = asyncHandler(async (req, res) => {
  const vendorRequest = await vendorRequestService.getVendorRequestById(
    req.params.id,
  );

  return res.status(200).json(
    new ApiResponse(
      200,

      vendorRequest,

      "Vendor request fetched successfully",
    ),
  );
});

/*                    Get All Vendor Requests                                 */

const getAllVendorRequests = asyncHandler(async (req, res) => {
  const requests = await vendorRequestService.getAllVendorRequests(req.query);

  return res.status(200).json(
    new ApiResponse(
      200,

      requests,

      "Vendor requests fetched successfully",
    ),
  );
});

/*                     Update Vendor Request                                  */

const updateVendorRequest = asyncHandler(async (req, res) => {
  const vendorRequest = await vendorRequestService.updateVendorRequest(
    req.user._id,

    req.params.id,

    req.body,
  );

  return res.status(200).json(
    new ApiResponse(
      200,

      vendorRequest,

      "Vendor request updated successfully",
    ),
  );
});

/*                     Upload Documents                                       */

const uploadVendorDocuments = asyncHandler(async (req, res) => {
  const vendorRequest = await vendorRequestService.uploadDocuments(
    req.params.id,

    req.files,
  );

  return res.status(200).json(
    new ApiResponse(
      200,

      vendorRequest,

      "Documents uploaded successfully",
    ),
  );
});

/*                     Mark Under Review                                      */

const markUnderReview = asyncHandler(async (req, res) => {
  const vendorRequest = await vendorRequestService.markUnderReview(
    req.params.id,

    req.user._id,
  );

  return res.status(200).json(
    new ApiResponse(
      200,

      vendorRequest,

      "Vendor request moved to review",
    ),
  );
});
/*                     Approve Vendor Request                                 */

const approveVendorRequest = asyncHandler(
  async (req, res) => {

    const vendor =
      await vendorRequestService.approveVendorRequest(

        req.params.id,

        req.user._id

      );



    return res.status(200).json(

      new ApiResponse(

        200,

        vendor,

        "Vendor request approved successfully"

      )

    );

  }
);





/*                     Reject Vendor Request                                  */

const rejectVendorRequest = asyncHandler(
  async (req, res) => {

    const vendorRequest =
      await vendorRequestService.rejectVendorRequest(

        req.params.id,

        req.body.reason,

        req.user._id

      );



    return res.status(200).json(

      new ApiResponse(

        200,

        vendorRequest,

        "Vendor request rejected successfully"

      )

    );

  }
);






/*                     Delete Vendor Request                                  */

const deleteVendorRequest = asyncHandler(
  async (req, res) => {

    await vendorRequestService.deleteVendorRequest(

      req.params.id,

      req.user._id

    );



    return res.status(200).json(

      new ApiResponse(

        200,

        null,

        "Vendor request deleted successfully"

      )

    );

  }
);






/*                     Restore Vendor Request                                 */

const restoreVendorRequest = asyncHandler(
  async (req, res) => {

    const vendorRequest =
      await vendorRequestService.restoreVendorRequest(

        req.params.id,

        req.user._id

      );



    return res.status(200).json(

      new ApiResponse(

        200,

        vendorRequest,

        "Vendor request restored successfully"

      )

    );

  }
);






/*                               Export                                       */

export  default{

  submitVendorRequest,

  getMyRequest,

  getVendorRequestById,

  getAllVendorRequests,

  updateVendorRequest,

  uploadVendorDocuments,

  markUnderReview,

  approveVendorRequest,

  rejectVendorRequest,

  deleteVendorRequest,

  restoreVendorRequest,

};