import mongoose from 'mongoose';

const mongoURI = 'mongodb://localhost:27017/has_db'; // Или ваш URI с данными для аутентификации

const connectDB = async () => {
    try {
        await mongoose.connect(mongoURI, {
            serverApi: {
                version: require('mongodb').ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            }
        });
        console.log('MongoDB connected!');
    } catch (err) {
        console.error('Ошибка подключения к MongoDB:', err);
        process.exit(1); // Останавливаем приложение при ошибке подключения
    }
};

export default connectDB;