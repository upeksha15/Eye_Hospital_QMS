import mongoose from 'mongoose';

const AnnouncementSchema = new mongoose.Schema(
  {
    message: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId },
  },
  { timestamps: true }
);

const Announcement = mongoose.model('Announcement', AnnouncementSchema);

export default Announcement;
