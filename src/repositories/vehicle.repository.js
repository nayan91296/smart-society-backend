import Vehicle from '../models/vehicle.model.js'
import BaseRepository from './base.repository.js'

const flatPopulate = {
  path: 'flat',
  select: 'flatNumber wing floor',
  populate: { path: 'wing', select: 'name code' },
}

const parkingPopulate = {
  path: 'parking',
  select: 'slotNumber type status wing assignedFlat',
}

class VehicleRepository extends BaseRepository {
  constructor() {
    super(Vehicle)
  }

  async search({ societyId, filter = {}, page = 1, limit = 10, sort = { createdAt: -1 } } = {}) {
    const skip = (page - 1) * limit
    const query = { ...filter, society: societyId, isDeleted: false }

    const [data, total] = await Promise.all([
      this.model
        .find(query)
        .populate(flatPopulate)
        .populate(parkingPopulate)
        .populate('member', 'firstName lastName phone email')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      this.model.countDocuments(query),
    ])

    return { data, total, page, limit }
  }

  async findInSociety(id, societyId) {
    return this.model
      .findOne({ _id: id, society: societyId, isDeleted: false })
      .populate(flatPopulate)
      .populate(parkingPopulate)
      .populate('member', 'firstName lastName phone email')
  }

  async findByNumber(societyId, vehicleNumber) {
    return this.model.findOne({
      society: societyId,
      vehicleNumber: vehicleNumber.toUpperCase(),
      isDeleted: false,
    })
  }
}

export default new VehicleRepository()
