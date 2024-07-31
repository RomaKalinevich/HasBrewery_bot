import TelegramBot from 'node-telegram-bot-api';
import Backend from 'i18next-fs-backend';
import mongoose from './db';
import User from './models/user';
import i18next from "i18next";
import setupAdminCommands from './admin/index'

const token = '7477603293:AAGvjDH7VVcwXSgP_bFPEiUPTVPzqmf4pUE'; // Замените на ваш токен

(async () => {
    try {

        await i18next
            .use(Backend)
            .init({
                lng: 'ru',
                fallbackLng: 'en',
                backend: {
                    loadPath: './locales/{{lng}}.json', // Путь к файлам локализации
                },
            });

        const mongoURI = 'mongodb://localhost:27017/has_db';
        await mongoose.connect(mongoURI, {
            serverApi: {
                version: require('mongodb').ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            }
        });
        console.log('MongoDB connected!');

        const bot = new TelegramBot(token, {polling: true});

        setupAdminCommands(bot);

        bot.onText(/\/start/, async (msg) => {
            if (!msg.from) {
                console.error('Ошибка: msg.from не определен');
                return;
            }

            const chatId = msg.chat.id;
            const userId = msg.from.id;

            try {
                let user = await User.findOne({telegramId: userId});
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
                    let message = 'Выберите действие:';
                    let keyboard;

                    if (user.role === 'admin') {
                        keyboard = {
                            keyboard: [
                                [
                                    {text: i18next.t('adminStats')},
                                    {text: i18next.t('adminUsers')}
                                ],
                                [
                                    {text: i18next.t('adminManageAssortment')},
                                    {text: i18next.t('adminManageOrders')}
                                ]
                            ],
                        };
                    } else {
                        keyboard = {
                            keyboard: [
                                [{text: '/driver orders'}, {text: '/driver delivered'}],
                            ],
                        };
                    }
                    bot.sendMessage(chatId, i18next.t('alreadyRegistered'), {reply_markup: keyboard});
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