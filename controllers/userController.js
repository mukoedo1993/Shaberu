//goal: export multiple functions that could be executed in multiple javascript files.

const { reset } = require('nodemon')
const User = require('../models/User') // reusable blueprint or ctor. functions.
const Post = require('../models/Post') 
const Follow = require('../models/Follow') 
const { ReplSet } = require('mongodb')

const jwt = require('jsonwebtoken')


//All sharedProfile basic routes called this function.

exports.apiGetPostsByUsername = async function (req, res) {
 
    try {
        let authorDoc = await User.findByUserName(req.params.username) //If there is not the username, then this promise will going to reject.

        let posts = await Post.findByAuthorId(authorDoc._id)

        res.json(posts)

    } catch {
        res.json("Sorry, invalid user requested.")
    }
}

exports.apiMustBeLoggedIn = function (req, res, next) {
 try {
    req.apiUser = jwt.verify(req.body.token, process.env.JWTSECRET) // It's going to return the payload that stored in the token.

    next() // In the next function for this route, we will be able to access req.apiUser here.

 } catch {
    res.json("Sorry, you must provide a valid token.")
 }
}

exports.doesUsernameExist = function (req, res) {
    User.findByUserName(req.body.username).then( function () {
        res.json(true) //data axio will request or receive
    }).catch(function () {
        res.json(false)
    })
}

exports.doesEmailExist = async function (req, res) {
    let emailBool = await User.doesEmailExist(req.body.email)
    res.json(emailBool)
}

exports.sharedProfileData = async function (req, res, next) {
    let isVisitorsProfile = false

    let isFollowing = false
    if(req.session.user/*If the user is logged in*/) {
        isVisitorsProfile = await req.profileUser._id.equals(req.session.user._id)
       isFollowing = await Follow.isVisitorFollowing(req.profileUser._id, req.visitorId) //first argument comes from request object, from a function named, doesUserExist.
    }

    req.isVisitorsProfile = isVisitorsProfile
    req.isFollowing = isFollowing


    // retrieve post, following and followers accounts 
    let postCountPromise = Post.countPostsByAuthor(req.profileUser._id) 
    let followerCountPromise = Follow.countFollowersById(req.profileUser._id)
    let followingCountPromise = Follow.countFollowingById(req.profileUser._id)
    
    let [postCount, followerCount, followingCount] = await Promise.all([postCountPromise, followerCountPromise, followingCountPromise]) // We don't care which one will complete first. We are just here waiting for all of
    //them to complete before moving on.

    req.postCount = postCount
    req.followerCount = followerCount
    req.followingCount = followingCount

    next()
}

exports.mustBeLoggedIn = function(req, res, next) {
 if(req.session.user) {
    next() //The user exists, so we could call the next function.
 } else {
    req.flash("errors", "You must be logged in to perform that action")
    req.session.save(function(){
        res.redirect('/')
    })
 }
}


exports.login = function(req, res){ 
    let user = new User(req.body)
    user.login().then(function(result){
        
        req.session.user = {avatar: user.avatar, //in the memory, we know it will be avatar in our object. We save it in a session, so if our user login, we not need to type in
            //the avatar again.

             username: user.data.username}
        //res.send(result) // Here, we want to let users to login. In other words, we want to leverage session here.


        /*
However, we do need to worry about the timing of our event.
When we say request.session.user, the session package is going to recognize that we are changing the session data and in response is going to automatically update that session data in database. It's great.
But, updating database is an asynchronous action. It might a while to complete. We don't want to just run redirect right here because there's no guarantee that the database
will have actually been updated in time before the redirect runs.
        */
        req.session.save(function() { //we could manually tell it to save....
            res.redirect('/')
        })


    }).catch(function(e){

        req.flash('errors', e) //first argument: the name of collection or an array of messages we want to start building or adding on to;
        //second argument: the actual message you want to add on to the set of messages. Here, we set this as the value that our promise are going to use to reject with.
        //It is not guaranteed that flash function will complete before the redirect function.

        // Commented out in course 66th
       // res.redirect('/') // It is going to be treated as a new separated request. Since we are redirecting to the homepage, our router is going to call our home function.
       req.session.save( function(){
           res.redirect('/')
       })
    }) 

}


exports.apiLogin = function(req, res){ 
    //compared to the original login function, we do not need to worry about sessions and flash messages here.
    let user = new User(req.body)
    user.login().then(function(result){
        
        //jwt.sign: actually, we stored our token here.
     res.json(jwt.sign({_id: user.data._id}, process.env.JWTSECRET, {expiresIn: '30m'}))

    }).catch(function(e){

       res.json("Sorry, but your value is not correct.")
       })
    }



exports.logout = function(req, res){

    req.session.destroy(function(){
        res.redirect('/')   //redirect them to the homepage
    }) 
    //So, if the current incoming request from a browser has a cookie with a valid or matching session ID, 
    //this is going to find that in our database and destroy that session.


}

exports.register = function(req , res){

    let user = new User(req.body)

    user.register().then(() => {
 
    req.session.user = {avatar: user.avatar, username: user.data.username, _id: user.data._id} // update in course 76th
        // After we update the session data:
        req.session.save(function() {
            res.redirect('/')
        })

        //regErrors as parameters: our controller doesn't have to be aware of our data structure. It's only
        //calling the promise and letting the model deal with all of the data and the varible names, so on and so forth.
    }).catch((regErrors) => {
        regErrors.forEach(function(error){
            req.flash('regErrors', error) // This step will trigger a request on database.
        })
        req.session.save(function() {
            res.redirect('/')
        })
        // We don't actually want to redirect until our database actions has completed.
        // So, let's manually tell our database to save.


    })
     // It is an asynchronous function, and we can wait our return our promise. We want to adjust our register function so that it can return a promise.
                    //...and we can wait for our promise, here in our controller....


    console.log(user) // FOR TEST ONLY

 
}

// 
exports.home = async function(req, res){
    if (req.session.user) {

        // fetch feed of posts for current user
        let posts = await Post.getFeed(req.session.user._id)


        res.render('home-dashboard',
       //, {username: req.session.user.username, avatar: req.session.user.avatar}   // we have already passed it in app.js. Commented in course 71st
                                      // we want to pass the second argument as JS object to the first argument.
                    {posts: posts}
       ) 

    } else {
        res.render('home-guest'
        , {regErrors: req.flash('regErrors')}
       )//HTTP request is stateless, it has no memory that we login just failed.
        //We want to only show the error message to the user once. Once we have shown the user the data, we want to delete it. (course 66th)
    }
} 


exports.ifUserExists = function(req, res, next) {
   User.findByUserName(req.params.username).then( function(userDocument) {
    req.profileUser = userDocument //So we could access to the userDocument outside of this function
    next()
   }).catch(function() {
    //If there is no macthing user interface...
    //So, here, we just want to run a 404 or page not found screen...
    res.render("404")
   })
}

exports.profilePostsScreen = function(req, res) {

    //ask our post model for posts by a certain author id
    Post.findByAuthorId(req.profileUser._id).then(function (posts) {
        res.render('profile', {
            title: `Profile for ${req.profileUser.username}`,
            currentPage: "posts",
            posts: posts,
            profileUsername: req.profileUser.username,
            profileAvatar: req.profileUser.avatar,
            isFollowing: req.isFollowing, // updated in course 99th
            isVisitorsProfile: req.isVisitorsProfile,
            counts: {postCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount}
        })

    }).catch(function () {
        //If the catch runs, it has to be some unforseen or technical issues.
        res.render("404")
    })

 
}


exports.profileFollowersScreen = async function(req, res) {
    //Rather than a then-catch block, we set try-catch block with an await syntax.
    try{
        let followers = await Follow.getFollowersById(req.profileUser._id)

        res.render('profile-followers', {
    
         currentPage: "followers",
         followers: followers,
         profileUsername: req.profileUser.username,
         profileAvatar: req.profileUser.avatar,
         isFollowing: req.isFollowing, 
         isVisitorsProfile: req.isVisitorsProfile,
         counts: {postCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount}
        })
    } catch(e) {
        res.render("404")
    }
}


exports.profileFollowingScreen = async function(req, res) {
    //Rather than a then-catch block, we set try-catch block with an await syntax.
    try{
        let following = await Follow.getFollowingById(req.profileUser._id)

        res.render('profile-following', {
    
         currentPage: "following",
         following: following,
         profileUsername: req.profileUser.username,
         profileAvatar: req.profileUser.avatar,
         isFollowing: req.isFollowing, 
         isVisitorsProfile: req.isVisitorsProfile,
         counts: {postCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount}
        })
    } catch(e) {
        res.render("404")
    }
}



