import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a title for the report'],
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
      maxlength: [500, 'Description cannot be more than 500 characters'],
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        index: '2dsphere',
        required: true,
      },
      address: {
        type: String,
        required: [true, 'Please provide the bridge location address'],
      },
      city: {
        type: String,
        required: [true, 'Please provide the city'],
      },
      state: {
        type: String,
        required: [true, 'Please provide the state'],
      },
    },
    images: [
      {
        type: String,
      },
    ],
    condition: {
      type: String,
      required: [true, 'Please provide the bridge condition'],
      enum: ['Excellent', 'Good', 'Fair', 'Poor', 'Critical'],
    },
    issueType: {
      type: String,
      required: [true, 'Please specify the type of issue'],
      enum: [
        'Structural',
        'Surface',
        'Railing',
        'Lighting',
        'Accessibility',
        'Other',
      ],
    },
    status: {
      type: String,
      enum: ['Pending', 'Under Review', 'In Progress', 'Resolved', 'Rejected'],
      default: 'Pending',
    },
    upvotes: {
      type: Number,
      default: 0,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    adminComments: [
      {
        comment: {
          type: String,
          required: true,
        },
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    publicComments: [
      {
        comment: {
          type: String,
          required: true,
        },
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

reportSchema.index({ 'location.coordinates': '2dsphere' });

const Report = mongoose.model('Report', reportSchema);

export default Report;