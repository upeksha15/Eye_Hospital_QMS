import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['system', 'user', 'doctor', 'schedule', 'security', 'notice'],
      default: 'system',
    },
    description: { type: String, required: true, trim: true },
    actorId: { type: mongoose.Schema.Types.ObjectId },
    actorName: { type: String, default: '', trim: true },
    meta: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
