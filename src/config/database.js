import mongoose from 'mongoose'
import env from './env.js'
import { logger } from '../helpers/index.js'
import Wing from '../models/wing.model.js'
import Floor from '../models/floor.model.js'

const connectDatabase = async () => {
  try {
    mongoose.set('strictQuery', true)

    const connection = await mongoose.connect(env.mongodbUri)

    logger.info(`MongoDB connected: ${connection.connection.host}`)

    await Promise.all([Wing.syncIndexes(), Floor.syncIndexes()])

    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error', { message: error.message })
    })

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected')
    })

    return connection
  } catch (error) {
    logger.error('MongoDB connection failed', { message: error.message })
    process.exit(1)
  }
}

const disconnectDatabase = async () => {
  await mongoose.disconnect()
  logger.info('MongoDB disconnected gracefully')
}

export { connectDatabase, disconnectDatabase }
