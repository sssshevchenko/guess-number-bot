const TelegramApi = require('node-telegram-bot-api')
const {gameOptions, againOptions} = require('./options')
const sequelize = require('./db')
const UserModel = require('./models')

const token = '5842971915:AAEYKvSXUUreC2Al62A92Bk5ZJjH3R2JP60'

const bot = new TelegramApi(token, {polling: true})

const chats = {}

const startGame = async (chatId) => {
    await bot.sendMessage(chatId, `I'll pick a number from 0 till 9 and you need to guess what number it is.`)
    const randomNumber = Math.floor(Math.random() * 10)
    chats[chatId] = randomNumber
    await bot.sendMessage(chatId, 'Guess the number', gameOptions)
}

const start = async() => {
    try {
        await sequelize.authenticate()
        await sequelize.sync()
    } catch(e) {
        console.log('Failed to connect to db', e)
    }

    bot.setMyCommands([
        {command: '/start', description: 'First greeting'},
        {command: '/info', description: 'Get info about user'},
        {command: '/game', description: 'Guess the number'},
    ])
    
    bot.on('message', async (msg) => {
        const text = msg.text
        const chatId = msg.chat.id
    
        try {
            if(text === '/start') {
                await UserModel.create({chatId})
                await bot.sendSticker(chatId, 'https://tlgrm.eu/_/stickers/ea5/382/ea53826d-c192-376a-b766-e5abc535f1c9/8.webp')
                return bot.sendMessage(chatId, `Sup, it's my first Telegram-Bot. Here you can play a game, where you need to guess the number.`)
            }
        
            if(text === '/info') {
                const user = await UserModel.findOne({chatId})
                return bot.sendMessage(chatId, `You got ${user.right} right answers and ${user.wrong} wrong answers`)
            }
    
            if(text === '/game') {
                return startGame(chatId)
            }
    
            return bot.sendMessage(chatId, `I don't get you. Try again!`)
        } catch(e) {
            return bot.sendMessage(chatId, 'Oops, an error occured')
        }
    })

    bot.on('callback_query', async msg => {
        const data = msg.data
        const chatId = msg.message.chat.id

        if(data === '/again') {
            return startGame(chatId)
        }

        try {
            const user = await UserModel.findOne({chatId})
    
            if(data == chats[chatId]) {
                user.right += 1
                await bot.sendMessage(chatId, `Congratulations! You guessed the number - ${chats[chatId]}`, againOptions)
            } else {
                user.wrong += 1
                await bot.sendMessage(chatId, `Unfourtunately, you got it wrong :( \nThe number was - ${chats[chatId]}`, againOptions)
            }
            await user.save()
        } catch(e) {
            return bot.sendMessage(chatId, 'Oops, an error occured')
        }
    })
}

start()