import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const SystemSetting =
  mongoose.models.SystemSetting || mongoose.model('SystemSetting', settingSchema);

export class SettingService {
  async getSettings() {
    const list = await SystemSetting.find();
    const settingsObj = {};
    list.forEach((s) => {
      settingsObj[s.key] = s.value;
    });
    return settingsObj;
  }

  async getSettingByKey(key) {
    const setting = await SystemSetting.findOne({ key });
    return setting ? setting.value : null;
  }

  async updateSetting(key, value) {
    return SystemSetting.findOneAndUpdate(
      { key },
      { value },
      { upsert: true, new: true }
    );
  }

  async updateMultipleSettings(settingsData) {
    const operations = Object.entries(settingsData).map(([key, value]) => ({
      updateOne: {
        filter: { key },
        update: { value },
        upsert: true,
      },
    }));

    if (operations.length > 0) {
      await SystemSetting.bulkWrite(operations);
    }

    return this.getSettings();
  }
}

export const settingService = new SettingService();
export default settingService;
