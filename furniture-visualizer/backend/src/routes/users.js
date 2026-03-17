import bcrypt from 'bcryptjs'
import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import { Design } from '../models/Design.js'
import { User } from '../models/User.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = express.Router()
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.auth.userId)

  if (!user) {
    return res.status(404).json({ message: 'User account not found.' })
  }

  return res.json(user.toJSON())
}))

router.put('/me', requireAuth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.auth.userId)

  if (!user) {
    return res.status(404).json({ message: 'User account not found.' })
  }

  const nextName =
    typeof req.body.name === 'string' && req.body.name.trim()
      ? req.body.name.trim()
      : user.name
  const nextEmail =
    typeof req.body.email === 'string' && req.body.email.trim()
      ? req.body.email.trim().toLowerCase()
      : user.email
  const nextRole =
    typeof req.body.role === 'string' && req.body.role.trim()
      ? req.body.role.trim()
      : user.role
  const currentPassword =
    typeof req.body.currentPassword === 'string' ? req.body.currentPassword : ''
  const nextPassword = typeof req.body.password === 'string' ? req.body.password : ''

  if (!EMAIL_PATTERN.test(nextEmail)) {
    return res.status(400).json({ message: 'Enter a valid email address.' })
  }

  if (nextPassword && nextPassword.length < 8) {
    return res.status(400).json({ message: 'New password must be at least 8 characters.' })
  }

  if (nextPassword && !currentPassword) {
    return res.status(400).json({ message: 'Enter your current password.' })
  }

  const conflictingUser = await User.findOne({
    email: nextEmail,
    _id: { $ne: user._id },
  })
  if (conflictingUser) {
    return res.status(409).json({ message: 'That email is already in use.' })
  }

  user.name = nextName
  user.email = nextEmail
  user.role = nextRole

  if (nextPassword) {
    const matches = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!matches) {
      return res.status(401).json({ message: 'Current password is incorrect.' })
    }
    user.passwordHash = await bcrypt.hash(nextPassword, 10)
  }

  await user.save()

  const designCount = await Design.countDocuments({ user: user._id })

  return res.json({
    ...user.toJSON(),
    stats: {
      designCount,
    },
  })
}))

export default router
