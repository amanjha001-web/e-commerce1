import mongoose from "mongoose";

import ApiError from "../utils/ApiError.js";

import vendorRequestRepository from "../repositories/vendorRequest.repository.js";
import vendorRepository from "../repositories/vendor.repository.js";
import userRepository from "../repositories/user.repository.js";


/*                         Submit Vendor Request                              */

const submitVendorRequest = async (userId, requestData) => {
  const session = await mongoose.startSession();

  session.startTransaction();

  try {
    /*                         User Exists                                    */

    const user = await userRepository.getUserById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    /*                       Already Vendor                                   */

    const existingVendor = await vendorRepository.getVendorByUserId(userId);

    if (existingVendor) {
      throw new ApiError(409, "User is already a vendor");
    }

    /*                    Existing Pending Request                            */

    const existingRequest =
      await vendorRequestRepository.findPendingByUser(userId);

    if (existingRequest) {
      throw new ApiError(409, "Vendor request already submitted");
    }

    /*                     Create Request                                     */

    const vendorRequest = await vendorRequestRepository.createVendorRequest(
      {
        user: userId,

        ...requestData,

        status: "pending",
      },

      session,
    );

    await session.commitTransaction();

    return vendorRequest;
  } catch (error) {
    await session.abortTransaction();

    throw error;
  } finally {
    session.endSession();
  }
};

/*                          Get My Request                                    */

const getMyRequest = async (userId) => {
  const vendorRequest = await vendorRequestRepository.findByUser(userId);

  if (!vendorRequest) {
    throw new ApiError(
      404,

      "Vendor request not found",
    );
  }

  return vendorRequest;
};

/*                      Check Pending Request                                 */

const hasPendingRequest = async (userId) => {
  const request = await vendorRequestRepository.findPendingByUser(userId);

  return Boolean(request);
};

/*                      Check Approved Request                                */

const hasApprovedRequest = async (userId) => {
  const request = await vendorRequestRepository.findApprovedByUser(userId);

  return Boolean(request);
};

/*                           Export (Continue...)                             */
/*                     Get Vendor Request By Id                               */

const getVendorRequestById = async (
  requestId
) => {

  const vendorRequest =
    await vendorRequestRepository.findById(
      requestId
    );



  if (!vendorRequest) {

    throw new ApiError(
      404,
      "Vendor request not found"
    );

  }



  return vendorRequest;

};





/*                     Get All Vendor Requests                                */

const getAllVendorRequests = async (
  query = {}
) => {

  const {

    page = 1,

    limit = 10,

    status,

    search,

    sort = "-createdAt",

  } = query;



  return vendorRequestRepository.findAll(

    {

      page: Number(page),

      limit: Number(limit),

      status,

      search,

      sort,

    }

  );

};





/*                      Update Vendor Request                                 */

const updateVendorRequest = async (
  userId,
  requestId,
  updateData
) => {

  const vendorRequest =
    await vendorRequestRepository.findById(
      requestId
    );



  if (!vendorRequest) {

    throw new ApiError(
      404,
      "Vendor request not found"
    );

  }



  if (vendorRequest.user._id.toString() !== userId.toString()) {
    throw new ApiError(403, "You are not allowed to update this request");
  }



  if (
    vendorRequest.status !== "pending"
  ) {

    throw new ApiError(
      400,
      "Only pending requests can be updated"
    );

  }



  return vendorRequestRepository.updateVendorRequest(

    requestId,

    updateData

  );

};





/*                      Upload Documents                                      */

const uploadDocuments = async (requestId, files) => {
  const vendorRequest =
    await vendorRequestRepository.findById(requestId);

  if (!vendorRequest) {
    throw new ApiError(404, "Vendor request not found");
  }

  if (vendorRequest.status !== "pending") {
    throw new ApiError(
      400,
      "Documents can only be uploaded for pending requests",
    );
  }

  if (!files || files.length === 0) {
    throw new ApiError(400, "No documents uploaded");
  }

  const documents = files.map((file) => ({
    type: "other",
    number: "",
    url: `/temp/${file.filename}`,
    publicId: file.filename,
  }));

  const updatedDocuments = [
    ...(vendorRequest.documents || []),
    ...documents,
  ];

  return vendorRequestRepository.updateVendorRequest(
    requestId,
    {
      documents: updatedDocuments,
    },
  );
};





/*                    Check Request Ownership                                 */

const isRequestOwner = async (
  requestId,
  userId
) => {

  const request =
    await vendorRequestRepository.findById(
      requestId
    );



  if (!request) {

    return false;

  }



 return request.user._id.toString() === userId.toString();

};
/*                       Mark Under Review                                    */

const markUnderReview = async (
  requestId,
  adminId
) => {

  const vendorRequest =
    await vendorRequestRepository.findById(
      requestId
    );



  if (!vendorRequest) {

    throw new ApiError(
      404,
      "Vendor request not found"
    );

  }



  if (vendorRequest.status !== "pending") {

    throw new ApiError(
      400,
      "Only pending requests can be reviewed"
    );

  }



  return vendorRequestRepository.updateVendorRequest(

    requestId,

    {

      status: "under_review",

      reviewedBy: adminId,

      reviewedAt: new Date(),

    }

  );

};





/*                     Approve Vendor Request                                 */

const approveVendorRequest = async (requestId, adminId) => {
  const session = await mongoose.startSession();

  session.startTransaction();

  try {
    /*                         Get Vendor Request                             */

    const vendorRequest = await vendorRequestRepository.findById(requestId);

    if (!vendorRequest) {
      throw new ApiError(404, "Vendor request not found");
    }

    /*                         Request Status                                 */

    if (vendorRequest.status === "approved") {
      throw new ApiError(400, "Vendor request already approved");
    }

    if (
      vendorRequest.status !== "pending" &&
      vendorRequest.status !== "under_review"
    ) {
      throw new ApiError(
        400,
        `Cannot approve a ${vendorRequest.status} vendor request`,
      );
    }

    /*                         Already Vendor                                 */

    const existingVendor = await vendorRepository.getVendorByUserId(
      vendorRequest.user,
    );

    if (existingVendor) {
      throw new ApiError(409, "Vendor already exists");
    }

    /*                         Generate Shop Slug                             */

    const shopSlug = vendorRequest.shopName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (!shopSlug) {
      throw new ApiError(400, "Unable to generate shop slug");
    }

    /*                         Create Vendor                                  */

    const vendor = await vendorRepository.createVendor(
      {
        user: vendorRequest.user,

        shopName: vendorRequest.shopName,

        shopSlug,

        shopDescription: vendorRequest.description || "",

        logo: vendorRequest.logo || {
          url: "",
          publicId: "",
        },

        banner: vendorRequest.banner || {
          url: "",
          publicId: "",
        },

        website: vendorRequest.website || "",

        phone: vendorRequest.phone,

        email: vendorRequest.email,

        address: vendorRequest.address || {
          addressLine1: "",
          addressLine2: "",
          city: "",
          state: "",
          country: "India",
          postalCode: "",
        },

        bankDetails: vendorRequest.bankDetails || {
          accountHolderName: "",
          accountNumber: "",
          ifscCode: "",
          bankName: "",
        },

        isVerified: false,

        isApproved: true,

        isActive: true,
      },

      session,
    );

    /*                         Update User Role                               */

    const updatedUser = await userRepository.updateUser(
      vendorRequest.user,
      {
        role: "vendor",
      },
      session,
    );

    if (!updatedUser) {
      throw new ApiError(404, "User not found while updating role");
    }

    /*                         Approve Request                                */

    await vendorRequestRepository.updateVendorRequest(
      requestId,
      {
        status: "approved",
        reviewedBy: adminId,
        reviewedAt: new Date(),
      },
      session,
    );

    /*                         Commit Transaction                             */

    await session.commitTransaction();

    /*                         Return Fresh Vendor                            */

    const approvedVendor = await vendorRepository.getVendorById(vendor._id);

    return approvedVendor || vendor;
  } catch (error) {
    await session.abortTransaction();

    throw error;
  } finally {
    session.endSession();
  }
};
/*                     Reject Vendor Request                                  */

const rejectVendorRequest = async (
  requestId,
  reason,
  adminId
) => {

  const vendorRequest =
    await vendorRequestRepository.findById(
      requestId
    );



  if (!vendorRequest) {

    throw new ApiError(
      404,
      "Vendor request not found"
    );

  }



  if (vendorRequest.status === "approved") {

    throw new ApiError(
      400,
      "Approved request cannot be rejected"
    );

  }



  return vendorRequestRepository.updateVendorRequest(

    requestId,

    {

      status: "rejected",

      rejectionReason: reason,

      reviewedBy: adminId,

      reviewedAt: new Date(),

    }

  );

};





/*                      Delete Vendor Request                                 */

const deleteVendorRequest = async (
  requestId,
  adminId
) => {

  const vendorRequest =
    await vendorRequestRepository.findById(
      requestId
    );



  if (!vendorRequest) {

    throw new ApiError(
      404,
      "Vendor request not found"
    );

  }



  if (vendorRequest.isDeleted) {

    throw new ApiError(
      400,
      "Vendor request already deleted"
    );

  }



  return vendorRequestRepository.updateVendorRequest(

    requestId,

    {

      isDeleted: true,

      deletedAt: new Date(),

      reviewedBy: adminId,

    }

  );

};





/*                     Restore Vendor Request                                 */

const restoreVendorRequest = async (
  requestId,
  adminId
) => {

  const vendorRequest =
    await vendorRequestRepository.findByIdIncludingDeleted(requestId);



  if (!vendorRequest) {

    throw new ApiError(
      404,
      "Vendor request not found"
    );

  }



  if (!vendorRequest.isDeleted) {

    throw new ApiError(
      400,
      "Vendor request is not deleted"
    );

  }



  return vendorRequestRepository.updateVendorRequest(

    requestId,

    {

      isDeleted: false,

      deletedAt: null,

      reviewedBy: adminId,

    }

  );

};





/*                              Export                                        */

export default {

  submitVendorRequest,

  getMyRequest,

  hasPendingRequest,

  hasApprovedRequest,

  getVendorRequestById,

  getAllVendorRequests,

  updateVendorRequest,

  uploadDocuments,

  isRequestOwner,

  markUnderReview,

  approveVendorRequest,

  rejectVendorRequest,

  deleteVendorRequest,

  restoreVendorRequest,

};