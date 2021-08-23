tips for email address: 
npm install validator


backup DEPRECATED for traditional callback function for asynchronous situations:
```
//User.js
User.prototype.login = function(callback){
    this.cleanUp()

    // CRUD Operations <- esp., contextually, R here...
    userCollection.findOne({username: this.data.username} , (err, attemptedUser) => {
        if(attemptedUser && attemptedUser.password == this.data.password){ //If it exists, then we have actually found the user, otherwise, the user just doesn't exist...
            //In this context, we need to make sure that this keyword will not comeback to bite us...
            // Because there is not an object that directly calls this function, so this will be considered as a global object here...
            //Arrow function: The benefits for arrow function are that it will not manipulate or change the this keyword. So, whatever, the keyword this is set outside the function,
            // is what will still equal.

          callback("Congrats!")

        }else{
            callback("Invalid username / password")
        }
    }) //first arguemnt: the pair of data to match, i.e., condition; second argument: a function once the matching of 1st arguemnt
                                                               // has finished and completed,  because we don't know how long it will take...
                            
}



//userController.js
exports.login = function(req, res){ 
    let user = new User(req.body)
    user.login( function(result) {
        //We are passing this function as an argument into login. And, when we are defining the login function, we are waiting for the 
        // perfect moment to call this function. In other words, we know that this function is not going to run until an appropriate moment once the database
        // action has the chance to complete. 
        res.send(result) // when the model call it <--callback function


    }) // It's the model, not the controller that deal with all our business object and manage our data.
    // However, we don't know how long the login method is going to take. Because it depends on database, it might take 5000 ms or 2000s, we just don;t
    // know...
    // traditional approach in course 57th: callback function:

}


```


References:
[1]: https://stackoverflow.com/questions/10500233/javascript-oop-method-definition-with-or-without-prototype