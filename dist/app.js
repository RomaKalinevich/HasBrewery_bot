"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const i18next_fs_backend_1 = __importDefault(require("i18next-fs-backend"));
const db_1 = __importDefault(require("./db"));
const user_1 = __importDefault(require("./models/user"));
const i18next_1 = __importDefault(require("i18next"));
const index_1 = __importDefault(require("./admin/index"));
const token = '7477603293:AAGvjDH7VVcwXSgP_bFPEiUPTVPzqmf4pUE'; // Замените на ваш токен
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield i18next_1.default
            .use(i18next_fs_backend_1.default)
            .init({
            lng: 'ru',
            fallbackLng: 'en',
            backend: {
                loadPath: './locales/{{lng}}.json', // Путь к файлам локализации
            },
        });
        const mongoURI = 'mongodb://localhost:27017/has_db';
        yield db_1.default.connect(mongoURI, {
            serverApi: {
                version: require('mongodb').ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            }
        });
        console.log('MongoDB connected!');
        const bot = new node_telegram_bot_api_1.default(token, { polling: true });
        (0, index_1.default)(bot);
        bot.onText(/\/start/, (msg) => __awaiter(void 0, void 0, void 0, function* () {
            if (!msg.from) {
                console.error('Ошибка: msg.from не определен');
                return;
            }
            const chatId = msg.chat.id;
            const userId = msg.from.id;
            try {
                let user = yield user_1.default.findOne({ telegramId: userId });
                if (!user) {
                    user = new user_1.default({
                        telegramId: userId,
                        firstName: msg.from.first_name,
                        lastName: msg.from.last_name,
                        username: msg.from.username,
                    });
                    yield user.save();
                    bot.sendMessage(chatId, i18next_1.default.t('welcomeMessage'));
                }
                else {
                    let message = 'Выберите действие:';
                    let keyboard;
                    if (user.role === 'admin') {
                        keyboard = {
                            keyboard: [
                                [
                                    { text: i18next_1.default.t('adminStats') },
                                    { text: i18next_1.default.t('adminUsers') }
                                ],
                                [
                                    { text: i18next_1.default.t('adminManageAssortment') },
                                    { text: i18next_1.default.t('adminManageOrders') }
                                ]
                            ],
                        };
                    }
                    else {
                        keyboard = {
                            keyboard: [
                                [{ text: '/driver orders' }, { text: '/driver delivered' }],
                            ],
                        };
                    }
                    bot.sendMessage(chatId, i18next_1.default.t('alreadyRegistered'), { reply_markup: keyboard });
                }
            }
            catch (err) {
                console.error(err);
                bot.sendMessage(chatId, i18next_1.default.t('errorMessage'));
            }
        }));
        console.log('Бот запущен');
    }
    catch (err) {
        console.error('Ошибка подключения к MongoDB:', err);
    }
}))();
