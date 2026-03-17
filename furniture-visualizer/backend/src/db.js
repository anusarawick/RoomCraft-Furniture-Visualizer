import mongoose from 'mongoose'

export const connectToDatabase = async (mongoUri) => {
  await mongoose.connect(mongoUri)
}
