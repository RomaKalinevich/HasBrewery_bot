import mongoose from 'mongoose';

const mongoURI = 'mongodb://localhost:27017/your-database-name'; // Замените на ваш URI

mongoose.connect(mongoURI, {
    // Опции для Mongoose 6+
    serverApi: {
        version: require('mongodb').ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
})
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

export default mongoose;