import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    telegramId: number;
    firstName: string;
    lastName: string;
    username: string;
    role: 'admin' | 'brewer' | 'driver';
}

const userSchema: Schema = new Schema({
    telegramId: { type: Number, required: true, unique: true },
    firstName: { type: String },
    lastName: { type: String },
    username: { type: String },
    role: { type: String, default: 'user' },
});

export default mongoose.model<IUser>('User', userSchema);