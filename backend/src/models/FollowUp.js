import mongoose from 'mongoose';

const followUpSchema = new mongoose.Schema(
  {
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: false },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: false },
    patientName: { type: String, trim: true },
    patientNIC: { type: String, trim: true },
    patientPhone: { type: String, trim: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'DoctorRoom', required: true },
    doctorName: { type: String, trim: true },
    intervalValue: { type: Number, required: true, min: 1 },
    intervalType: { type: String, enum: ['days','weeks','months'], default: 'days' },
    recommendedDate: { type: Date, required: true },
    status: { type: String, enum: ['scheduled','cancelled','completed'], default: 'scheduled' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'StaffAccount', required: true },
  },
  { timestamps: true }
);

const FollowUp = mongoose.model('FollowUp', followUpSchema);

export default FollowUp;
