import mongoose from "mongoose";

const searchHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    keyword: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      minlength: 1,
      maxlength: 100,
    },

    resultCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // How many times user searched same keyword
    searchCount: {
      type: Number,
      default: 1,
      min: 1,
    },

    // Search filters used by user
    filters: {
      category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        default: null,
      },

      brand: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Brand",
        default: null,
      },

      minPrice: {
        type: Number,
        default: null,
      },

      maxPrice: {
        type: Number,
        default: null,
      },
    },

    // Device information for analytics
    deviceInfo: {
      browser: String,
      device: String,
      ip: String,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);


/*                                  Indexes                                   */


// Recent searches
searchHistorySchema.index({
  user: 1,
  createdAt: -1,
});

// Avoid duplicate keyword records
searchHistorySchema.index(
  {
    user: 1,
    keyword: 1,
  },
  {
    unique: true,
  },
);

// Popular searches
searchHistorySchema.index({
  keyword: 1,
  searchCount: -1,
});

export default mongoose.model("SearchHistory", searchHistorySchema);
