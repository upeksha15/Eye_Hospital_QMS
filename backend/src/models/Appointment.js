import mongoose from 'mongoose';

const AppointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    appointmentDate: { type: Date, required: true },
    visitReason: {
      type: String,
      enum: [
        'new_consultation',
        'follow_up',
        'post_surgery_review',
        'prescription_renewal',
      ],
      required: true,
    },
    notes: { type: String, default: '' },
    status: {
      type: String,
      enum: ['booked', 'checked_in', 'completed', 'absent', 'cancelled'],
      default: 'booked',
    },
    bookingRef: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);

AppointmentSchema.index({ patientId: 1 });
AppointmentSchema.index({ doctorId: 1, appointmentDate: 1 });
const Appointment = mongoose.model('Appointment', AppointmentSchema);

export default Appointment;
