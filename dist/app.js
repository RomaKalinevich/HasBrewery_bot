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
// src/app.ts
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const user_1 = __importDefault(require("./models/user"));
const token = '1822684302:AAG8uTXPmn8qJZJ9WCnFV77YwdEsrXJ3Zkc'; // Замените на ваш токен
const bot = new node_telegram_bot_api_1.default(token, { polling: true });
bot.onText(/\/start/, (msg) => __awaiter(void 0, void 0, void 0, function* () {
    if (!msg.from) {
        console.error('Ошибка: msg.from не определен');
        return; // Прерываем обработку, если msg.from не определен
    }
    const chatId = msg.chat.id;
    const userId = msg.from.id; // Обратите внимание: здесь msg.from точно не undefined, так как Telegram всегда его присылает
    try {
        let user = yield user_1.default.findOne({ telegramId: userId });
        if (!user) {
            if (msg.from) { // <-- Type guard для msg.from
                user = new user_1.default({
                    telegramId: userId,
                    firstName: msg.from.first_name,
                    lastName: msg.from.last_name,
                    username: msg.from.username,
                });
                yield user.save();
                bot.sendMessage(chatId, 'Добро пожаловать! Вы зарегистрированы.');
            }
            else {
                // Обработка ситуации, когда msg.from не определен (что маловероятно)
                console.error('Ошибка: msg.from не определен');
                bot.sendMessage(chatId, 'Произошла ошибка при регистрации. Попробуйте позже.');
            }
        }
        else {
            bot.sendMessage(chatId, 'Вы уже зарегистрированы!');
        }
    }
    catch (err) {
        console.error(err);
        bot.sendMessage(chatId, 'Произошла ошибка!');
    }
}));
console.log('Бот запущен');
