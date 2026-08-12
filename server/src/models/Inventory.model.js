import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      unique: true,
    },

    stock: {
      type: Number,
      default: 0,
      min: 0,
    },

    reservedStock: {
      type: Number,
      default: 0,
      min: 0,
    },

    soldStock: {
      type: Number,
      default: 0,
    },

    lowStockLimit: {
      type: Number,
      default: 5,
    },

    warehouse: {
      type: String,
      default: "MAIN",
    },

    status: {
      type: String,
      enum: ["AVAILABLE", "OUT_OF_STOCK"],
      default: "AVAILABLE",
    },
  },
  {
    timestamps: true,
  },
);

inventorySchema.index({
  product: 1,
});

export default mongoose.model("Inventory", inventorySchema);
