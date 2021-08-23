// This file is our opening or starting file.
// This standalone file is set so that we couldconnect to our database.

const dotenv = require('dotenv')
dotenv.config() // so we can use the config fie dotenv...

const mongodb = require('mongodb')

// connectionString
//const connectionString = 'mongodb+srv://complexAppHehe:WOHENshousi1984@cluster0.rqdp8.mongodb.net/complexApp?authSource=admin&replicaSet=atlas-ignr3c-shard-0&readPreference=primary&appname=MongoDB%20Compass&ssl=true'



mongodb.connect(process.env.CONNECTIONSTRING, {useNewUrlParser: true, useUnifiedTopology: true}, function(err, client) {
    module.exports = client

    const app = require('./app')
    app.listen(process.env.PORT)// It works perfectly well for our local environment, but we might need to push it online... we might need a different value here...
    //e.g. heroku.
})