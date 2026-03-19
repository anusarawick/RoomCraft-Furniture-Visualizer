import bcrypt from 'bcryptjs'
import express from 'express'
import jwt from 'jsonwebtoken'
import { User } from '../models/User.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { sanitizeUser, signJwtForUser } from '../utils/serialize.js'

const router = express.Router()

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DEFAULT_ADMIN_USERNAME = (process.env.ADMIN_USERNAME || 'admin').trim().toLowerCase()
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin12345'
const DEFAULT_ADMIN_EMAIL = (
  process.env.ADMIN_EMAIL || `${DEFAULT_ADMIN_USERNAME}@roomcraft.local`
)
  .trim()
  .toLowerCase()
const DEFAULT_ADMIN_NAME = process.env.ADMIN_NAME || 'RoomCraft Admin'

router.post('/register', asyncHandler(async (req, res) => {
  const name =
    typeof req.body.name === 'string' && req.body.name.trim()
      ? req.body.name.trim()
      : 'Designer'
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : ''
  const password = typeof req.body.password === 'string' ? req.body.password : ''
  const role =
    typeof req.body.role === 'string' && req.body.role.trim()
      ? req.body.role.trim()
      : 'Designer'

  if (!EMAIL_PATTERN.test(email)) {
    return res.status(400).json({ message: 'Enter a valid email address.' })
  }

  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters.' })
  }

  const existingUser = await User.findOne({ email })
  if (existingUser) {
    return res.status(409).json({ message: 'An account already exists for this email.' })
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await User.create({
    name,
    email,
    passwordHash,
    role,
    accountType: 'customer',
  })

  return res.status(201).json({
    token: signJwtForUser(jwt, user),
    user: sanitizeUser(user),
  })
}))

router.post('/login', asyncHandler(async (req, res) => {
  const rawIdentifier =
    typeof req.body.identifier === 'string'
      ? req.body.identifier
      : typeof req.body.email === 'string'
        ? req.body.email
        : ''
  const identifier = rawIdentifier.trim().toLowerCase()
  const password = typeof req.body.password === 'string' ? req.body.password : ''
  const isAdminIdentifier =
    identifier === DEFAULT_ADMIN_USERNAME || identifier === DEFAULT_ADMIN_EMAIL

  if (!identifier || !password) {
    return res.status(400).json({ message: 'Email or admin username and password are required.' })
  }

  if (isAdminIdentifier) {
    if (password !== DEFAULT_ADMIN_PASSWORD) {
      return res.status(401).json({ message: 'Incorrect username or password.' })
    }

    const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10)
    const user = await User.findOneAndUpdate(
      { email: DEFAULT_ADMIN_EMAIL },
      {
        $set: {
          name: DEFAULT_ADMIN_NAME,
          email: DEFAULT_ADMIN_EMAIL,
          passwordHash,
          role: 'Administrator',
          accountType: 'admin',
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    )

    return res.json({
      token: signJwtForUser(jwt, user),
      user: sanitizeUser(user),
    })
  }

  if (!EMAIL_PATTERN.test(identifier)) {
    return res.status(400).json({ message: 'Enter a valid email address or use the admin username.' })
  }

  const user = await User.findOne({ email: identifier })
  if (!user) {
    return res.status(401).json({ message: 'Incorrect email or password.' })
  }

  const matches = await bcrypt.compare(password, user.passwordHash)
  if (!matches) {
    return res.status(401).json({ message: 'Incorrect email or password.' })
  }

  return res.json({
    token: signJwtForUser(jwt, user),
    user: sanitizeUser(user),
  })
}))

export default router
