import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: { type: String, required: true },
  resource: { type: String, required: true },
  method: String,
  ip: String,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('AuditLog', AuditLogSchema);
