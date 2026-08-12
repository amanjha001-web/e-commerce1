import VendorRequest from "../models/VendorRequest.model.js";

/*                      Create Vendor Request                                 */

const createVendorRequest = async (requestData, session = null) => {
  const options = session ? { session } : {};

  const [vendorRequest] = await VendorRequest.create([requestData], options);

  return vendorRequest;
};

/*                         Find By Id                                         */

const findById = async (requestId) => {
  return VendorRequest.findOne({
    _id: requestId,

    isDeleted: false,
  })

    .populate("user", "fullName email avatar role")

    .populate("reviewedBy", "fullName email");
};


const findByIdIncludingDeleted = async (requestId) => {
  return VendorRequest.findById(requestId)
    .populate("user", "fullName email avatar role")
    .populate("reviewedBy", "fullName email");
};

/*                         Find By User                                       */

const findByUser = async (userId) => {
  return VendorRequest.findOne({
    user: userId,

    isDeleted: false,
  })

    .populate("reviewedBy", "fullName email");
};

/*                     Find Pending By User                                   */

const findPendingByUser = async (userId) => {
  return VendorRequest.findOne({
    user: userId,

    status: "pending",

    isDeleted: false,
  });
};

/*                    Find Approved By User                                   */

const findApprovedByUser = async (userId) => {
  return VendorRequest.findOne({
    user: userId,

    status: "approved",

    isDeleted: false,
  });
};

/*                  Find Under Review By User                                */

const findUnderReviewByUser = async (userId) => {
  return VendorRequest.findOne({
    user: userId,

    status: "under_review",

    isDeleted: false,
  });
};

/*                       Count User Requests                                  */

const countUserRequests = async (userId) => {
  return VendorRequest.countDocuments({
    user: userId,

    isDeleted: false,
  });
};
/*                          Find All Requests                                 */

const findAll = async (
  options = {}
) => {

  const {

    page = 1,

    limit = 10,

    status,

    search,

    sort = "-createdAt",

  } = options;



  const filter = {

    isDeleted: false,

  };



  if (status) {

    filter.status = status;

  }



  if (search) {

    filter.$or = [

      {
        shopName: {
          $regex: search,
          $options: "i",
        },
      },

      {
        businessName: {
          $regex: search,
          $options: "i",
        },
      },

      {
        email: {
          $regex: search,
          $options: "i",
        },
      },

    ];

  }



  const skip =
    (page - 1) * limit;



  const [requests, total] =
    await Promise.all([

      VendorRequest.find(filter)

        .populate(
          "user",
          "fullName email"
        )

        .populate(
          "reviewedBy",
          "fullName email"
        )

        .sort(sort)

        .skip(skip)

        .limit(limit)

        .lean(),

      VendorRequest.countDocuments(
        filter
      ),

    ]);



  return {

    requests,

    pagination: {

      total,

      page,

      limit,

      totalPages: Math.ceil(
        total / limit
      ),

      hasNextPage:
        page < Math.ceil(total / limit),

      hasPrevPage:
        page > 1,

    },

  };

};





/*                     Update Vendor Request                                  */

async function updateVendorRequest(requestId,
  updateData,
  session = null) {

  const options = {
    new: true,

    runValidators: true,
  };



  if (session) {

    options.session = session;

  }



  return VendorRequest.findByIdAndUpdate(

    requestId,

    updateData,

    options

  );

}





/*                         Soft Delete                                        */

const softDelete = async (
  requestId,
  session = null
) => {

  const options = {

    new: true,

  };



  if (session) {

    options.session = session;

  }



  return VendorRequest.findByIdAndUpdate(

    requestId,

    {

      isDeleted: true,

      deletedAt: new Date(),

    },

    options

  );

};





/*                           Restore                                          */

const restore = async (
  requestId,
  session = null
) => {

  const options = {

    new: true,

  };



  if (session) {

    options.session = session;

  }



  return VendorRequest.findByIdAndUpdate(

    requestId,

    {

      isDeleted: false,

      deletedAt: null,

    },

    options

  );

};





/*                         Count All                                          */

const countAll = async (
  filter = {}
) => {

  return VendorRequest.countDocuments({

    isDeleted: false,

    ...filter,

  });

};





/*                              Export                                        */

export default {
  createVendorRequest,

  findById,
  findByIdIncludingDeleted,

  findByUser,

  findPendingByUser,

  findApprovedByUser,

  findUnderReviewByUser,

  countUserRequests,

  findAll,

  updateVendorRequest,

  softDelete,

  restore,

  countAll,
};