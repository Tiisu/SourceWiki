import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  action: string;
  resource?: string;
  method?: string;
  user?: { id?: string; username?: string } | null;
  details?: any;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
  action: { type: String, required: true },
  resource: { type: String },
  method: { type: String },
  user: {
    id: { type: String },
    username: { type: String },
  },
  details: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
});

export const AuditLogModel = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);