import { Address } from '../../models/Address.model.js';
import { ApiError } from '../../utils/apiError.js';

export class AddressService {
  async getAddresses(userId) {
    return Address.find({ userId }).sort({ isDefault: -1, createdAt: -1 });
  }

  async getAddressById(addressId, userId) {
    const address = await Address.findOne({ _id: addressId, userId });
    if (!address) throw ApiError.notFound('Address not found');
    return address;
  }

  async addAddress(userId, addressData) {
    const normalized = {
      ...addressData,
      street: addressData.street || addressData.addressLine1 || '',
      apartment: addressData.apartment || addressData.addressLine2 || addressData.landmark || '',
      postalCode: addressData.postalCode || addressData.pincode || '',
      userId,
    };

    if (normalized.isDefault) {
      await Address.updateMany({ userId }, { isDefault: false });
    } else {
      const count = await Address.countDocuments({ userId });
      if (count === 0) normalized.isDefault = true;
    }

    return Address.create(normalized);
  }

  async updateAddress(addressId, userId, updateData) {
    const normalized = {
      ...updateData,
    };
    if (updateData.street || updateData.addressLine1) {
      normalized.street = updateData.street || updateData.addressLine1;
    }
    if (updateData.apartment || updateData.addressLine2 || updateData.landmark) {
      normalized.apartment = updateData.apartment || updateData.addressLine2 || updateData.landmark;
    }
    if (updateData.postalCode || updateData.pincode) {
      normalized.postalCode = updateData.postalCode || updateData.pincode;
    }

    if (normalized.isDefault) {
      await Address.updateMany({ userId, _id: { $ne: addressId } }, { isDefault: false });
    }

    const address = await Address.findOneAndUpdate(
      { _id: addressId, userId },
      normalized,
      { new: true, runValidators: true }
    );
    if (!address) throw ApiError.notFound('Address not found');
    return address;
  }

  async deleteAddress(addressId, userId) {
    const address = await Address.findOneAndDelete({ _id: addressId, userId });
    if (!address) throw ApiError.notFound('Address not found');

    if (address.isDefault) {
      const nextAddr = await Address.findOne({ userId });
      if (nextAddr) {
        nextAddr.isDefault = true;
        await nextAddr.save();
      }
    }
    return { message: 'Address deleted successfully' };
  }

  async setDefaultAddress(addressId, userId) {
    await Address.updateMany({ userId }, { isDefault: false });
    const address = await Address.findOneAndUpdate(
      { _id: addressId, userId },
      { isDefault: true },
      { new: true }
    );
    if (!address) throw ApiError.notFound('Address not found');
    return address;
  }

  async getDefaultAddress(userId) {
    const address = await Address.findOne({ userId, isDefault: true });
    return address || null;
  }
}

export const addressService = new AddressService();
export default addressService;
