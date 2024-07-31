import mongoose, { Schema, Document } from 'mongoose';

export interface IClient extends Document {
    unp: string;
    companyName: string;
    addresses: string[]; // Массив адресов (точек)
}

const clientSchema: Schema = new Schema({
    unp: { type: String, required: true, unique: true },
    companyName: { type: String, required: true },
    addresses: [{ type: String, required: true }]
});

export default mongoose.model<IClient>('Client', clientSchema);