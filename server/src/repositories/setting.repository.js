import Setting from "../models/Setting.model.js";

/*                             Create Setting                                 */

const createSetting = async (settingData, session = null) => {
  const [setting] = await Setting.create([settingData], {
    session,
  });

  return setting;
};

/*                           Find Setting By Id                               */

const findSettingById = async (settingId) => {
  return Setting.findOne({
    _id: settingId,
    isDeleted: false,
  }).populate("updatedBy", "name email");
};

/*                           Find Setting By Key                              */

const findSettingByKey = async (key) => {
  return Setting.findOne({
    key: key.toUpperCase(),
    isDeleted: false,
  });
};

/*                            Get Public Settings                             */

const findPublicSettings = async () => {
  return Setting.find({
    isPublic: true,
    isDeleted: false,
  }).sort({
    key: 1,
  });
};

/*                             Get All Settings                               */

const findSettings = async (filter = {}, options = {}) => {
  const {
    page = 1,
    limit = 20,
    sort = {
      createdAt: -1,
    },
  } = options;

  const skip = (page - 1) * limit;

  const settings = await Setting.find({
    isDeleted: false,
    ...filter,
  })
    .populate("updatedBy", "name email")
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await Setting.countDocuments({
    isDeleted: false,
    ...filter,
  });

  return {
    settings,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/*                            Update Setting                                  */

const updateSetting = async (settingId, updateData, session = null) => {
  return Setting.findByIdAndUpdate(settingId, updateData, {
    new: true,
    runValidators: true,
    session,
  });
};

/*                           Update By Key                                    */

const updateSettingByKey = async (key, updateData) => {
  return Setting.findOneAndUpdate(
    {
      key: key.toUpperCase(),
      isDeleted: false,
    },
    updateData,
    {
      new: true,
      runValidators: true,
    },
  );
};

/*                            Soft Delete                                     */

const softDeleteSetting = async (settingId) => {
  return Setting.findByIdAndUpdate(
    settingId,
    {
      isDeleted: true,
      deletedAt: new Date(),
    },
    {
      new: true,
    },
  );
};

/*                           Count Settings                                   */

const countSettings = async (filter = {}) => {
  return Setting.countDocuments({
    isDeleted: false,
    ...filter,
  });
};

export default {
  createSetting,
  findSettingById,
  findSettingByKey,
  findPublicSettings,
  findSettings,
  updateSetting,
  updateSettingByKey,
  softDeleteSetting,
  countSettings,
};
