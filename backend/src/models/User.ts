import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  country?: string;
  role: 'admin' | 'verifier' | 'contributor';
  points: number;
  badges: string[];
  joinDate: string;
  password?: string;
}

const UserSchema = new Schema<IUser>({
  username: { type: String, required: true, index: true },
  email: { type: String, required: true, unique: true, index: true },
  country: { type: String, default: 'US' },
  role: { type: String, enum: ['admin', 'verifier', 'contributor'], default: 'contributor' },
  points: { type: Number, default: 0 },
  badges: { type: [String], default: [] },
  joinDate: { type: String, default: () => new Date().toISOString().split('T')[0] },
  password: { type: String },
});

export const UserModel = mongoose.model<IUser>('User', UserSchema);