import express from 'express'
import { requireAdmin, requireAuth } from '../middleware/auth.js'
import { Design } from '../models/Design.js'
import { User } from '../models/User.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { normalizeDesignPayload } from '../utils/serialize.js'

const router = express.Router()

router.use(requireAuth)

router.get('/', asyncHandler(async (req, res) => {
  const designs = await Design.find({
    user: req.auth.userId,
    kind: 'design',
  }).sort({ updatedAt: -1 })
  return res.json(designs.map((design) => design.toJSON()))
}))

router.post('/', asyncHandler(async (req, res) => {
  const payload = normalizeDesignPayload(req.body)
  const design = await Design.create({
    ...payload,
    user: req.auth.userId,
    kind: 'design',
  })

  return res.status(201).json(design.toJSON())
}))

router.get('/templates', asyncHandler(async (_req, res) => {
  const templates = await Design.find({ kind: 'template' }).sort({ updatedAt: -1 })
  return res.json(templates.map((template) => template.toJSON()))
}))

router.get('/collection', asyncHandler(async (req, res) => {
  if (req.auth.accountType === 'admin') {
    return res.json([])
  }

  const user = await User.findById(req.auth.userId)
  if (!user) {
    return res.status(404).json({ message: 'User account not found.' })
  }

  const templates = await Design.find({
    _id: { $in: user.purchasedTemplates || [] },
    kind: 'template',
  }).sort({ updatedAt: -1 })

  return res.json(templates.map((template) => template.toJSON()))
}))

router.post('/templates', requireAdmin, asyncHandler(async (req, res) => {
  const payload = normalizeDesignPayload(req.body)
  const template = await Design.create({
    ...payload,
    user: req.auth.userId,
    kind: 'template',
  })

  return res.status(201).json(template.toJSON())
}))

router.put('/templates/:designId', requireAdmin, asyncHandler(async (req, res) => {
  const template = await Design.findOne({
    _id: req.params.designId,
    user: req.auth.userId,
    kind: 'template',
  })

  if (!template) {
    return res.status(404).json({ message: 'Template not found.' })
  }

  Object.assign(template, normalizeDesignPayload(req.body))
  await template.save()

  return res.json(template.toJSON())
}))

router.delete('/templates/:designId', requireAdmin, asyncHandler(async (req, res) => {
  const deleted = await Design.findOneAndDelete({
    _id: req.params.designId,
    user: req.auth.userId,
    kind: 'template',
  })

  if (!deleted) {
    return res.status(404).json({ message: 'Template not found.' })
  }

  await User.updateMany(
    { purchasedTemplates: deleted._id },
    { $pull: { purchasedTemplates: deleted._id } },
  )

  return res.status(204).send()
}))

router.post('/templates/:designId/purchase', asyncHandler(async (req, res) => {
  if (req.auth.accountType === 'admin') {
    return res.status(403).json({ message: 'Admin accounts cannot purchase templates.' })
  }

  const [user, template] = await Promise.all([
    User.findById(req.auth.userId),
    Design.findOne({
      _id: req.params.designId,
      kind: 'template',
    }),
  ])

  if (!user) {
    return res.status(404).json({ message: 'User account not found.' })
  }

  if (!template) {
    return res.status(404).json({ message: 'Template not found.' })
  }

  const alreadyPurchased = user.purchasedTemplates.some(
    (templateId) => templateId.toString() === template.id,
  )

  if (!alreadyPurchased) {
    user.purchasedTemplates.push(template._id)
    await user.save()
  }

  return res.json({
    purchased: true,
    template: template.toJSON(),
  })
}))

router.get('/:designId', asyncHandler(async (req, res) => {
  const design = await Design.findOne({
    _id: req.params.designId,
    user: req.auth.userId,
    kind: 'design',
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
    kind: 'design',
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
    kind: 'design',
  })

  if (!deleted) {
    return res.status(404).json({ message: 'Design not found.' })
  }

  return res.status(204).send()
}))

export default router
