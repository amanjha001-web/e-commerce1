import Address from "../models/Address.model.js";

/*                         Create Address                                     */

const createAddress = async (addressData) => {
  return await Address.create(addressData);
};

/*                         Get Address By Id                                  */

const getAddressById = async (addressId) => {
  return await Address.findOne({
    _id: addressId,
    isDeleted: false,
  });
};

/*                         Get User Addresses                                 */

const getUserAddresses = async (userId) => {
  return await Address.find({
    user: userId,
    isDeleted: false,
  }).sort({
    createdAt: -1,
  });
};

/*                         Get Default Address                                */

const getDefaultAddress = async (userId) => {
  return await Address.findOne({
    user: userId,
    $or: [{ isDefaultShipping: true }, { isDefaultBilling: true }],
    isDeleted: false,
  });
};

/*                    Get Default Shipping Address                            */

const getDefaultShippingAddress = async (userId) => {
  return await Address.findOne({
    user: userId,
    isDefaultShipping: true,
    isDeleted: false,
  });
};

/*                    Get Default Billing Address                             */

const getDefaultBillingAddress = async (userId) => {
  return await Address.findOne({
    user: userId,
    isDefaultBilling: true,
    isDeleted: false,
  });
};

/*                         Update Address                                     */

const updateAddress = async (addressId, updateData) => {
  return await Address.findOneAndUpdate(
    {
      _id: addressId,
      isDeleted: false,
    },
    updateData,
    {
      new: true,
      runValidators: true,
    },
  );
};

/*                         Delete Address                                     */

const deleteAddress = async (addressId) => {
  return await Address.findOneAndUpdate(
    {
      _id: addressId,
      isDeleted: false,
    },
    {
      isDeleted: true,
      deletedAt: new Date(),
      isDefaultShipping: false,
      isDefaultBilling: false,
    },
    {
      new: true,
    },
  );
};

/*                         Restore Address                                    */

const restoreAddress = async (addressId) => {
  return await Address.findOneAndUpdate(
    {
      _id: addressId,
    },
    {
      isDeleted: false,
      deletedAt: null,
    },
    {
      new: true,
      runValidators: true,
    },
  );
};

/*                  Remove Default Shipping Address                           */

const removeDefaultShippingAddress = async (userId) => {
  return await Address.updateMany(
    {
      user: userId,
      isDefaultShipping: true,
      isDeleted: false,
    },
    {
      $set: {
        isDefaultShipping: false,
      },
    },
  );
};

/*                   Remove Default Billing Address                           */

const removeDefaultBillingAddress = async (userId) => {
  return await Address.updateMany(
    {
      user: userId,
      isDefaultBilling: true,
      isDeleted: false,
    },
    {
      $set: {
        isDefaultBilling: false,
      },
    },
  );
};

/*                              Export                                        */

export default {
  createAddress,

  getAddressById,

  getUserAddresses,

  getDefaultAddress,

  getDefaultShippingAddress,

  getDefaultBillingAddress,

  updateAddress,

  deleteAddress,

  restoreAddress,

  removeDefaultShippingAddress,

  removeDefaultBillingAddress,
};
