import env from '../config/env.js'

class HealthService {
  getHealthStatus() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: env.nodeEnv,
    }
  }
}

export default new HealthService()
