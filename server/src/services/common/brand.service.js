import { Brand } from '../../models/Brand.model.js';
import { Product } from '../../models/Product.model.js';
import { ApiError } from '../../utils/apiError.js';
import { PRODUCT_STATUS } from '../../constants/productStatus.constant.js';
import mongoose from 'mongoose';

export class BrandService {
  async getBrands(params = {}) {
    return Brand.find({ isActive: true }).sort({ name: 1 });
  }

  async getBrandById(id) {
    let brand;
    if (mongoose.Types.ObjectId.isValid(id)) {
      brand = await Brand.findById(id);
    }
    if (!brand) {
      brand = await Brand.findOne({ slug: id });
    }
    if (!brand) {
      throw ApiError.notFound('Brand not found');
    }
    return brand;
  }

  async getBrandProducts(brandId, params = {}) {
    const brand = await this.getBrandById(brandId);
    const filter = {
      brand: brand._id,
      status: PRODUCT_STATUS.PUBLISHED,
      isActive: true,
    };
    return Product.find(filter).populate('category', 'name slug');
  }
}

export const brandService = new BrandService();
export default brandService;
