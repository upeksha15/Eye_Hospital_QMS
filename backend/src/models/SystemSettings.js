import mongoose from 'mongoose';

const systemSettingsSchema = new mongoose.Schema(
  {
    hospitalName: { type: String, default: 'EYE HOSPITAL — OPD Queue Management' },
    timezone: { type: String, default: 'Asia/Colombo' },
    defaultSlotMinutes: { type: Number, default: 15, min: 5 },
    maxAdvanceBookingDays: { type: Number, default: 60, min: 1 },
    maintenanceMode: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);

export default SystemSettings;
