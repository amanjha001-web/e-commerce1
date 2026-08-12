import Vendor from "../models/Vendor.model.js";

/*                              Create Vendor                                 */

const createVendor = async (vendorData, session = null) => {
  const vendor = await Vendor.create([vendorData], {
    session,
  });

  return vendor[0];
};

/*                           Get Vendor By Id                                 */

const getVendorById = async (vendorId) => {
  return await Vendor.findById(vendorId)
    .populate("user", "-password -refreshToken")
    .lean();
};

/*                        Get Vendor By User Id                               */

const getVendorByUserId = async (userId) => {
  return await Vendor.findOne({
    user: userId,
    deletedAt: null,
  })
    .populate("user", "-password -refreshToken")
    .lean();
};

/*                         Get Vendor By Slug                                 */

const getVendorBySlug = async (shopSlug) => {
  return await Vendor.findOne({
    shopSlug,
    deletedAt: null,
  })
    .populate("user", "-password -refreshToken")
    .lean();
};

/*                          Get Vendor By Email                               */

const getVendorByEmail = async (email) => {
  return await Vendor.findOne({
    email: email.toLowerCase(),
    deletedAt: null,
  }).lean();
};

/*                          Get All Vendors                                   */

const getAllVendors = async (filter = {}, options = {}) => {
  const {
    page = 1,
    limit = 10,
    sort = {
      createdAt: -1,
    },
  } = options;

  const skip = (page - 1) * limit;

  const query = {
    ...filter,
    deletedAt: null,
  };

  const [vendors, totalVendors] = await Promise.all([
    Vendor.find(query)
      .populate("user", "-password -refreshToken")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),

    Vendor.countDocuments(query),
  ]);

  return {
    vendors,

    pagination: {
      totalVendors,
      totalPages: Math.ceil(totalVendors / limit),
      currentPage: page,
      limit,
      hasNextPage: page < Math.ceil(totalVendors / limit),
      hasPrevPage: page > 1,
    },
  };
};

/*                       Get Approved Vendors                                 */

const getApprovedVendors = async () => {
  return await Vendor.find({
    isApproved: true,
    isActive: true,
    deletedAt: null,
  })
    .populate("user", "-password -refreshToken")
    .sort({
      createdAt: -1,
    })
    .lean();
};

/*                           Update Vendor                                    */

const updateVendor = async (vendorId, updateData, session = null) => {
  return await Vendor.findByIdAndUpdate(vendorId, updateData, {
    new: true,
    runValidators: true,
    session,
  }).populate("user", "-password -refreshToken");
};
/*                          Approve Vendor                                    */

const approveVendor = async (
  vendorId,
  session = null,
) => {
  return await Vendor.findByIdAndUpdate(
    vendorId,
    {
      isApproved: true,
    },
    {
      new: true,
      runValidators: true,
      session,
    },
  ).populate(
    "user",
    "-password -refreshToken",
  );
};

/*                          Verify Vendor                                     */

const verifyVendor = async (
  vendorId,
  session = null,
) => {
  return await Vendor.findByIdAndUpdate(
    vendorId,
    {
      isVerified: true,
    },
    {
      new: true,
      runValidators: true,
      session,
    },
  ).populate(
    "user",
    "-password -refreshToken",
  );
};

/*                        Activate Vendor                                     */

const activateVendor = async (
  vendorId,
  session = null,
) => {
  return await Vendor.findByIdAndUpdate(
    vendorId,
    {
      isActive: true,
    },
    {
      new: true,
      runValidators: true,
      session,
    },
  ).populate(
    "user",
    "-password -refreshToken",
  );
};

/*                       Deactivate Vendor                                    */

const deactivateVendor = async (
  vendorId,
  session = null,
) => {
  return await Vendor.findByIdAndUpdate(
    vendorId,
    {
      isActive: false,
    },
    {
      new: true,
      runValidators: true,
      session,
    },
  ).populate(
    "user",
    "-password -refreshToken",
  );
};

/*                         Soft Delete Vendor                                 */

const deleteVendor = async (
  vendorId,
  session = null,
) => {
  return await Vendor.findByIdAndUpdate(
    vendorId,
    {
      isActive: false,
      deletedAt: new Date(),
    },
    {
      new: true,
      runValidators: true,
      session,
    },
  );
};

/*                          Count Vendors                                     */

const countVendors = async (
  filter = {},
) => {
  return await Vendor.countDocuments({
    ...filter,
    deletedAt: null,
  });
};

/*                     Count Approved Vendors                                 */

const countApprovedVendors =
  async () => {
    return await Vendor.countDocuments({
      isApproved: true,
      deletedAt: null,
    });
  };

/*                     Count Pending Vendors                                  */

const countPendingVendors =
  async () => {
    return await Vendor.countDocuments({
      isApproved: false,
      deletedAt: null,
    });
  };

/*                                  Export                                    */

export default {
  createVendor,

  getVendorById,
  getVendorByUserId,
  getVendorBySlug,
  getVendorByEmail,

  getAllVendors,
  getApprovedVendors,

  updateVendor,

  approveVendor,
  verifyVendor,

  activateVendor,
  deactivateVendor,

  deleteVendor,

  countVendors,
  countApprovedVendors,
  countPendingVendors,
};