import mongoose from "mongoose";

const { Schema } = mongoose;


/*                         Product Variant Schema                             */


const productVariantSchema = new Schema(
  {
    
    /* Product Reference                                                      */
    

    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },

    
    /* Variant Identification                                                 */
    

    sku: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    barcode: {
      type: String,
      trim: true,
      sparse: true,
      index: true,
    },

    
    /* Variant Attributes                                                     */
    

    attributes: {
      type: Map,
      of: String,
      default: {},
    },

    /*
      Example:

      {
        color: "Black",
        size: "XL",
        storage: "128GB"
      }

    */

    
    /* Pricing                                                                */
    

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    compareAtPrice: {
      type: Number,
      default: null,
      min: 0,
    },

    costPrice: {
      type: Number,
      default: null,
      min: 0,
    },

    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    
    /* Inventory                                                              */
    

    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    reservedStock: {
      type: Number,
      default: 0,
      min: 0,
    },

    lowStockThreshold: {
      type: Number,
      default: 5,
      min: 0,
    },

    
    /* Media                                                                  */
    

    images: [
      {
        url: {
          type: String,
          required: true,
        },

        publicId: {
          type: String,
        },
      },
    ],

    
    /* Variant Status                                                         */
    

    isActive: {
      type: Boolean,
      default: true,
    },

    isDefault: {
      type: Boolean,
      default: false,
    },

    
    /* Soft Delete                                                            */
    

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },

  {
    timestamps: true,
  },
);


/*                             Indexes                                        */


productVariantSchema.index({
  product: 1,
  sku: 1,
});

productVariantSchema.index({
  product: 1,
  isActive: 1,
});

productVariantSchema.index({
  "attributes.color": 1,
});


/*                         Virtuals                                          */


productVariantSchema.virtual("availableStock").get(function () {
  return this.stock - this.reservedStock;
});


/*                         JSON Config                                        */


productVariantSchema.set("toJSON", {
  virtuals: true,
});

productVariantSchema.set("toObject", {
  virtuals: true,
});

const ProductVariant = mongoose.model("ProductVariant", productVariantSchema);

export default ProductVariant;
