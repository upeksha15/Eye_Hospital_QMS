import mongoose from 'mongoose';

const staffProfileSchema = new mongoose.Schema(
  {
    staff: { type: mongoose.Schema.Types.ObjectId, ref: 'StaffAccount', required: true, unique: true },
    fullName: { type: String, trim: true, minlength: 2 },
    staffId: { type: String, trim: true, unique: true, sparse: true },
    contactNumber: {
      type: String,
      trim: true,
      default: '',
      validate: {
        validator: function (v) {
          if (!v) return true; // allow empty
          // Accept formats: local 0XXXXXXXXX (10 digits) or international +94XXXXXXXXX
          return /^(?:\+94|0)?\d{9}$/.test(v);
        },
        message: 'Invalid contact number format',
      },
    },
    profileImage: { type: String, trim: true, default: '' },
    dateOfBirth: {
      type: Date,
      validate: {
        validator: function (d) {
          if (!d) return true;
          return d <= new Date();
        },
        message: 'Date of birth cannot be in the future',
      },
    },
    // any other profile-only fields can go here
  },
  { timestamps: true }
);

// Ensure index for staffId (sparse unique): created via schema option above

const StaffProfile = mongoose.model('StaffProfile', staffProfileSchema);

export default StaffProfile;
