import mongoose from 'mongoose';

const QueueTokenSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    tokenNumber: { type: String },
    checkinTime: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['waiting', 'called', 'completed', 'absent'],
      default: 'waiting',
    },
  },
  { timestamps: true }
);

QueueTokenSchema.index({ doctorId: 1, checkinTime: 1 });
QueueTokenSchema.index({ appointmentId: 1 }, { unique: true });

const QueueToken = mongoose.model('QueueToken', QueueTokenSchema);

export default QueueToken;
