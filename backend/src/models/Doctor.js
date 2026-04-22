import mongoose from 'mongoose';

const DoctorSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    speciality: { type: String, required: true },
    room: { type: String, required: true },
    initials: { type: String, required: true, maxlength: 3 },
    status: {
      type: String,
      enum: ['available', 'limited', 'full'],
      default: 'available',
    },
    isActive: { type: Boolean, default: true },
    scheduleStart: { type: String, default: '08:00' },
    scheduleEnd: { type: String, default: '14:00' },
    dailyLimit: { type: Number, default: 20, min: 1 },
    availability: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

const Doctor = mongoose.model('Doctor', DoctorSchema);

export default Doctor;
