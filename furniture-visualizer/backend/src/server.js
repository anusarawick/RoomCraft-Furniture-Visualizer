import dotenv from 'dotenv'
import { createApp } from './app.js'
import { connectToDatabase } from './db.js'

dotenv.config()

const port = Number(process.env.PORT) || 4000
const mongoUri = process.env.MONGODB_URI

if (!mongoUri) {
  throw new Error('MONGODB_URI is required.')
}

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required.')
}

await connectToDatabase(mongoUri)

const app = createApp()

app.listen(port, () => {
  console.log(`RoomCraft API listening on port ${port}`)
})
