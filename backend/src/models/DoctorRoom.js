import mongoose from "mongoose";

const doctorRoomSchema = new mongoose.Schema(
  {
    doctorName: {
      type: String,
      required: true,
      trim: true,
    },
    room: {
      type: String,
      required: true,
      trim: true,
    },
    specialization: {
      type: String,
      trim: true,
      default: 'General Ophthalmology',
    },
    availability: {
      type: [String],
      default: [],
      // expected values: ['Monday','Tuesday',...]
    },
    // slotLimit removed — system derives total slots from schedule or defaults
    queueLimit: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ['Enabled', 'Paused', 'Disabled'],
      default: 'Disabled',
    },
    queueEnabledAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const DoctorRoom = mongoose.model("DoctorRoom", doctorRoomSchema);

export default DoctorRoom;