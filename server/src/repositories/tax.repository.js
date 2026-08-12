import Tax from "../models/Tax.model.js";

/*                               Create Tax                                   */

const createTax = async (taxData, session = null) => {
  const [tax] = await Tax.create([taxData], {
    session,
  });

  return tax;
};

/*                            Find Tax By Id                                  */

const findTaxById = async (taxId) => {
  return Tax.findOne({
    _id: taxId,
    isDeleted: false,
  })
    .populate("category", "name slug")
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email");
};

/*                           Find Tax By Code                                 */

const findTaxByCode = async (code) => {
  return Tax.findOne({
    code,
    isDeleted: false,
  });
};

/*                          Find Active Taxes                                 */

const findActiveTaxes = async (filter = {}) => {
  const now = new Date();

  return Tax.find({
    isDeleted: false,
    isActive: true,
    $and: [
      {
        $or: [
          {
            effectiveFrom: null,
          },
          {
            effectiveFrom: {
              $lte: now,
            },
          },
        ],
      },
      {
        $or: [
          {
            effectiveTo: null,
          },
          {
            effectiveTo: {
              $gte: now,
            },
          },
        ],
      },
    ],
    ...filter,
  })
    .populate("category", "name slug")
    .sort({
      priority: 1,
      rate: -1,
    });
};

/*                      Find Taxes By Category                                */

const findTaxesByCategory = async (categoryId) => {
  return Tax.find({
    category: categoryId,
    isDeleted: false,
    isActive: true,
  }).sort({
    priority: 1,
  });
};

/*                     Find Taxes By Location                                 */

const findTaxesByLocation = async (country, state) => {
  return Tax.find({
    country,
    state: {
      $in: [state, "ALL"],
    },
    isDeleted: false,
    isActive: true,
  }).sort({
    priority: 1,
  });
};

/*                           Find All Taxes                                   */

const findTaxes = async (filter = {}, options = {}) => {
  const {
    page = 1,
    limit = 20,
    sort = {
      createdAt: -1,
    },
  } = options;

  const skip = (page - 1) * limit;

  const taxes = await Tax.find({
    isDeleted: false,
    ...filter,
  })
    .populate("category", "name slug")
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email")
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await Tax.countDocuments({
    isDeleted: false,
    ...filter,
  });

  return {
    taxes,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/*                              Update Tax                                    */

const updateTax = async (taxId, updateData, session = null) => {
  return Tax.findByIdAndUpdate(taxId, updateData, {
    new: true,
    runValidators: true,
    session,
  });
};

/*                           Soft Delete Tax                                  */

const softDeleteTax = async (taxId) => {
  return Tax.findByIdAndUpdate(
    taxId,
    {
      isDeleted: true,
      deletedAt: new Date(),
    },
    {
      new: true,
    },
  );
};

/*                             Count Taxes                                    */

const countTaxes = async (filter = {}) => {
  return Tax.countDocuments({
    isDeleted: false,
    ...filter,
  });
};

export default {
  createTax,
  findTaxById,
  findTaxByCode,
  findActiveTaxes,
  findTaxesByCategory,
  findTaxesByLocation,
  findTaxes,
  updateTax,
  softDeleteTax,
  countTaxes,
};
