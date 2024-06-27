// src/app.ts
import TelegramBot from 'node-telegram-bot-api';
import mongoose from './db';
import User from './models/user';

const token = '1822684302:AAG8uTXPmn8qJZJ9WCnFV77YwdEsrXJ3Zkc'; // Замените на ваш токен
const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, async (msg) => {

    if (!msg.from) {
        console.error('Ошибка: msg.from не определен');
        return; // Прерываем обработку, если msg.from не определен
    }

    const chatId = msg.chat.id;
    const userId = msg.from.id; // Обратите внимание: здесь msg.from точно не undefined, так как Telegram всегда его присылает

    try {
        let user = await User.findOne({ telegramId: userId });

        if (!user) {
            if (msg.from) { // <-- Type guard для msg.from
                user = new User({
                    telegramId: userId,
                    firstName: msg.from.first_name,
                    lastName: msg.from.last_name,
                    username: msg.from.username,
                });

                await user.save();
                bot.sendMessage(chatId, 'Добро пожаловать! Вы зарегистрированы.');
            } else {
                // Обработка ситуации, когда msg.from не определен (что маловероятно)
                console.error('Ошибка: msg.from не определен');
                bot.sendMessage(chatId, 'Произошла ошибка при регистрации. Попробуйте позже.');
            }
        } else {
            bot.sendMessage(chatId, 'Вы уже зарегистрированы!');
        }
    } catch (err) {
        console.error(err);
        bot.sendMessage(chatId, 'Произошла ошибка!');
    }
});

console.log('Бот запущен');