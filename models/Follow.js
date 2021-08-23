const usersCollection = require('../db').db().collection("users")
const followsCollection = require('../db').db().collection("follows")

const ObjectID = require('mongodb').ObjectID

const User = require('./User')

let Follow = function (followedUsername, authorId) {
    this.followedUsername = followedUsername
    this.authorId = authorId
    this.errors = []
}

Follow.prototype.cleanUp = async function() {
    
    if(typeof(this.followedUsername) != "string") {
        this.followedUsername = ""
    }
}

Follow.prototype.validate = async function(action) {
    // followedUsername must exist in database
    let followedAccount = await usersCollection.findOne({username: this.followedUsername})

    if (followedAccount) {
        this.followedId = followedAccount._id

    } else {
        this.errors.push("You cannot follow a user that does not exist.")
    }

    let doesFollowAlreadyExist = await followsCollection.findOne({followedId: this.followedId, authorId: new ObjectID(this.authorId)})
    //findOne returns a promise, so we included an await for it.

    if (action == "create") {
        if (doesFollowAlreadyExist) {
            this.errors.push("You are already following thie user.")
        }
    }

    if (action == "delete") {
        if (!doesFollowAlreadyExist) {
            this.errors.push("You cannot stop following someone you do not already follow.")
        }
    }

    // should not be able to follow yourself
    if (this.followedId.equals(this.authorId)) {
        this.errors.push("You cannot follow yourself.")
    }
}

Follow.prototype.create =  function() {
    return new Promise(async (resolve, reject) => {
        this.cleanUp()
        await this.validate("create")

        if (!this.errors.length) {
            await followsCollection.insertOne({followedId: this.followedId, authorId: new ObjectID(this.authorId)})

            resolve()

        } else {
            reject(this.errors)
        }
    })
}

Follow.prototype.delete =  function() {
    return new Promise(async (resolve, reject) => {
        this.cleanUp()
        await this.validate("delete")

        if (!this.errors.length) {
            await followsCollection.deleteOne({followedId: this.followedId, authorId: new ObjectID(this.authorId)})

            resolve()

        } else {
            reject(this.errors)
        }
    })
}


Follow.isVisitorFollowing = async function(followedId , visitorId) { //dealing with database, so we set it as an async function.

    let followDoc = await followsCollection.findOne({followedId: followedId, authorId: new ObjectID(visitorId)}) //This argument will return a promise.

    if (followDoc) {
        return true
    } else {
        return false
    }
}

Follow.getFollowersById = function (id) {
    return new Promise(async (resolve, reject) => {
        try {
            let followers = await followsCollection.aggregate([
                {$match: {followedId: id}},
                {$lookup: {from: "users", localField: "authorId", foreignField: "_id", as:"userDoc"}}, //from is the collection we are looking up now,
                //We are looking into the user's collection for documents where the _id matches the author's ID from the follow document. And, finally
                //after the id, we would say comma and add a property named "as". We can make it any name, let's call it userDoc, 
                {$project: {
                    username: {$arrayElemAt: ["$userDoc.username", 0]},
                    email: {$arrayElemAt: ["$userDoc.email", 0]},
                
                }}
            ]).toArray() 


            followers = followers.map(function(follower){
              let user = new User(follower, true) //follower will be the data that populates the ctor. function.
              //figure out the gravatar based on the user's email address

              return {username: follower.username, avatar: user.avatar}
            })

            resolve(followers)
        } catch {
            reject()
        }
       
    })
}

Follow.getFollowingById = function (id) {
    return new Promise(async (resolve, reject) => {
        try {
            let followers = await followsCollection.aggregate([
                {$match: {authorId: id}},
                {$lookup: {from: "users", localField: "followedId", foreignField: "_id", as:"userDoc"}},
                {$project: {
                    username: {$arrayElemAt: ["$userDoc.username", 0]},
                    email: {$arrayElemAt: ["$userDoc.email", 0]},
                
                }}
            ]).toArray() 


            followers = followers.map(function(follower){
              let user = new User(follower, true) //follower will be the data that populates the ctor. function.
              //figure out the gravatar based on the user's email address

              return {username: follower.username, avatar: user.avatar}
            })

            // Ultimately, this promise is going to resolve with the value. And our controller isn't going to know or care what is in resolve function's parameter,
            //followers, here.All the controller cares about, is that it is receiving an array. For human's perspective, you  could change it, but, for the computer's 
            // perspective, it doesn't make any difference.
            resolve(followers)
        } catch {
            reject()
        }
       
    })
}


Follow.countFollowersById = function (id) {
    return new Promise(async (resolve, reject) => {
        let followerCount = await followsCollection.countDocuments({followedId : id})


        resolve(followerCount)
    })
}

Follow.countFollowingById = function (id) {
    return new Promise(async (resolve, reject) => {
        let count = await followsCollection.countDocuments({authorId : id})


        resolve(count)
    })
}

module.exports = Follow