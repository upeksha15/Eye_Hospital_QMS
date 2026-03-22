import mongoose from 'mongoose';

const DailySlotSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    slotDate: { type: Date, required: true },
    totalSlots: { type: Number, required: true },
    bookedCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

DailySlotSchema.index({ doctorId: 1, slotDate: 1 }, { unique: true });

const DailySlot = mongoose.model('DailySlot', DailySlotSchema);

export default DailySlot;
