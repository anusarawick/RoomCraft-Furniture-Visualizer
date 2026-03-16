import bcrypt from 'bcryptjs'
import express from 'express'
import jwt from 'jsonwebtoken'
import { User } from '../models/User.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { sanitizeUser, signJwtForUser } from '../utils/serialize.js'

const router = express.Router()

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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
  })

  return res.status(201).json({
    token: signJwtForUser(jwt, user.id),
    user: sanitizeUser(user),
  })
}))

router.post('/login', asyncHandler(async (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : ''
  const password = typeof req.body.password === 'string' ? req.body.password : ''

  if (!EMAIL_PATTERN.test(email) || !password) {
    return res.status(400).json({ message: 'Email and password are required.' })
  }

  const user = await User.findOne({ email })
  if (!user) {
    return res.status(401).json({ message: 'Incorrect email or password.' })
  }

  const matches = await bcrypt.compare(password, user.passwordHash)
  if (!matches) {
    return res.status(401).json({ message: 'Incorrect email or password.' })
  }

  return res.json({
    token: signJwtForUser(jwt, user.id),
    user: sanitizeUser(user),
  })
}))

export default router
