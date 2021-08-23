const express = require('express')

const session = require('express-session')

const MongoStore = require('connect-mongo')(session)

const flash = require('connect-flash')

const markdown = require('marked')

const csrf = require('csurf')

const app = express()

const sanitizeHTML = require('sanitize-html')

app.use(express.urlencoded({ extended: false}))
//It tells the express to add user submitted data onto our requested object. So we can access it via our request.

app.use(express.json())


app.use('/api', require('./router-api')) //All of app.use() below will not be applies to this route.
//Hence, very lightweight, very fase and very repsosn



//boilerplate code:
//course 65th update: modify this object so that it could save data in mongodb database.
let sessionOptions = session({
    secret: "Javascript is sooooooo cooooooool",
    store: new MongoStore({client: require('./db')}),
    resave: false,
    saveUninitialized: false,
    cookie: {maxAge: 1000 * 60 *60 *24 , httpOnly: true} // 1 day cookie to expire

})

app.use(sessionOptions)
app.use(flash()) //add the flash feature to our application: course 66th

app.use(function(req, res, next){
    // make our markdown function avaiable from within our ejs templates
    res.locals.filterUserHTML = function(content) {
        return sanitizeHTML(markdown(content), {allowedTags: ['p', 'br', 'ul', 'ol', 'li', 'strong', 'bold', 'i', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6' ], allowedAttributes: {}})
        //after sanitizing, our browser still wants to render it as a link, but the sanitizing disallow it. However, allowedTags are forgiven.
    }


    // make all error and flash messages available from all templates
    res.locals.errors = req.flash("errors")
    res.locals.success = req.flash("success")

    // make current user id available on the req object
    if (req.session.user) {
        req.visitorId = req.session.user._id
    }
    else {
        req.visitorId = 0
    }

    //make user session data available from within view templates
    res.locals.user = req.session.user

    next()
})


const router = require('./router')
//require function:1: it executes this file. 2: it returns whatever that file exports.


console.log(router)




app.use(express.static('public'))//We want to make the folder, public, accessible, for anyone who wants to view our app...


app.set('views', 'views')  //first argument needs to be exactly views, which is a express option.
                    // second argument happens to be views, which is the name of our folder.

app.set('view engine', 'ejs') // It tells our app which template engine we are using right now. (We now want to use the ejs engine...)



app.use(csrf())
//So, any of our post, put, delete or any request that modifies state will need to have a valid matching CSRF token or else the request 
//will be rejected and we'll throw an error.

app.use(function (req, res, next) {
    const token = req.csrfToken()
    res.locals.csrfToken = token
    next()
})


//app.get('/' , function(req, res){ // url, or route
   
//    res.render('home-guest') //We just give a name of the template...
//})
app.use('/', router) // It works in the same way as 3 lines of code before.

app.use(function (err, req, res, next) {
    if(err) {
        if (err.code == "EBADCSRFTOKEN") {
            req.flash('errors', "Cross site request forgery detected.")

            req.session.save( () => {
                res.redirect('/')
            })
        } else {
            res.render("404")
        }
    }
})

const server = require('http').createServer(app)

const io = require('socket.io') (server)

io.use(function (socket, next) { //Make our session data available in the context of io. course 109th.
    sessionOptions(socket.request, socket.request.res, next)
})

io.on('connection', function(socket) {

    //Soeckt events are powerful. We are free to create as many as possible methods if we want.

    if (socket.request.session.user) {
        let user = socket.request.session.user

        socket.emit('welcome', {username: user.username, avatar: user.avatar}) //If 

        socket.on('chatMessageFromBrowser' , function (data) {


            //sanitize chat message here in the 2nd argument.
        socket.broadcast.emit('chatMessageFromServer' , {message: sanitizeHTML(data.message, {allowedTags: [], allowedAttributes: {}}), username:user.username, avatar: user.avatar})
        //It will sent messages to all connected except the sender.
    })
    }
})

module.exports = server // instead of actually listening, we just export it from the file.
//Now, we are going to tell our all server to listening.