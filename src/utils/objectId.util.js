import mongoose from 'mongoose'

export const isValidObjectId = (value) => {
  if (value === undefined || value === null || value === '') return false
  return mongoose.isValidObjectId(value)
}
