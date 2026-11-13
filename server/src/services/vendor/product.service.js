import { Product } from '../../models/Product.model.js';
import { Vendor } from '../../models/Vendor.model.js';
import { Inventory } from '../../models/Inventory.model.js';
import { StockMovement } from '../../models/StockMovement.model.js';
import { ApiError } from '../../utils/apiError.js';
import { slugify, parsePagination } from '../../utils/helpers.js';
import { PRODUCT_STATUS } from '../../constants/productStatus.constant.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../../integrations/cloudinary/cloudinary.client.js';

export class VendorProductService {
  async getVendorId(userId) {
    const vendor = await Vendor.findOne({ userId });
    if (!vendor) throw ApiError.notFound('Vendor profile not found');
    return vendor._id;
  }

  async getVendorProducts(userId, params = {}) {
    const vendorId = await this.getVendorId(userId);
    const { page, limit, skip, sort } = parsePagination(params);

    const filter = { vendorId };
    if (params.status) filter.status = params.status;
    if (params.search) {
      filter.name = { $regex: params.search, $options: 'i' };
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name slug')
        .populate('brand', 'name slug')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Product.countDocuments(filter),
    ]);

    return {
      products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createProduct(userId, productData) {
    const vendorId = await this.getVendorId(userId);

    const baseSlug = slugify(productData.name);
    let slug = baseSlug;
    let counter = 1;
    while (await Product.findOne({ slug })) {
      slug = `${baseSlug}-${counter++}`;
    }

    const product = await Product.create({
      ...productData,
      vendorId,
      slug,
      status: PRODUCT_STATUS.PENDING_APPROVAL, // Must be approved by Admin
    });

    // Initialize inventory record
    await Inventory.create({
      productId: product._id,
      vendorId,
      quantity: product.stock,
    });

    await StockMovement.create({
      productId: product._id,
      vendorId,
      type: 'IN',
      quantity: product.stock,
      previousStock: 0,
      newStock: product.stock,
      reason: 'Initial stock on product creation',
      performedBy: userId,
    });

    return product;
  }

  async updateProduct(userId, productId, updateData) {
    const vendorId = await this.getVendorId(userId);
    const product = await Product.findOne({ _id: productId, vendorId });
    if (!product) throw ApiError.notFound('Product not found or not owned by you');

    if (updateData.name && updateData.name !== product.name) {
      updateData.slug = `${slugify(updateData.name)}-${Math.floor(Math.random() * 1000)}`;
    }

    // Changing key fields resets to pending_approval
    if (updateData.price || updateData.description) {
      updateData.status = PRODUCT_STATUS.PENDING_APPROVAL;
    }

    const updated = await Product.findByIdAndUpdate(productId, updateData, {
      new: true,
      runValidators: true,
    });

    return updated;
  }

  async deleteProduct(userId, productId) {
    const vendorId = await this.getVendorId(userId);
    const product = await Product.findOneAndDelete({ _id: productId, vendorId });
    if (!product) throw ApiError.notFound('Product not found or not owned by you');

    await Inventory.findOneAndDelete({ productId });
    return { message: 'Product deleted successfully' };
  }

  async updateProductStock(userId, productId, stock) {
    const vendorId = await this.getVendorId(userId);
    const product = await Product.findOne({ _id: productId, vendorId });
    if (!product) throw ApiError.notFound('Product not found or not owned by you');

    const prevStock = product.stock;
    product.stock = Number(stock);
    await product.save();

    await Inventory.findOneAndUpdate(
      { productId },
      { quantity: Number(stock), isOutOfStock: Number(stock) === 0 },
      { upsert: true }
    );

    await StockMovement.create({
      productId,
      vendorId,
      type: 'ADJUSTMENT',
      quantity: Number(stock) - prevStock,
      previousStock: prevStock,
      newStock: Number(stock),
      reason: 'Vendor stock update',
      performedBy: userId,
    });

    return product;
  }

  async uploadProductImages(userId, productId, files) {
    const vendorId = await this.getVendorId(userId);
    const product = await Product.findOne({ _id: productId, vendorId });
    if (!product) throw ApiError.notFound('Product not found or not owned by you');

    if (!files || files.length === 0) {
      throw ApiError.badRequest('No files provided');
    }

    const uploadPromises = files.map((file) => uploadToCloudinary(file.buffer, 'products'));
    const results = await Promise.all(uploadPromises);

    const newImages = results.map((res, index) => ({
      url: res.url,
      publicId: res.publicId,
      isDefault: product.images.length === 0 && index === 0,
    }));

    product.images.push(...newImages);
    await product.save();

    return product;
  }

  async deleteProductImage(userId, productId, imageId) {
    const vendorId = await this.getVendorId(userId);
    const product = await Product.findOne({ _id: productId, vendorId });
    if (!product) throw ApiError.notFound('Product not found');

    const imgIndex = product.images.findIndex((img) => img._id.toString() === imageId);
    if (imgIndex === -1) throw ApiError.notFound('Image not found');

    const [removed] = product.images.splice(imgIndex, 1);
    if (removed.publicId) {
      await deleteFromCloudinary(removed.publicId).catch(() => {});
    }

    await product.save();
    return product;
  }
}

export const vendorProductService = new VendorProductService();
export default vendorProductService;
