const apiRouter = require('express').Router()

const userController = require('./controllers/userController')

const postController = require('./controllers/postController')

const followController = require('./controllers/followController')

const cors =require('cors')

apiRouter.use(cors()) //configure all of routes listed below this line.
//It sets the cors policy, so it allows for any domain.



apiRouter.post('/login', userController.apiLogin)

apiRouter.post('/create-post', userController.apiMustBeLoggedIn, postController.apiCreate)

apiRouter.delete('/post/:id', userController.apiMustBeLoggedIn, postController.apiDelete)

apiRouter.get('/postsByAuthor/:username', userController.apiGetPostsByUsername)


module.exports = apiRouter