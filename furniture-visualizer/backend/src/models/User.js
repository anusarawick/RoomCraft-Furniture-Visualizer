import mongoose from 'mongoose'

const { Schema, model } = mongoose

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: 'Designer',
      trim: true,
    },
    accountType: {
      type: String,
      enum: ['customer', 'admin'],
      default: 'customer',
      index: true,
    },
    purchasedTemplates: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: 'Design',
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString()
        ret.purchasedTemplates = Array.isArray(ret.purchasedTemplates)
          ? ret.purchasedTemplates.map((value) => value.toString())
          : []
        delete ret._id
        delete ret.__v
        delete ret.passwordHash
        return ret
      },
    },
  },
)

export const User = model('User', userSchema)
