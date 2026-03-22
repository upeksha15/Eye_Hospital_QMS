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
  },
  { timestamps: true }
);

const Doctor = mongoose.model('Doctor', DoctorSchema);

export default Doctor;
