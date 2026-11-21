import { ApiError } from '../utils/apiError.js';
import { ROLES } from '../constants/roles.constant.js';
import { Product } from '../models/Product.model.js';
import { Order } from '../models/Order.model.js';
import { Vendor } from '../models/Vendor.model.js';

export const checkVendorProductOwnership = async (req, res, next) => {
  if (req.user.role === ROLES.ADMIN || req.user.role === ROLES.SUPER_ADMIN) {
    return next();
  }

  const productId = req.params.productId || req.params.id;
  const product = await Product.findById(productId);

  if (!product) {
    return next(ApiError.notFound('Product not found.'));
  }

  const productOwnerId =
    product.vendorId?._id || product.vendorId || product.vendor?._id || product.vendor;
  const candidateVendorIds = new Set();

  const directVendorId = req.user.vendorId?._id || req.user.vendorId;
  if (directVendorId) {
    candidateVendorIds.add(String(directVendorId));
  }
  if (req.user._id) {
    candidateVendorIds.add(String(req.user._id));
  }

  if (!productOwnerId || !candidateVendorIds.has(String(productOwnerId))) {
    const vendorProfile = await Vendor.findOne({
      $or: [{ userId: req.user._id }, { user: req.user._id }],
    }).select('_id userId user');
    if (vendorProfile?._id) {
      candidateVendorIds.add(String(vendorProfile._id));
    }
  }

  if (!productOwnerId || !candidateVendorIds.has(String(productOwnerId))) {
    return next(ApiError.forbidden('You do not have permission to manage this product.'));
  }

  req.product = product;
  next();
};

export const checkOrderOwnership = async (req, res, next) => {
  if (req.user.role === ROLES.ADMIN || req.user.role === ROLES.SUPER_ADMIN) {
    return next();
  }

  const orderId = req.params.orderId || req.params.id;
  const order = await Order.findById(orderId);

  if (!order) {
    return next(ApiError.notFound('Order not found.'));
  }

  const userId = req.user._id.toString();
  const isCustomerOwner = order.userId.toString() === userId;

  const vendorId = req.user.vendorId?._id?.toString() || req.user.vendorId?.toString();
  const isVendorOwner = vendorId && order.items.some((item) => item.vendorId.toString() === vendorId);

  if (!isCustomerOwner && !isVendorOwner) {
    return next(ApiError.forbidden('You do not have permission to access this order.'));
  }

  req.order = order;
  next();
};

export default { checkVendorProductOwnership, checkOrderOwnership };
