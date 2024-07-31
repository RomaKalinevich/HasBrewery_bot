"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const mongoURI = 'mongodb://localhost:27017/has_db'; // Замените на ваш URI
mongoose_1.default.connect(mongoURI, {
    // Опции для Mongoose 6+
    serverApi: {
        version: require('mongodb').ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
})
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));
exports.default = mongoose_1.default;
