const {Sequelize} = require('sequelize')

module.exports = new Sequelize({
    dialect: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'root',
    database: 'guess_number_bot'
})