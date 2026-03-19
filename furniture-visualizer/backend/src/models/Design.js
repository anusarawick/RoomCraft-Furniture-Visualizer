import mongoose from 'mongoose'

const { Schema, model } = mongoose

const designSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    kind: {
      type: String,
      enum: ['design', 'template'],
      default: 'design',
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      default: 0,
      min: 0,
    },
    room: {
      type: Schema.Types.Mixed,
      default: null,
    },
    rooms: {
      type: [Schema.Types.Mixed],
      default: [],
    },
    items: {
      type: [Schema.Types.Mixed],
      default: [],
    },
    accentColor: {
      type: String,
      default: '#C97C5D',
    },
    accentOverrideEnabled: {
      type: Boolean,
      default: false,
    },
    globalShade: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString()
        delete ret._id
        delete ret.__v
        delete ret.user
        return ret
      },
    },
  },
)

designSchema.index({ user: 1, updatedAt: -1 })
designSchema.index({ kind: 1, updatedAt: -1 })

export const Design = model('Design', designSchema)
