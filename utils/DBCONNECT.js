const mongoose = require('mongoose')
const dotenv = require('dotenv')

dotenv.config({
    path: './config.env'
})

// connect to Remote MongoDb server
const connectToRemoteDatabase = () => {
    const DB = process.env.DB_LINK.replace(
        '<password>',
        process.env.DATABASE_PASSWORD
    )

    mongoose
    .connect(DB, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true
    })
    .then(conn => {
        console.log('Database connection successful in remote.')
    })
}

//connect DB to local mongoDB server
const connectToLocalDatabase = () => {
    const DB_LOCAL = process.env.DB_LINK_LOCAL.replace(
        '<password>',
        process.env.DB_PASSWORD_LOCAL
    )
   // connect DB to local mongoDB server
    mongoose
        .connect(DB_LOCAL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true
        })
        .then(conn => {
            console.log('Database connection successful in local.')
        })


}

module.exports = {
    connectToRemoteDatabase,
    connectToLocalDatabase,
}