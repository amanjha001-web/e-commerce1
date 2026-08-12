import User from "../models/User.model.js";

/*                              Create User                                   */

const createUser = async (userData, session = null) => {
  const user = await User.create([userData], {
    session,
  });

  return user[0];
};

/*                              Get User By Id                                */

const getUserById = async (userId) => {
 return await User.findOne({
   _id: userId,
   deletedAt: null,
 }).select("-password -refreshToken");
};

/*                           Get User By Email                                */

const getUserByEmail = async (email) => {
  return await User.findOne({
    email: email.toLowerCase(),
    deletedAt: null,
  });
};

/*                         Get User By Username                               */

const getUserByUsername = async (username) => {
  return await User.findOne({
    username: username.toLowerCase(),
    deletedAt: null,
  });
};

/*                            Get All Users                                   */

const getAllUsers = async (filter = {}, options = {}) => {
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

  const [users, totalUsers] = await Promise.all([
    User.find(query)
      .select("-password -refreshToken")
      .sort(sort)
      .skip(skip)
      .limit(limit),

    User.countDocuments(query),
  ]);

  return {
    users,

    pagination: {
      totalUsers,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: page,
      limit,
      hasNextPage: page < Math.ceil(totalUsers / limit),
      hasPrevPage: page > 1,
    },
  };
};
/*                              Update User                                   */

const updateUser = async (userId, updateData, session = null) => {
  return await User.findByIdAndUpdate(userId, updateData, {
    new: true,
    runValidators: true,
    session,
  }).select("-password -refreshToken");
};

/*                        Update Refresh Token                                */

const updateRefreshToken = async (
  userId,
  refreshToken,
  session = null,
) => {
  return await User.findByIdAndUpdate(
    userId,
    {
      refreshToken,
    },
    {
      new: true,
      session,
    },
  );
};

/*                              Verify User                                   */

const verifyUser = async (userId, session = null) => {
  return await User.findByIdAndUpdate(
    userId,
    {
      isVerified: true,
    },
    {
      new: true,
      session,
    },
  ).select("-password -refreshToken");
};

/*                             Block User                                     */

const blockUser = async (userId, isBlocked, session = null) => {
  return await User.findByIdAndUpdate(
    userId,
    {
      isBlocked,
    },
    {
      new: true,
      session,
    },
  ).select("-password -refreshToken");
};

/*                          Soft Delete User                                  */

const deleteUser = async (userId, session = null) => {
  return await User.findByIdAndUpdate(
    userId,
    {
      deletedAt: new Date(),
      isBlocked: true,
    },
    {
      new: true,
      session,
    },
  ).select("-password -refreshToken");
};

/*                            Restore User                                    */

const restoreUser = async (userId, session = null) => {
  return await User.findByIdAndUpdate(
    userId,
    {
      deletedAt: null,
      isBlocked: false,
    },
    {
      new: true,
      session,
    },
  ).select("-password -refreshToken");
};





/*                           Get User By Phone                                */

const getUserByPhone = async (phone) => {
  return await User.findOne({
    phone,
    deletedAt: null,
  });
};

/*                    Get User With Password By Id                            */

const getUserWithPasswordById = async (userId) => {
  return await User.findOne({
    _id: userId,
    deletedAt: null,
  }).select("+password +refreshToken");
};

//get user with password by email
const getUserWithPasswordByEmail = async (email) => {
  return await User.findOne({
    email: email.toLowerCase(),
    deletedAt: null,
  }).select("+password +refreshToken");
};

/*                    Get User By Email Verification Token                   */

const getUserByVerificationToken = async (token) => {
  return await User.findOne({
    emailVerificationToken: token,
    deletedAt: null,
  }).select(
    "+emailVerificationToken +emailVerificationExpires",
  );
};

/*                      Get User By Password Reset Token                     */

const getUserByPasswordResetToken = async (token) => {
  return await User.findOne({
    passwordResetToken: token,
    deletedAt: null,
  }).select(
    "+passwordResetToken +passwordResetExpires",
  );
};


/*                                  Export                                    */

export default {
  createUser,
  getUserById,
  getUserByEmail,
  getUserByUsername,
  getAllUsers,
  updateUser,
  updateRefreshToken,
  verifyUser,
  blockUser,
  deleteUser,
  restoreUser,
  getUserByPhone,
  getUserWithPasswordById,
  getUserWithPasswordByEmail,
  getUserByVerificationToken,
  getUserByPasswordResetToken,
};