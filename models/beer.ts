import mongoose, { Schema, Document } from 'mongoose';

export interface IBeer extends Document {
    name: string;
}

const beerSchema: Schema = new Schema({
    name: { type: String, required: true, unique: true }, // Наименование пива (уникальное)
});

export default mongoose.model<IBeer>('Beer', beerSchema);