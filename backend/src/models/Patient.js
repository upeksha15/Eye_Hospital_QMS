import mongoose from 'mongoose';

const PatientSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    nic: { type: String, required: true, unique: true, trim: true },
    dateOfBirth: { type: Date, required: true },
    contactNumber: { type: String, trim: true },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

const Patient = mongoose.model('Patient', PatientSchema);

export default Patient;
