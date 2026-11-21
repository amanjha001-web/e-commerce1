import { ProductVariant } from '../../models/ProductVariant.model.js';
import { Product } from '../../models/Product.model.js';
import { Vendor } from '../../models/Vendor.model.js';
import { ApiError } from '../../utils/apiError.js';

export class VendorVariantService {
  async getVendorContext(userId) {
    const vendor = await Vendor.findOne({ $or: [{ userId }, { user: userId }] });
    if (!vendor) throw ApiError.notFound('Vendor profile not found');
    const legacyRefs = Array.from(
      new Set([vendor._id, vendor.userId, vendor.user, userId].filter(Boolean).map(String))
    );
    return {
      vendorId: vendor._id,
      ownerFilter: { $or: [{ vendorId: vendor._id }, { vendor: { $in: legacyRefs } }] },
    };
  }

  async getVendorId(userId) {
    const { vendorId } = await this.getVendorContext(userId);
    return vendorId;
  }

  async getVariants(userId, productId) {
    const { ownerFilter } = await this.getVendorContext(userId);
    const product = await Product.findOne({ _id: productId, ...ownerFilter });
    if (!product) throw ApiError.notFound('Product not found');

    return ProductVariant.find({ productId, isActive: true });
  }

  async createVariant(userId, productId, variantData) {
    const { ownerFilter } = await this.getVendorContext(userId);
    const product = await Product.findOne({ _id: productId, ...ownerFilter });
    if (!product) throw ApiError.notFound('Product not found');

    const variant = await ProductVariant.create({
      ...variantData,
      productId,
    });

    product.hasVariants = true;
    await product.save();

    return variant;
  }

  async updateVariant(userId, variantId, updateData) {
    const variant = await ProductVariant.findById(variantId);
    if (!variant) throw ApiError.notFound('Variant not found');

    const { ownerFilter } = await this.getVendorContext(userId);
    const product = await Product.findOne({ _id: variant.productId, ...ownerFilter });
    if (!product) throw ApiError.forbidden('You do not own this product');

    return ProductVariant.findByIdAndUpdate(variantId, updateData, { new: true });
  }

  async deleteVariant(userId, variantId) {
    const variant = await ProductVariant.findById(variantId);
    if (!variant) throw ApiError.notFound('Variant not found');

    const { ownerFilter } = await this.getVendorContext(userId);
    const product = await Product.findOne({ _id: variant.productId, ...ownerFilter });
    if (!product) throw ApiError.forbidden('You do not own this product');

    await ProductVariant.findByIdAndDelete(variantId);
    return { message: 'Variant deleted successfully' };
  }
}

export const vendorVariantService = new VendorVariantService();
export default vendorVariantService;
