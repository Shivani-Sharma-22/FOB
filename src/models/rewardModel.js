import mongoose from 'mongoose';

const rewardSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a reward name'],
      trim: true,
      maxlength: [100, 'Name cannot be more than 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
      maxlength: [500, 'Description cannot be more than 500 characters'],
    },
    pointsCost: {
      type: Number,
      required: [true, 'Please provide the points cost'],
      min: [1, 'Points cost must be at least 1'],
    },
    category: {
      type: String,
      required: [true, 'Please specify the reward category'],
      enum: ['Vouchers', 'Discounts', 'Merchandise', 'Recognition', 'Special Access'],
    },
    availability: {
      type: Number,
      default: -1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    expiryDate: {
      type: Date,
    },
    redemptions: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        redeemedAt: {
          type: Date,
          default: Date.now,
        },
        code: {
          type: String,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Reward = mongoose.model('Reward', rewardSchema);

export default Reward;