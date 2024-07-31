import TelegramBot from 'node-telegram-bot-api';
import i18next from 'i18next';
import User from '../models/user';
import Beer from "../models/beer";
import Order, { IBeer } from '../models/order';
import Client, {IClient} from "../models/client";


const ADD_CLIENT_STATES = {
    WAIT_FOR_UNP: 'wait_for_unp',
    WAIT_FOR_COMPANY_NAME: 'wait_for_company_name',
    WAIT_FOR_ADDRESS: 'wait_for_address'
};

interface IOrderInProgress {
    clientId: string;
    address: string;
    beers: IBeer[];
}

let currentAddClientState: string | null = null; // Текущий шаг
let tempClientData: { unp?: string, companyName?: string } = {}; // Временное хранение данных
const ordersInProgress: { [chatId: number]: IOrderInProgress } = {};


export default (bot: TelegramBot) => {
    const mainAdminKeyboard = {
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
        resize_keyboard: true,
        one_time_keyboard: false // Важно: false, чтобы клавиатура не исчезала
    };

    const sendBackToMainMenu = (chatId: number) => {
        bot.sendMessage(chatId, i18next.t('mainMenu'), {reply_markup: mainAdminKeyboard});
    };

    bot.onText(new RegExp(i18next.t('adminUsers')), async (msg) => {
        const chatId = msg.chat.id;

        const keyboard = {
            keyboard: [
                [{text: i18next.t('currentUsers')}], // Управление пользователями
                [{text: i18next.t('adminRegisterUser')}], // Регистрация нового пользователя
                [{text: i18next.t('mainMenu')}]
            ],
            resize_keyboard: true,
            one_time_keyboard: true
        };

        bot.sendMessage(chatId, 'Выберите действие:', {reply_markup: keyboard});
    });

    bot.onText(new RegExp(i18next.t('mainMenu')), async (msg) => {
        const chatId = msg.chat.id;
        sendBackToMainMenu(chatId);
    });

    bot.onText(new RegExp(i18next.t('adminRegisterUser')), async (msg) => {
        const chatId = msg.chat.id;
        let newUserId: number = NaN;

        const askForId = () => {
            bot.sendMessage(chatId, 'Пожалуйста, введите Telegram ID нового пользователя:');
            bot.once('message', async (idMsg) => {
                if (idMsg.text) {
                    newUserId = parseInt(idMsg.text, 10);

                    if (isNaN(newUserId)) {
                        return bot.sendMessage(chatId, 'Неверный формат ID. Пожалуйста, введите число.');
                    }

                    try {
                        const existingUser = await User.findOne({telegramId: newUserId});
                        if (existingUser) {
                            return bot.sendMessage(chatId, 'Пользователь с таким ID уже зарегистрирован.');
                        }

                        askForFirstName();
                    } catch (err) {
                        console.error('Ошибка при регистрации:', err);
                        bot.sendMessage(chatId, 'Произошла ошибка при регистрации пользователя.');
                    }
                } else {
                    bot.sendMessage(chatId, 'Пожалуйста, введите Telegram ID в виде текста.');
                }
            });
        };

        const askForFirstName = () => {
            bot.sendMessage(chatId, 'Введите имя пользователя:');
            bot.once('message', async (nameMsg) => {
                if (nameMsg.text) {
                    const firstName = nameMsg.text;
                    askForLastName(firstName);
                } else {
                    bot.sendMessage(chatId, 'Пожалуйста, введите имя пользователя в виде текста.');
                    askForFirstName();
                }
            });
        };

        const askForLastName = (firstName: string) => {
            bot.sendMessage(chatId, 'Введите фамилию пользователя:');
            bot.once('message', async (lastNameMsg) => {
                if (lastNameMsg.text) {
                    const lastName = lastNameMsg.text;
                    askForRole(firstName, lastName);
                } else {
                    bot.sendMessage(chatId, 'Пожалуйста, введите фамилию пользователя в виде текста.');
                    askForLastName(firstName);
                }
            });
        };

        const askForRole = (firstName: string, lastName: string) => {
            bot.sendMessage(chatId, 'Выберите роль пользователя:', {
                reply_markup: {
                    inline_keyboard: [
                        [{text: 'Водитель', callback_data: 'driver'}],
                        [{text: 'Пивовар', callback_data: 'brewer'}],
                        [{text: 'Администратор', callback_data: 'admin'}]
                    ]
                }
            });

            bot.once('callback_query', async (roleQuery) => {
                if (roleQuery.data && ['driver', 'brewer', 'admin'].includes(roleQuery.data)) {
                    const role = roleQuery.data;

                    try {
                        const newUser = new User({
                            telegramId: newUserId,
                            firstName: firstName,
                            lastName: lastName,
                            role: role
                        });

                        await newUser.save();
                        bot.sendMessage(chatId, `Новый пользователь ${firstName} ${lastName} (${role}) с ID ${newUserId} успешно зарегистрирован!`);
                        sendBackToMainMenu(chatId);
                    } catch (err) {
                        console.error('Ошибка при регистрации:', err);
                        bot.sendMessage(chatId, 'Произошла ошибка при регистрации пользователя.');
                        sendBackToMainMenu(chatId);
                    }
                } else {
                    bot.sendMessage(chatId, 'Неверная роль.');
                    askForRole(firstName, lastName);
                }
            });
        };

        askForId();
    });

    bot.onText(new RegExp(i18next.t('currentUsers')), async (msg) => {
        const chatId = msg.chat.id;

        try {
            const users = await User.find(); // Получаем всех пользователей из базы данных

            if (users.length === 0) {
                return bot.sendMessage(chatId, 'Пользователи не найдены.');
            }

            // Формируем список пользователей
            let userList = 'Список пользователей:\n\n';
            users.forEach((user) => {
                userList += `* ID: ${user.telegramId}\n`;
                userList += `  Имя: ${user.firstName || '-'}\n`; // Выводим "-" если имя не указано
                userList += `  Фамилия: ${user.lastName || '-'}\n`; // Выводим "-" если фамилия не указана
                userList += `  Роль: ${user.role}\n\n`;
            });

            bot.sendMessage(chatId, userList);
            sendBackToMainMenu(chatId)
        } catch (err) {
            console.error('Ошибка при получении пользователей:', err);
            bot.sendMessage(chatId, 'Произошла ошибка при получении списка пользователей.');
        }
    });

    bot.onText(new RegExp(i18next.t('adminManageAssortment')), async (msg) => {
        const chatId = msg.chat.id;

        try {
            const beers = await Beer.find();
            let inlineKeyboard: { text: string; callback_data: string; }[][] = [];
            let message = 'Текущий ассортимент:\n\n';

            if (beers.length === 0) {
                message += 'Ассортимент пуст.\n';
            } else {
                beers.forEach((beer) => {
                    inlineKeyboard.push([{
                        text: `Удалить ${beer.name}`,
                        callback_data: `/deleteBeer_${beer._id}`
                    }]);
                });
            }

            inlineKeyboard.push([
                {text: i18next.t('addNewBeer'), callback_data: '/addNewBeer'}
            ]);

            // Отправляем сообщение с inline_keyboard
            bot.sendMessage(chatId, message, {
                reply_markup: {inline_keyboard: inlineKeyboard}
            });
        } catch (err) {
            console.error('Ошибка при получении ассортимента:', err);
            bot.sendMessage(chatId, 'Произошла ошибка при получении ассортимента.');
        }
    });

    bot.onText(new RegExp(i18next.t('adminManageOrders')), async (msg) => {
        const chatId = msg.chat.id;

        const manageOrdersKeyboard = {
            keyboard: [
                [{text: i18next.t('adminAddClient')}],
                [{text: i18next.t('adminAddOrder')}],
                [{text: i18next.t('mainMenu')}]
            ],
            resize_keyboard: true,
            one_time_keyboard: true
        };

        bot.sendMessage(chatId, i18next.t('adminManageOrdersMessage'), {reply_markup: manageOrdersKeyboard});
    });

    bot.onText(new RegExp(i18next.t('adminAddClient')), async (msg) => {
        const chatId = msg.chat.id;
        currentAddClientState = ADD_CLIENT_STATES.WAIT_FOR_UNP; // Устанавливаем первый шаг
        bot.sendMessage(chatId, 'Введите УНП клиента:');
    });

    bot.onText(new RegExp(i18next.t('adminAddOrder')), async (msg) => {
        const chatId = msg.chat.id;
        const user = await User.findOne({telegramId: msg.from?.id});

        if (user && user.role === 'admin') {
            try {
                const clients = await Client.find();

                if (clients.length === 0) {
                    bot.sendMessage(chatId, i18next.t('noClientsMessage'));
                } else {
                    const clientButtons = clients.map((client) => [{
                        text: `${client.companyName}`,
                        callback_data: `select_client:${client._id}` // Используем ID клиента в callback_data
                    }]);

                    const clientKeyboard = {
                        inline_keyboard: clientButtons
                    };

                    bot.sendMessage(chatId, 'Выберите клиента:', {reply_markup: clientKeyboard});
                }
            } catch (err) {
                console.error('Ошибка при проверке клиентов:', err);
                bot.sendMessage(chatId, i18next.t('errorMessage'));
            }
        } else {
            // ... обработка ошибки доступа ...
        }
    });

    bot.on('message', async (msg) => {
        const chatId = msg.chat.id;
        const text = msg.text;

        if (currentAddClientState) {
            switch (currentAddClientState) {
                case ADD_CLIENT_STATES.WAIT_FOR_UNP:
                    // Проверяем УНП в базе данных
                    const existingClient = await Client.findOne({unp: text});

                    if (existingClient) {
                        // Клиент с таким УНП уже существует
                        tempClientData.unp = text; // Сохраняем УНП
                        currentAddClientState = ADD_CLIENT_STATES.WAIT_FOR_ADDRESS;
                        bot.sendMessage(chatId, 'Такой клиент уже существует. Введите адрес новой точки:');
                    } else {
                        // Новый клиент - запрашиваем название компании
                        tempClientData.unp = text;
                        currentAddClientState = ADD_CLIENT_STATES.WAIT_FOR_COMPANY_NAME;
                        bot.sendMessage(chatId, 'Введите наименование компании:');
                    }
                    break;

                case ADD_CLIENT_STATES.WAIT_FOR_COMPANY_NAME:
                    tempClientData.companyName = text;
                    currentAddClientState = ADD_CLIENT_STATES.WAIT_FOR_ADDRESS;
                    bot.sendMessage(chatId, 'Введите адрес:');
                    break;

                case ADD_CLIENT_STATES.WAIT_FOR_ADDRESS:
                    try {
                        let client: IClient | null = null;

                        if (tempClientData.unp) {
                            // 1. Сначала пытаемся найти клиента по УНП
                            client = await Client.findOneAndUpdate(
                                {unp: tempClientData.unp},
                                {$push: {addresses: text}},
                                {new: true}
                            );

                            if (!client && tempClientData.companyName) {
                                client = new Client({
                                    unp: tempClientData.unp,
                                    companyName: tempClientData.companyName,
                                    addresses: [text],
                                });
                            }

                            if (client) {
                                await client.save();
                                bot.sendMessage(chatId, 'Точка добавлена!');

                                bot.sendMessage(chatId, 'Выберите действие:', {reply_markup: mainAdminKeyboard});

                                if (currentAddClientState === ADD_CLIENT_STATES.WAIT_FOR_ADDRESS) {
                                    currentAddClientState = null;
                                    tempClientData = {};
                                }
                            } else {
                                console.error('Ошибка: не удалось найти или создать клиента.');
                                bot.sendMessage(chatId, 'Произошла ошибка. Попробуйте снова.');
                            }
                        }
                    } catch (err) {
                        console.error('Ошибка при добавлении клиента:', err);
                        bot.sendMessage(chatId, 'Произошла ошибка при добавлении клиента.');
                    }
                    break;
            }
        }
        const orderInProgress = ordersInProgress[chatId];
        if (orderInProgress && orderInProgress.beers.length > 0) {
            const selectedBeer = orderInProgress.beers[orderInProgress.beers.length - 1];

            if (selectedBeer.kegQuantity === 0) {
                // Получаем количество кег
                const kegQuantity = parseInt(msg.text ?? '0', 10);
                if (!isNaN(kegQuantity) && kegQuantity > 0) {
                    selectedBeer.kegQuantity = kegQuantity;
                    bot.sendMessage(chatId, `Введите объем кеги для ${selectedBeer.name}:`);
                } else {
                    bot.sendMessage(chatId, 'Некорректное количество кег. Введите число больше нуля.');
                }

            } else if (selectedBeer.volume === 0) {
                // Получаем объем кеги
                const volume = parseInt(msg.text ?? '0', 10);
                if (!isNaN(volume) && volume > 0) {
                    selectedBeer.volume = volume;

                    bot.sendMessage(chatId, 'Введите дату заказа в формате ДД.ММ.ГГГГ:');
                    let orderText = 'Текущий заказ:\n';
                    orderInProgress.beers.forEach((beer) => {
                        orderText += `${beer.name} ${beer.volume}л ${beer.kegQuantity}шт\n`;
                    });

                    const orderActionsKeyboard = {
                        inline_keyboard: [
                            [{ text: 'Завершить создание', callback_data: 'finish_order' }],
                            [{ text: 'Продолжить создание', callback_data: 'continue_order' }],
                            [{ text: 'Отменить создание', callback_data: 'cancel_order' }]
                        ]
                    };
                    bot.sendMessage(chatId, `${orderText}\nВыберите действие:`, { reply_markup: orderActionsKeyboard });
                } else {
                    bot.sendMessage(chatId, 'Некорректный объем кеги. Введите число больше нуля.');
                }
            }
        }
    });

    bot.on('callback_query', async (query) => {
        if (query.message) {
            const chatId = query.message.chat.id;
            const data = query.data;
            try {
                if (data?.startsWith('/deleteBeer_')) {
                    const beerId = data.split('_')[1];

                    const deletedBeer = await Beer.findByIdAndDelete(beerId);

                    if (deletedBeer) {
                        bot.sendMessage(chatId, `Пиво "${deletedBeer.name}" удалено из ассортимента.`);
                    } else {
                        bot.sendMessage(chatId, 'Пиво не найдено.');
                    }
                } else if (data === '/addNewBeer') {
                    bot.sendMessage(chatId, 'Введите название нового пива:');

                    bot.once('message', async (nameMsg) => {
                        const beerName = nameMsg.text;
                        if (!beerName) {
                            return bot.sendMessage(chatId, 'Название пива не может быть пустым.');
                        }

                        try {
                            const newBeer = new Beer({name: beerName});
                            await newBeer.save();

                            bot.sendMessage(chatId, `Пиво "${beerName}" добавлено в ассортимент!`);
                        } catch (err) {
                            bot.sendMessage(chatId, `Пиво с таким названием уже существует`);
                        }
                    });
                } else if (data === '/returnToMainMenu') {
                    sendBackToMainMenu(chatId);
                } else if (data?.startsWith('select_client:')) {
                    const clientId = data.split(':')[1];

                    const client = await Client.findById(clientId);

                    if (client) {
                        // Создаем кнопки для каждого адреса
                        const addressButtons = client.addresses.map((address) => [{
                            text: address,
                            callback_data: `select_address:${client._id}:${address}` // Передаем ID клиента и адрес
                        }]);

                        // Создаем клавиатуру с кнопками адресов
                        const addressKeyboard = {
                            inline_keyboard: addressButtons
                        };

                        bot.sendMessage(chatId, `Выберите адрес клиента ${client.companyName}:`, {reply_markup: addressKeyboard});

                    } else {
                        bot.sendMessage(chatId, 'Клиент не найден.');
                    }
                } else if (data && data.startsWith('select_address:')) {
                    const [_, clientId, selectedAddress] = data.split(':');

                    // Сохраняем ID клиента и адрес в ordersInProgress
                    ordersInProgress[chatId] = {
                        clientId,
                        address: selectedAddress,
                        beers: []
                    };

                    try {
                        // Получаем список сортов пива (ассортимент)
                        const beers = await Beer.find(); // Замените на вашу логику получения ассортимента

                        // Создаем кнопки для каждого сорта пива
                        const beerButtons = beers.map((beer) => [{
                            text: beer.name,
                            callback_data: `select_beer:${beer._id}` // Передаем ID пива
                        }]);

                        // Создаем клавиатуру с кнопками выбора пива
                        const beerKeyboard = {
                            inline_keyboard: beerButtons
                        };

                        bot.sendMessage(chatId, 'Выберите пиво для заказа:', { reply_markup: beerKeyboard });
                    } catch (err) {
                        // ... обработка ошибки ...
                    }

                } else if (data && data.startsWith('select_beer:')) {
                    const beerId = data.split(':')[1];

                    const beer = await Beer.findById(beerId);

                    if (beer) {
                        // Запрашиваем количество кег
                        bot.sendMessage(chatId, `Введите количество кег для ${beer.name}:`);

                        // Сохраняем информацию о выбранном пиве во временном объекте
                        ordersInProgress[chatId].beers.push({
                            name: beer.name,
                            volume: 0, // Объем пока не известен
                            kegQuantity: 0 // Количество пока не известно
                        });
                    } else {
                        bot.sendMessage(chatId, 'Пиво не найдено.');
                    }

                } else if (data === 'finish_order') {
                    try {
                        // Создаем новый заказ в базе данных
                        const newOrder = new Order({
                            clientId: ordersInProgress[chatId].clientId,
                            address: ordersInProgress[chatId].address,
                            beers: ordersInProgress[chatId].beers,
                            date: new Date()
                        });

                        await newOrder.save();

                        // Очищаем ordersInProgress
                        delete ordersInProgress[chatId];

                        bot.sendMessage(chatId, 'Заказ успешно создан!', {reply_markup: mainAdminKeyboard});
                    } catch (err) {
                        // ... обработка ошибки ...
                    }

                } else if (data === 'continue_order') {
                    try {
                        // Получаем список сортов пива (ассортимент)
                        const beers = await Beer.find(); // Замените на вашу логику получения ассортимента

                        // Создаем кнопки для каждого сорта пива
                        const beerButtons = beers.map((beer) => [{
                            text: beer.name,
                            callback_data: `select_beer:${beer._id}` // Передаем ID пива
                        }]);

                        // Создаем клавиатуру с кнопками выбора пива
                        const beerKeyboard = {
                            inline_keyboard: beerButtons
                        };

                        bot.sendMessage(chatId, 'Выберите пиво для заказа:', { reply_markup: beerKeyboard });
                    } catch (err) {
                        // ... обработка ошибки ...
                    }

                } else if (data === 'cancel_order') {
                    // Очищаем ordersInProgress и сообщаем об отмене
                    delete ordersInProgress[chatId];
                    bot.sendMessage(chatId, 'Создание заказа отменено.', {reply_markup: mainAdminKeyboard});
                }
            } catch (err) {
                bot.sendMessage(chatId, 'На сервере произошла ошибка');
            }
        }
    });
};