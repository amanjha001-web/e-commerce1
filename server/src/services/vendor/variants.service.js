import { ProductVariant } from '../../models/ProductVariant.model.js';
import { Product } from '../../models/Product.model.js';
import { Vendor } from '../../models/Vendor.model.js';
import { ApiError } from '../../utils/apiError.js';

export class VendorVariantService {
  async getVendorId(userId) {
    const vendor = await Vendor.findOne({ userId });
    if (!vendor) throw ApiError.notFound('Vendor profile not found');
    return vendor._id;
  }

  async getVariants(userId, productId) {
    const vendorId = await this.getVendorId(userId);
    const product = await Product.findOne({ _id: productId, vendorId });
    if (!product) throw ApiError.notFound('Product not found');

    return ProductVariant.find({ productId, isActive: true });
  }

  async createVariant(userId, productId, variantData) {
    const vendorId = await this.getVendorId(userId);
    const product = await Product.findOne({ _id: productId, vendorId });
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

    const vendorId = await this.getVendorId(userId);
    const product = await Product.findOne({ _id: variant.productId, vendorId });
    if (!product) throw ApiError.forbidden('You do not own this product');

    return ProductVariant.findByIdAndUpdate(variantId, updateData, { new: true });
  }

  async deleteVariant(userId, variantId) {
    const variant = await ProductVariant.findById(variantId);
    if (!variant) throw ApiError.notFound('Variant not found');

    const vendorId = await this.getVendorId(userId);
    const product = await Product.findOne({ _id: variant.productId, vendorId });
    if (!product) throw ApiError.forbidden('You do not own this product');

    await ProductVariant.findByIdAndDelete(variantId);
    return { message: 'Variant deleted successfully' };
  }
}

export const vendorVariantService = new VendorVariantService();
export default vendorVariantService;
