const Post = require('../models/Post')

const sendgrid = require('@sendgrid/mail')

sendgrid.setApiKey(process.env.SENDGRIDAPIKEY)

//const ObjectID1 = require('mongodb').ObjectID

exports.viewCreateScreen = function(req, res) {
    res.render('create-post'
  //  , {username: req.session.user.username, avatar: req.session.user.avatar} // commented in course 71st
    )
}


exports.create = async function(req, res) {
    let post = new Post(req.body, req.session.user._id) // pass the submitted form data

    //Set this method up so it will return a promise...

    post.create().then(function(newId) {


       req.flash("success", "new post successfully created")
       console.log("line 17th")
       console.log(newId)
       req.session.save(() => res.redirect(`/post/${newId}`))

    }).catch(function(errors) {
      errors.forEach(error => req.flash("errors", error))
      req.session.save(() => res.redirect("/create-post"))
    })
}

exports.apiCreate = async function(req, res) {
    let post = new Post(req.body, req.apiUser._id) // pass the submitted form data

    try{
        const newId = await post.create()
        res.json("Congrats.")
    }
    catch(err){
        res.json(errors)
    }
    //Set this method up so it will return a promise...
    /*
    post.create().then(function(newId) {
       
       res.json("Congrats.")

    }).catch(function(errors) {
      res.json(errors)
      console.log("line 40th, some errors, no good...")
    })*/
}


exports.viewSingle = async function(req, res) {
   try {
    let post = await Post.findSingleById(req.params.id, req.visitorId) // A new instance of blueprint of our model
    //when we create it, it will return a promise.


    res.render('single-post-screen', {post: post, title: post.title}) //passes the post as the variable of post
    // enhance our printed-out title here.

   } catch {
    // 404 
    res.render('404')
 }
}


exports.viewEditScreen = async function(req, res) {
    try{
        let post = await Post.findSingleById(req.params.id, req.visitorId) //whatever value it resolves with //add 2nd argument on course 86th

      

        console.log("post.authorId is:")
        console.log(post)
        
        console.log("post.authorId is given.")

        console.log("reqis:")
        console.log(req.visitorId)
        
        console.log("req is given.")
       
       if(post.authorId == req.visitorId) {
        res.render("edit-post", {post: post})
       } else {
        req.flash("errors", "You do not have permission to perform that action.")
        req.session.save(() => res.redirect("/")) // manually save our session data
       }

    } catch {
        res.render("404")
    }

}


exports.edit = async function(req, res) {
    let post = new Post(req.body, req.visitorId, req.params.id) //req.body is the blueprint of submitted data
    try{
        const status = await post.update()
         // the post was sucessfully updated in the database
        // or user did have permission, but there were validation errors.
        if (status == "success") {
            //post was updated in db
            req.flash("success", "Post successfully updated.")
            req.session.save(function() {
                res.redirect(`/post/${req.params.id}/edit`)
            })
    }
    }catch(err){
        () => {
            //a post with the requested ID doesn't exist
            // or if the current visitor is not the owner of the requested post
            req.flash("errors", "You do not have permission to perform that action.")
            console.log("nima zhale")
            req.session.save( function() { // manually save the data
                res.redirect("/")
            })
        }
    }

    /*
    post.update().then((status) => {
        // the post was sucessfully updated in the database
        // or user did have permission, but there were validation errors.
        if (status == "success") {
            //post was updated in db
            req.flash("success", "Post successfully updated.")
            req.session.save(function() {
                res.redirect(`/post/${req.params.id}/edit`)
            })
        } else {
            post.errors.forEach(function(error) {
                req.flash("errors", error)
            })
            req.session.save(function() {
                res.redirect(`/post/${req.params.id}/edit`)
            })
        }

    }).catch(() => {
        //a post with the requested ID doesn't exist
        // or if the current visitor is not the owner of the requested post
        req.flash("errors", "You do not have permission to perform that action.")
        console.log("nima zhale")
        req.session.save( function() { // manually save the data
            res.redirect("/")
        })
    })*/
}   //closing curly bracket for the create function.


exports.showFeedbackPage = async function (req, res) {
    res.render("feedback-page")
}

exports.sendFeedback = async function (req, res) {
    let feedbackInterface = new Post()
    feedbackInterface.feedbackCreate(req.body.title, req.body.body)

    sendgrid.send({
        to: 'kanashimino93@gmail.com',
        from: 'wangzcyuanfang1997@gmail.com',
        subject: `${req.body.title}`,
        text: `${req.body.body}`,
        html: `Someone has send you a message.
        content: ${req.body.body} and title is ${req.body.title}.`
    }).then(
        () => {   console.log('Message sent')
        req.flash("success", "You have successfully submit an email to the owner.")
        req.session.save(function() {
            res.redirect(`view-feedback`)
        }) }
    ).catch(
     (error) => console.log(error.response.body)
    )

   

}


exports.delete = async function (req, res) {
    try{
        await Post.delete(req.params.id, req.visitorId)
        req.flash("success", "Post successfully deleted.")
        req.session.save(() => res.redirect(`/profile/${req.session.user.username}`))
    }
    catch(errors){

    //If the post doesn't exist or the user tries to operate on this post is not the author of 
    // the post: 
    req.flash("errors", "You do not have permission to perform that action.")
    req.session.save(() => res.redirect("/"))
    }
    /*
Post.delete(req.params.id, req.visitorId).then(() => {
 req.flash("success", "Post successfully deleted.")
 req.session.save(() => res.redirect(`/profile/${req.session.user.username}`))
}).catch(() => {

    //If the post doesn't exist or the user tries to operate on this post is not the author of 
    // the post: 
    req.flash("errors", "You do not have permission to perform that action.")
    req.session.save(() => res.redirect("/"))
})*/
}

exports.apiDelete = async function (req, res) {
    try{
    await  Post.delete(req.params.id, req.apiUser._id)
    res.json("Success")
    }catch (errors) {
        res.json("You do not have permission to perform that action.")
    }
    /*
    Post.delete(req.params.id, req.apiUser._id).then(() => {
        res.json("Success")
    }).catch(() => {
    
        res.json("You do not have permission to perform that action.")
    })*/
    }


exports.search = async function (req, res) {
    try{
         const posts =   await Post.search(req.body.searchTerm)
         res.json(posts)
    }catch(errors){
        res.json([])
    }/*
    Post.search(req.body.searchTerm).then((posts) => {
        res.json(posts)
    }).catch( () => {
        res.json([])
    })*/
}