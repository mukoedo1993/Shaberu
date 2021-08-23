const ObjectID = require('mongodb').ObjectID //A class representation of the BSON ObjectId type course 73rd // pass a single string of text, and it 
//will return as a objectID type of object.


const postsCollection = require('../db').db().collection("posts") // to access to the database

const followsCollection = require('../db').db().collection("follows") // to access to the database

postsCollection.createIndex({title: "text", body: "text"})

const User = require('./User')

const sanitizeHTML = require('sanitize-html')

let Post = function(data, userid, requestedPostId) {
    this.data = data // incoming requests body data
    this.errors = []
    this.userid = userid
    this.requestedPostId = requestedPostId
}

// To make sure that both our titles and text fields are strings, rather than malicious objects or other weird things...
Post.prototype.cleanUp = function() {
    if(typeof(this.data.title) != "string") { this.data.title = ""}
    if(typeof(this.data.body) != "string") { this.data.body = ""}

    // make sure that user didn't pass any bogus property in the form data:
    // get rid of any bogus properties
    this.data = {
        title: sanitizeHTML(this.data.title.trim(), {allowedTags: [], allowedAttributes: {}}),
        //trim():Removes the leading and trailing white space and line terminator characters from a string.

        body: sanitizeHTML(this.data.body.trim(), {allowedTags: [], allowedAttributes: {}}),// first argument: what you want to sanitize, second argument: an object for configuration object


        createdDate: new Date(),// It is built-in blueprint for Date object, so this will return a Date object represents the current time when this code is executed.

        // Actually, mongodb  has a special way to treat id values. To honor that, we could:
        author: ObjectID(this.userid)
    }
}

Post.prototype.validate = function() {
    if(this.data.title == "") {
        this.errors.push("You must provide a title. ")
    }

    if(this.data.body == "") {
        this.errors.push("You must provide post content. ")
    }
}

Post.prototype.create = function() { //where we will actually store our data in our database
    //We want the function to return a promise

    return new Promise((resolve, reject) => {
        this.cleanUp()
        this.validate()

        if (!this.errors.length) {
            //save post into database

            //This mongodb method is going to return a promise, and when that promise resolves, it's going to resolve with
            //a bunch of information about the database action that just took place.
            postsCollection.insertOne(this.data).then((info) => {
                console.log(this.data)
                resolve(info.ops[0]._id)//to resolve this brand-new id
                console.log("info.ops[0]._id" + info.ops[0]._id)
        }).catch(() => {
            this.errors.push("Please try again later.") // server problem, not users' or database's connection problem.

            reject(this.errors)
        }) // However, it is an asynchronous operation. We have no idea how long 
          

        } else {
            reject(this.errors)
        }
    })

}

Post.prototype.update = function() {
    return new Promise(async (resolve, reject) => {
        try {
            let post = await Post.findSingleById(this.requestedPostId, this.userid)
             if (post.isVisitorOwner) {
                //actually updated the db
                let status = await this.actuallyUpdate()
                resolve(status) 
             }else {
                reject()
             }
        } catch {
            reject()
        }
    })
}


Post.prototype.actuallyUpdate = function() {
    return new Promise(async (resolve, reject) => {
        this.cleanUp()
        this.validate()

        if (!this.errors.length) {
            await postsCollection.findOneAndUpdate({_id: new ObjectID(this.requestedPostId)}, {$set: {title: this.data.title, body: this.data.body}}) // first argument: the object you want to find 
            resolve("success")
        } else {
            resolve("failure")
        }
    })
}

Post.reusablePostQuery = function(unqiueOperations, visitorId, finalOperations = []) {
    return new Promise(async function (resolve, reject) {
        
        let aggOperations = unqiueOperations.concat([
            {$lookup: {from: "users", localField: "author", foreignField: "_id", as: "authorDocument"}},   //when we are looking for the user collection from the matching documents, the localField, or the 
            //field in the current post item we want to perform that match on. Local means the curent collection, foreign means other collection we are looking up. And the field we 
            //want to look on the foreign field is the id field...
            //as: the as property: mongodb will use this name, authoerDocument, when it adds on a virtual field of property with the matching user document to this post.


            {$project: {
                title: 1,
                body: 1,
                createdDate: 1,
                authorId: "$author", //It knows you are talking about a field, not a string of texts.
                author: {$arrayElemAt: ["$authorDocument", 0]} //set author as first item in the array of authorDocument

            }}
            

        ]).concat(finalOperations)

        //timing! attention!
        let posts = await postsCollection.aggregate(aggOperations).toArray() //It is great when you need to do multiple operations
        //we need toArray function to return a promise, because talking to the database is an asynchronous operation.

        //clean up author property in each post object
        posts = posts.map(function(post) {
            post.isVisitorOwner = post.authorId.equals(visitorId) //authorId is a mongodb objectId
            post.authorId = undefined // hide users' id

            post.author = {
                username: post.author.username,
                avatar: new User(post.author, true).avatar
            }
           
            return post
        })


        resolve(posts)

    })
}


Post.findSingleById = function(id, visitorId) {
    return new Promise(async function (resolve, reject) {
        
        // make sure the requested id make sense and isn't malicious
        if( typeof(id) != "string" || !ObjectID.isValid(id)) { // if 
            reject()
            return // to prevent any further exection
        }

       let posts = await Post.reusablePostQuery([
           {$match: {_id: new ObjectID(id)}}
       ], visitorId)
        if (posts.length) {
            console.log("here posts length post.js")
            
            console.log(visitorId)
            console.log(id)
            posts[0].authorId = visitorId
            
            resolve(posts[0])
        } else {
            reject()
        }

    })
}

Post.findByAuthorId = function (authorId) {
    // OK for return a completely empty array of posts
    return Post.reusablePostQuery([
        {$match: {author: authorId}},
        {$sort: {createdDate: -1}} //1 for ascending order, negative 1 for descending order

    ])
}


Post.delete = function(postIdToDelete, currentUserId) {
    return new Promise(async (resolve, reject) => {
        try {
            let post = await Post.findSingleById(postIdToDelete, currentUserId)
            if (post.isVisitorOwner) {
                await postsCollection.deleteOne({_id: new ObjectID(postIdToDelete)})
                resolve()
            }
            else {
                reject() // Someone nogood wants to delete this post.
            }
        }
        catch {
            reject() //This post doesn't exist
        }
    })
} 


Post.search = function(searchTerm) {
    return new Promise(async(resolve, reject) => {
        if (typeof(searchTerm) == "string") { //security reason
            let posts = await Post.reusablePostQuery([
                {$match: {$text: {$search: searchTerm}}}
            ], undefined, [{$sort: {score: {$meta: "textScore"}}}])
            resolve(posts)

        } else {
            reject()
        }
    })
}

Post.countPostsByAuthor = function (id) {
    return new Promise(async (resolve, reject) => {
        let postCount = await postsCollection.countDocuments({author : id})


        resolve(postCount)
    })
}

Post.getFeed = async function (id) {
    // create an array of the user ids that the current user follows
    let followedUsers = await followsCollection.find({authorId: new ObjectID(id)}).toArray()

    followedUsers = followedUsers.map(function (followDoc) {
        return followDoc.followedId
    }) //So, since here, followedUser will only have followers' id.

    // looked for posts where the author is in the above array of followed users
    return Post.reusablePostQuery([

        {$match: {author: {$in: followedUsers}}}, //Find any post document where the author value is a value that is in our array of followUsers.

        {$sort: {createdDate: -1}} // So the newest value will be on the top

    ]) //Here, figure out author's username and fetch its gravatar.
}

module.exports = Post
