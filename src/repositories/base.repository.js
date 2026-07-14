import ApiError from '../utils/ApiError.js'
import { HTTP_STATUS } from '../constants/index.js'

class BaseRepository {
  constructor(model) {
    this.model = model
  }

  async create(data) {
    return this.model.create(data)
  }

  async findById(id, projection = null, options = {}) {
    return this.model.findById(id, projection, options)
  }

  async findOne(filter, projection = null, options = {}) {
    return this.model.findOne(filter, projection, options)
  }

  async find(filter = {}, projection = null, options = {}) {
    return this.model.find(filter, projection, options)
  }

  async findWithPagination(filter = {}, { page = 1, limit = 10, sort = { createdAt: -1 } } = {}) {
    const skip = (page - 1) * limit

    const [data, total] = await Promise.all([
      this.model.find(filter).sort(sort).skip(skip).limit(limit),
      this.model.countDocuments(filter),
    ])

    return { data, total, page, limit }
  }

  async updateById(id, data, options = { new: true, runValidators: true }) {
    const document = await this.model.findByIdAndUpdate(id, data, options)

    if (!document) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Resource not found')
    }

    return document
  }

  async deleteById(id) {
    const document = await this.model.findByIdAndDelete(id)

    if (!document) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Resource not found')
    }

    return document
  }

  async count(filter = {}) {
    return this.model.countDocuments(filter)
  }

  async exists(filter) {
    return this.model.exists(filter)
  }
}

export default BaseRepository
