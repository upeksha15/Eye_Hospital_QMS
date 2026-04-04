import mongoose from 'mongoose';

const FeedbackSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
  },
  { timestamps: true }
);

FeedbackSchema.index({ patientId: 1, createdAt: -1 });

const Feedback = mongoose.model('Feedback', FeedbackSchema);

export default Feedback;
