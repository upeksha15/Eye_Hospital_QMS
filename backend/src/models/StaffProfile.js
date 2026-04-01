import mongoose from 'mongoose';

const staffProfileSchema = new mongoose.Schema(
  {
    staff: { type: mongoose.Schema.Types.ObjectId, ref: 'StaffAccount', required: true, unique: true },
    fullName: { type: String, trim: true },
    staffId: { type: String, trim: true },
    contactNumber: { type: String, trim: true, default: '' },
    profileImage: { type: String, trim: true, default: '' },
    dateOfBirth: { type: Date },
    // any other profile-only fields can go here
  },
  { timestamps: true }
);

const StaffProfile = mongoose.model('StaffProfile', staffProfileSchema);

export default StaffProfile;
