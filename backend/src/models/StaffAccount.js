import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const staffAccountSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email'],
    },
    // Optional profile fields used by staff profile UI
    staffId: { type: String, trim: true },
    contactNumber: { type: String, trim: true, default: '' },
    profileImage: { type: String, trim: true, default: '' },
    dateOfBirth: { type: Date },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['admin', 'medical_staff'],
      required: true,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'StaffAccount' },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
    lastSeenAt: { type: Date },
  },
  { timestamps: true }
);

staffAccountSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

const StaffAccount = mongoose.model('StaffAccount', staffAccountSchema);

export default StaffAccount;
