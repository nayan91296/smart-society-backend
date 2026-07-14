import Payment from '../models/payment.model.js'
import BaseRepository from './base.repository.js'
import { PAYMENT_STATUS } from '../constants/enums.js'

class PaymentRepository extends BaseRepository {
  constructor() {
    super(Payment)
  }

  async sumSuccessfulAmount(filter = {}) {
    const result = await this.model.aggregate([
      {
        $match: {
          isDeleted: false,
          status: PAYMENT_STATUS.SUCCESS,
          ...filter,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ])

    return result[0]?.total || 0
  }
}

export default new PaymentRepository()
