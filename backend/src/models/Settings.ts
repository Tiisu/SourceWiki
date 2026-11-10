import mongoose, { Document, Schema } from 'mongoose';

export interface ISettings extends Document {
  siteName: string;
  verificationPoints: number;
  maxSubmissionsPerDay: number;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>({
  siteName: { type: String, default: 'WikiSourceVerifier' },
  verificationPoints: { type: Number, default: 10 },
  maxSubmissionsPerDay: { type: Number, default: 5 },
  updatedAt: { type: Date, default: Date.now },
});

export const SettingsModel = mongoose.model<ISettings>('Settings', SettingsSchema);