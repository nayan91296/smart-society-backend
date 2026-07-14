import { connectDatabase, disconnectDatabase } from '../config/database.js'
import env from '../config/env.js'
import userRepository from '../repositories/user.repository.js'
import { ROLES } from '../constants/roles.js'
import { logger } from '../helpers/index.js'

const seedSuperAdmin = async () => {
  await connectDatabase()

  const existing = await userRepository.findByEmail(env.superAdmin.email)

  if (existing) {
    logger.info(`Super Admin already exists: ${env.superAdmin.email}`)
    await disconnectDatabase()
    process.exit(0)
  }

  await userRepository.create({
    firstName: 'Super',
    lastName: 'Admin',
    email: env.superAdmin.email,
    password: env.superAdmin.password,
    role: ROLES.SUPER_ADMIN,
  })

  logger.info(`Super Admin created: ${env.superAdmin.email}`)
  await disconnectDatabase()
  process.exit(0)
}

seedSuperAdmin().catch(async (error) => {
  logger.error('Failed to seed Super Admin', { message: error.message })
  await disconnectDatabase().catch(() => {})
  process.exit(1)
})
