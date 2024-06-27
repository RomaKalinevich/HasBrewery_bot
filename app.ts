// src/app.ts
import TelegramBot from 'node-telegram-bot-api';
import mongoose from './db';
import User from './models/user';

const token = '1822684302:AAG8uTXPmn8qJZJ9WCnFV77YwdEsrXJ3Zkc'; // Замените на ваш токен

(async () => { // <-- Асинхронная функция
    try {
        const mongoURI = 'mongodb://localhost:27017/has_db'; // Замените на ваш URI
        await mongoose.connect(mongoURI, {
            serverApi: {
                version: require('mongodb').ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            }
        });
        console.log('MongoDB connected!');

        // Запускаем бота только после успешного подключения
        const bot = new TelegramBot(token, { polling: true });

        bot.onText(/\/start/, async (msg) => {
            if (!msg.from) {
                console.error('Ошибка: msg.from не определен');
                return;
            }

            const chatId = msg.chat.id;
            const userId = msg.from.id;

            try {
                let user = await User.findOne({ telegramId: userId });

                if (!user) {
                    user = new User({
                        telegramId: userId,
                        firstName: msg.from.first_name,
                        lastName: msg.from.last_name,
                        username: msg.from.username,
                    });

                    await user.save();
                    bot.sendMessage(chatId, 'Добро пожаловать! Вы зарегистрированы.');
                } else {
                    bot.sendMessage(chatId, 'Вы уже зарегистрированы!');
                }
            } catch (err) {
                console.error(err);
                bot.sendMessage(chatId, 'Произошла ошибка!');
            }
        });

        console.log('Бот запущен');

    } catch (err) {
        console.error('Ошибка подключения к MongoDB:', err);
    }
})(); // <-- Вызываем асинхронную функцию