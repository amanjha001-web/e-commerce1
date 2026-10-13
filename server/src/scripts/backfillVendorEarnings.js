
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";

import Order from "../models/Order.model.js";
import Vendor from "../models/Vendor.model.js";
import VendorEarning from "../models/VendorEarning.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env file is located in the server root.
dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

const MONGO_URI =
  process.env.MONGODB_URI || process.env.MONGO_URI;

const PLATFORM_COMMISSION_RATE = 10;

const getEarningStatus = (order) => {
  if (
    ["Cancelled", "Returned", "Refunded"].includes(order.orderStatus) ||
    ["Failed", "Refunded"].includes(order.paymentStatus)
  ) {
    return "cancelled";
  }

  if (
    order.orderStatus === "Delivered" &&
    (order.paymentMethod === "COD" ||
      order.paymentStatus === "Paid")
  ) {
    return "available";
  }

  return "pending";
};

const backfillVendorEarnings = async () => {
  if (!MONGO_URI) {
    throw new Error(
      "MongoDB URI missing. Add MONGODB_URI or MONGO_URI to server/.env",
    );
  }

  let created = 0;
  let skipped = 0;
  let failed = 0;

  try {
    await mongoose.connect(MONGO_URI);

    console.log("MongoDB connected successfully.");

    const orders = await Order.find({
      items: { $exists: true, $ne: [] },
    }).lean();

    console.log(`Found ${orders.length} orders.`);

    for (const order of orders) {
      for (const item of order.items ?? []) {
        try {
          const vendorUserId = item.vendor?._id ?? item.vendor;
          const productId = item.product?._id ?? item.product;

          if (!vendorUserId || !productId) {
            console.warn(
              `Skipped ${order.orderNumber}: vendor or product is missing.`,
            );
            skipped++;
            continue;
          }

          const vendor = await Vendor.findOne({
            user: vendorUserId,
            deletedAt: null,
          })
            .select("_id")
            .lean();

          if (!vendor) {
            console.warn(
              `Skipped ${order.orderNumber}: vendor profile not found for user ${vendorUserId}.`,
            );
            skipped++;
            continue;
          }

          // Skip an earning already created for this order/vendor/product.
          const existing = await VendorEarning.findOne({
            order: order._id,
            vendor: vendor._id,
            product: productId,
            type: "sale",
          })
            .select("_id")
            .lean();

          if (existing) {
            skipped++;
            continue;
          }

          const grossAmount = Number(item.totalPrice ?? 0);

          if (!Number.isFinite(grossAmount) || grossAmount < 0) {
            console.warn(
              `Skipped ${order.orderNumber}: invalid item total.`,
            );
            skipped++;
            continue;
          }

          const commissionAmount = Number(
            item.platformCommission ??
              (
                (grossAmount * PLATFORM_COMMISSION_RATE) /
                100
              ).toFixed(2),
          );

          const netEarning = Number(
            (grossAmount - commissionAmount).toFixed(2),
          );

          if (
            !Number.isFinite(commissionAmount) ||
            commissionAmount < 0 ||
            netEarning < 0
          ) {
            console.warn(
              `Skipped ${order.orderNumber}: invalid commission/earning.`,
            );
            skipped++;
            continue;
          }

          const status = getEarningStatus(order);

          await VendorEarning.create({
            vendor: vendor._id,
            order: order._id,
            orderItem: null,
            product: productId,

            grossAmount,
            discountAmount: 0,
            taxAmount: 0,
            shippingAmount: 0,
            commissionAmount,
            refundAmount: 0,
            netEarning,

            type: "sale",
            status,
            description: `Earning for order ${order.orderNumber}`,
          });

          created++;

          console.log(
            `Created: ${order.orderNumber} | ` +
              `Vendor: ${vendor._id} | ` +
              `Net earning: ₹${netEarning.toFixed(2)} | ` +
              `Status: ${status}`,
          );
        } catch (error) {
          failed++;

          console.error(
            `Failed for order ${order.orderNumber}:`,
            error.message,
          );
        }
      }
    }

    console.log("\n========== Backfill Summary ==========");
    console.log(`Orders checked: ${orders.length}`);
    console.log(`Earning records created: ${created}`);
    console.log(`Items skipped: ${skipped}`);
    console.log(`Items failed: ${failed}`);
    console.log("======================================");
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
};

backfillVendorEarnings().catch((error) => {
  console.error("Backfill failed:", error.message);
  process.exitCode = 1;
});
