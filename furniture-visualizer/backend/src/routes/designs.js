import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import { Design } from '../models/Design.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { normalizeDesignPayload } from '../utils/serialize.js'

const router = express.Router()

router.use(requireAuth)

router.get('/', asyncHandler(async (req, res) => {
  const designs = await Design.find({ user: req.auth.userId }).sort({ updatedAt: -1 })
  return res.json(designs.map((design) => design.toJSON()))
}))

router.post('/', asyncHandler(async (req, res) => {
  const payload = normalizeDesignPayload(req.body)
  const design = await Design.create({
    ...payload,
    user: req.auth.userId,
  })

  return res.status(201).json(design.toJSON())
}))

router.get('/:designId', asyncHandler(async (req, res) => {
  const design = await Design.findOne({
    _id: req.params.designId,
    user: req.auth.userId,
  })

  if (!design) {
    return res.status(404).json({ message: 'Design not found.' })
  }

  return res.json(design.toJSON())
}))

router.put('/:designId', asyncHandler(async (req, res) => {
  const design = await Design.findOne({
    _id: req.params.designId,
    user: req.auth.userId,
  })

  if (!design) {
    return res.status(404).json({ message: 'Design not found.' })
  }

  Object.assign(design, normalizeDesignPayload(req.body))
  await design.save()

  return res.json(design.toJSON())
}))

router.delete('/:designId', asyncHandler(async (req, res) => {
  const deleted = await Design.findOneAndDelete({
    _id: req.params.designId,
    user: req.auth.userId,
  })

  if (!deleted) {
    return res.status(404).json({ message: 'Design not found.' })
  }

  return res.status(204).send()
}))

export default router
