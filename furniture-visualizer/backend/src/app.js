import cors from 'cors'
import express from 'express'
import morgan from 'morgan'
import authRoutes from './routes/auth.js'
import designRoutes from './routes/designs.js'
import userRoutes from './routes/users.js'

const parseAllowedOrigins = () =>
  (process.env.CLIENT_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

export const createApp = () => {
  const app = express()
  const allowedOrigins = parseAllowedOrigins()

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
          return callback(null, true)
        }
        return callback(new Error('CORS origin blocked.'))
      },
    }),
  )
  app.use(express.json({ limit: '2mb' }))
  app.use(morgan('dev'))

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true })
  })

  app.use('/api/auth', authRoutes)
  app.use('/api/users', userRoutes)
  app.use('/api/designs', designRoutes)

  app.use((err, _req, res, _next) => {
    const status = err?.name === 'CastError' ? 404 : err?.status || 500
    const message =
      status === 500 ? 'Internal server error.' : err?.message || 'Request failed.'

    if (status === 500) {
      console.error(err)
    }

    res.status(status).json({ message })
  })

  return app
}
