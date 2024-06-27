// src/app.ts
import TelegramBot from 'node-telegram-bot-api';
import User from './models/user';
import connectDB from "./db";
import i18next from "i18next";

const token = '1822684302:AAG8uTXPmn8qJZJ9WCnFV77YwdEsrXJ3Zkc'; // Замените на ваш токен

(async () => { // <-- Асинхронная функция
    try {

        await connectDB();

        console.log('MongoDB connected!');

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
                    bot.sendMessage(chatId, i18next.t('welcomeMessage'));
                } else {
                    bot.sendMessage(chatId, i18next.t('alreadyRegistered'));
                }
            } catch (err) {
                console.error(err);
                bot.sendMessage(chatId, i18next.t('errorMessage'));
            }
        });

        console.log('Бот запущен');

    } catch (err) {
        console.error('Ошибка подключения к MongoDB:', err);
    }
})();