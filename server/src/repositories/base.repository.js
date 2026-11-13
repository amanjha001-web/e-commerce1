export class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async find(filter = {}, projection = null, options = {}) {
    return this.model.find(filter, projection, options);
  }

  async findOne(filter = {}, projection = null, options = {}) {
    return this.model.findOne(filter, projection, options);
  }

  async findById(id, projection = null, options = {}) {
    return this.model.findById(id, projection, options);
  }

  async create(data) {
    return this.model.create(data);
  }

  async insertMany(dataArray) {
    return this.model.insertMany(dataArray);
  }

  async updateById(id, updateData, options = { new: true, runValidators: true }) {
    return this.model.findByIdAndUpdate(id, updateData, options);
  }

  async updateOne(filter, updateData, options = { new: true, runValidators: true }) {
    return this.model.findOneAndUpdate(filter, updateData, options);
  }

  async updateMany(filter, updateData) {
    return this.model.updateMany(filter, updateData);
  }

  async deleteById(id) {
    return this.model.findByIdAndDelete(id);
  }

  async deleteOne(filter) {
    return this.model.findOneAndDelete(filter);
  }

  async count(filter = {}) {
    return this.model.countDocuments(filter);
  }

  async paginate(filter = {}, { page = 1, limit = 10, sort = { createdAt: -1 }, populate = null, select = null } = {}) {
    const skip = (page - 1) * limit;
    let query = this.model.find(filter).sort(sort).skip(skip).limit(limit);

    if (populate) {
      if (Array.isArray(populate)) {
        populate.forEach((p) => {
          query = query.populate(p);
        });
      } else {
        query = query.populate(populate);
      }
    }

    if (select) {
      query = query.select(select);
    }

    const [items, total] = await Promise.all([
      query.exec(),
      this.model.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages,
        hasPrevPage: page > 1,
        hasNextPage: page < totalPages,
      },
    };
  }
}

export default BaseRepository;
