import RolePolicy from '../models/rolePolicy.model.js'
import BaseRepository from './base.repository.js'

class RolePolicyRepository extends BaseRepository {
  constructor() {
    super(RolePolicy)
  }

  async findBySocietyAndRole(societyId, role) {
    return this.model.findOne({ society: societyId, role, isDeleted: false })
  }

  async listBySociety(societyId) {
    return this.model.find({ society: societyId, isDeleted: false })
  }

  async upsert(societyId, role, { grants, denies, updatedBy }) {
    return this.model.findOneAndUpdate(
      { society: societyId, role, isDeleted: false },
      {
        $set: {
          grants: grants || [],
          denies: denies || [],
          updatedBy,
        },
        $setOnInsert: {
          society: societyId,
          role,
          isDeleted: false,
        },
      },
      { new: true, upsert: true, runValidators: true },
    )
  }
}

export default new RolePolicyRepository()
