// src/models/order.ts
import mongoose, { Schema, Document, Types } from 'mongoose';

// Интерфейс для поддокумента Beer
export interface IBeer {
    name: string;
    volume: number;
    kegQuantity: number;
}

// Интерфейс для документа Order
export interface IOrder extends Document {
    clientId: Types.ObjectId; // Ссылка на клиента
    address: string;
    beers: IBeer[];
    date: Date;
}

const beerSchema = new Schema<IBeer>({
    name: { type: String, required: true },
    volume: { type: Number, required: true },
    kegQuantity: { type: Number, required: true },
});

const orderSchema = new Schema<IOrder>({
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    address: { type: String, required: true },
    beers: [beerSchema], // Массив поддокументов Beer
    date: { type: Date, default: Date.now },
});

export default mongoose.model<IOrder>('Order', orderSchema);