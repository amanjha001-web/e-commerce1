
import ApiError from "../utils/ApiError.js";
import addressRepository from "../repositories/address.repository.js";


/*                              Helper Functions                              */


const getAddress = async (userId, addressId) => {
  const address = await addressRepository.getAddressById(addressId);

  if (!address || address.isDeleted) {
    throw new ApiError(404, "Address not found");
  }

  if (address.user.toString() !== userId.toString()) {
    throw new ApiError(403, "You are not authorized to access this address");
  }

  return address;
};


/*                              Validate Address                              */


const validateAddress = (addressData) => {
  const requiredFields = [
    "fullName",
    "phone",
    "addressLine1",
    "city",
    "state",
    "pincode",
  ];

  for (const field of requiredFields) {
    if (
      addressData[field] === undefined ||
      addressData[field] === null ||
      String(addressData[field]).trim() === ""
    ) {
      throw new ApiError(400, `${field} is required`);
    }
  }
};


/*                              Add Address                                   */


const addAddress = async (userId, addressData) => {
  validateAddress(addressData);

  const existingAddresses =
    await addressRepository.getUserAddresses(userId);

  /* ---------------- Maximum Address Limit ---------------- */

  if (existingAddresses.length >= 10) {
    throw new ApiError(400, "Maximum 10 addresses allowed");
  }

  /*
   * Automatically make the first address the default
   * shipping and billing address.
   */

  const isFirstAddress = existingAddresses.length === 0;

  const isDefaultShipping =
    isFirstAddress || addressData.isDefaultShipping === true;

  const isDefaultBilling =
    isFirstAddress || addressData.isDefaultBilling === true;

  /* ---------------- Remove Existing Defaults ---------------- */

  if (isDefaultShipping) {
    await addressRepository.removeDefaultShippingAddress(userId);
  }

  if (isDefaultBilling) {
    await addressRepository.removeDefaultBillingAddress(userId);
  }

  /* ---------------- Create Address ---------------- */

  const address = await addressRepository.createAddress({
    user: userId,
    type: addressData.type || "HOME",
    fullName: addressData.fullName,
    phone: addressData.phone,
    alternatePhone: addressData.alternatePhone,
    addressLine1: addressData.addressLine1,
    addressLine2: addressData.addressLine2,
    landmark: addressData.landmark,
    city: addressData.city,
    state: addressData.state,
    country: addressData.country || "India",
    pincode: addressData.pincode,
    coordinates: addressData.coordinates,
    isDefaultShipping,
    isDefaultBilling,
  });

  return address;
};


/*                           Get My Addresses                                 */


const getAddresses = async (userId) => {
  const addresses =
    await addressRepository.getUserAddresses(userId);

  return {
    totalAddresses: addresses.length,
    addresses,
  };
};


/*                           Update Address                                   */


const updateAddress = async (
  userId,
  addressId,
  addressData,
) => {
  const address = await getAddress(
    userId,
    addressId,
  );

  const allowedFields = [
    "type",
    "fullName",
    "phone",
    "alternatePhone",
    "addressLine1",
    "addressLine2",
    "landmark",
    "city",
    "state",
    "country",
    "pincode",
    "coordinates",
  ];

  const updateData = {};

  for (const field of allowedFields) {
    if (addressData[field] !== undefined) {
      updateData[field] = addressData[field];
    }
  }

  /* ---------------- Default Shipping ---------------- */

  if (addressData.isDefaultShipping === true) {
    await addressRepository.removeDefaultShippingAddress(userId);

    updateData.isDefaultShipping = true;
  }

  /* ---------------- Default Billing ---------------- */

  if (addressData.isDefaultBilling === true) {
    await addressRepository.removeDefaultBillingAddress(userId);

    updateData.isDefaultBilling = true;
  }

  /*
   * Prevent accidentally removing the current default
   * unless another address is explicitly made default.
   */

  if (
    addressData.isDefaultShipping === false &&
    address.isDefaultShipping
  ) {
    throw new ApiError(
      400,
      "Set another default shipping address before removing this one",
    );
  }

  if (
    addressData.isDefaultBilling === false &&
    address.isDefaultBilling
  ) {
    throw new ApiError(
      400,
      "Set another default billing address before removing this one",
    );
  }

  const updatedAddress =
    await addressRepository.updateAddress(
      addressId,
      updateData,
    );

  if (!updatedAddress) {
    throw new ApiError(404, "Address not found");
  }

  return updatedAddress;
};


/*                           Delete Address                                   */


const deleteAddress = async (
  userId,
  addressId,
) => {
  const address = await getAddress(
    userId,
    addressId,
  );

  /*
   * If deleting a default address, another address
   * should automatically become the default.
   */

  const wasDefaultShipping =
    address.isDefaultShipping;

  const wasDefaultBilling =
    address.isDefaultBilling;

  await addressRepository.deleteAddress(
    addressId,
  );

  const remainingAddresses =
    await addressRepository.getUserAddresses(userId);

  if (remainingAddresses.length > 0) {
    const nextAddress = remainingAddresses[0];

    const updateData = {};

    if (wasDefaultShipping) {
      updateData.isDefaultShipping = true;
    }

    if (wasDefaultBilling) {
      updateData.isDefaultBilling = true;
    }

    if (Object.keys(updateData).length > 0) {
      await addressRepository.updateAddress(
        nextAddress._id,
        updateData,
      );
    }
  }

  return {
    message: "Address deleted successfully",
  };
};


/*                        Set Default Address                                 */


const setDefaultAddress = async (
  userId,
  addressId,
) => {
  const address = await getAddress(
    userId,
    addressId,
  );

  /*
   * Based on your current route, this endpoint
   * sets the address as both shipping and billing default.
   */

  await addressRepository.removeDefaultShippingAddress(
    userId,
  );

  await addressRepository.removeDefaultBillingAddress(
    userId,
  );

  const updatedAddress =
    await addressRepository.updateAddress(
      address._id,
      {
        isDefaultShipping: true,
        isDefaultBilling: true,
      },
    );

  return updatedAddress;
};


/*                                  Export                                    */


export default {
  addAddress,
  getAddresses,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};

