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
    slotLimit: {
      type: Number,
      required: true,
      min: 1,
    },
    queueLimit: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { timestamps: true }
);

const DoctorRoom = mongoose.model("DoctorRoom", doctorRoomSchema);

export default DoctorRoom;