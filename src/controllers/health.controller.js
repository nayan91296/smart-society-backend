import { HTTP_STATUS, MESSAGES } from '../constants/index.js'
import { ApiResponse, asyncHandler } from '../utils/index.js'
import healthService from '../services/health.service.js'

class HealthController {
  getHealth = asyncHandler(async (_req, res) => {
    const health = healthService.getHealthStatus()

    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, health, MESSAGES.HEALTH_OK))
  })
}

export default new HealthController()
