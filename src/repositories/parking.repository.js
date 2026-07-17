import mongoose from 'mongoose'
import Parking from '../models/parking.model.js'
import BaseRepository from './base.repository.js'

const vehiclePopulate = {
  path: 'assignedVehicle',
  select: 'vehicleNumber type make model color flat member parking',
}

const flatPopulate = {
  path: 'assignedFlat',
  select: 'flatNumber wing floor',
  populate: { path: 'wing', select: 'name code' },
}

class ParkingRepository extends BaseRepository {
  constructor() {
    super(Parking)
  }

  async search({ societyId, filter = {}, page = 1, limit = 10, sort = { slotNumber: 1 } } = {}) {
    const skip = (page - 1) * limit
    const query = { ...filter, society: societyId, isDeleted: false }

    const [data, total] = await Promise.all([
      this.model
        .find(query)
        .populate(vehiclePopulate)
        .populate(flatPopulate)
        .populate('wing', 'name code')
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
      .populate(vehiclePopulate)
      .populate(flatPopulate)
      .populate('wing', 'name code')
  }

  async findBySlot(societyId, slotNumber) {
    return this.model.findOne({
      society: societyId,
      slotNumber: slotNumber.toUpperCase(),
      isDeleted: false,
    })
  }

  async aggregateStatusCounts(societyId) {
    return this.model.aggregate([
      {
        $match: {
          society: new mongoose.Types.ObjectId(societyId),
          isDeleted: false,
        },
      },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ])
  }
}

export default new ParkingRepository()
