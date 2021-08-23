import axios from 'axios'

export default class RegistrationForm {
    constructor() {
        this._csrf = document.querySelector('[name="_csrf"]').value // select input data based on its name

        this.form = document.querySelector("#registration-form")

        this.allFields = document.querySelectorAll("#registration-form .form-control") //an array of multiple elements

        this.insertValidationElements()

        this.username = document.querySelector("#username-register")

        this.username.previousValue = ""

        this.email = document.querySelector("#email-register")

        this.email.previousValue = ""

        this.password = document.querySelector("#password-register")

        this.password.previousValue = ""

        this.username.isUnique = false

        this.email.isUnique = false

        this.events()
    }

    // Events
    events() {
        this.form.addEventListener("submit", e => { //Here, e is short for event.
            e.preventDefault() //We do not want the form to be submitted, which is default behavior here.
            this.formSubmitHandler()
        })


        this.username.addEventListener( "keyup" , () => {

            this.isDifferent(this.username, this.usernameHandler)

        })

        this.email.addEventListener( "keyup" , () => {

            this.isDifferent(this.email, this.emailHandler)

        })

        this.password.addEventListener( "keyup" , () => {

            this.isDifferent(this.password, this.passwordHandler)

        })

        this.username.addEventListener( "blur" , () => {

            this.isDifferent(this.username, this.usernameHandler)

        })

        this.email.addEventListener( "blur" , () => {

            this.isDifferent(this.email, this.emailHandler)

        })

        this.password.addEventListener( "blur" , () => {

            this.isDifferent(this.password, this.passwordHandler)

        })
    }

    // Methods:
    formSubmitHandler() {
        this.usernameImmediately()
        this.usernameAfterDelay()
        this.emailAfterDelay()
        this.passwordImmediately()
        this.passwordAfterDelay()

        if (this.username.isUnique &&
             !this.username.errors &&
              this.email.isUnique &&
              !this.email.errors &&
              !this.password.errors) {
            this.form.submit()
        }
    }


    isDifferent (el , handler) {
        if (el.previousValue != el.value) {
            //handler() //When we call handler function like this, JS will consider its this keyword to be the global object. Because there's no object before that is 
                      //obviously calling it.
             
              handler.call(this) //Call is a method that callable by function object. We can  bind handler function's this keyword on our overall object here.
        }
        el.previousValue = el.value
    }

    usernameHandler () {
        this.username.errors = false


       //Run some code immediately and run other code after a delay.

       this.usernameImmediately()

       clearTimeout(this.username.timer)

       this.username.timer = setTimeout(() => this.usernameAfterDelay(), 800 ) //wait for 3000ms
    }

    passwordHandler () {
        this.password.errors = false


       //Run some code immediately and run other code after a delay.

       this.passwordImmediately()

       clearTimeout(this.password.timer)

       this.password.timer = setTimeout(() => this.passwordAfterDelay(), 800 ) //wait for 3000ms
    }

    passwordImmediately () {
        if (this.password.value.length > 50) {
            this.showValidationError(this.password, "Password cannot exceed 50 characters.")
        }

        if (!this.password.errors) {
            this.hideValidationError(this.password)
        }
    }

    passwordAfterDelay () {
        if (this.password.value.length < 12) {
            this.showValidationError(this.password, "Password must be at least 12 characters.")
        }
    }

    emailHandler () {
        this.email.errors = false


       //Run some code immediately and run other code after a delay.


       clearTimeout(this.email.timer)

       this.email.timer = setTimeout(() => this.emailAfterDelay(), 800 ) //wait for 3000ms
    }

    emailAfterDelay () {
        if (!/^\S+@\S+$/.test(this.email.value)) {

            this.showValidationError(this.email, "You must provide a valid email address.")
        }

        if (!this.email.errors) {
            axios.post('/doesEmailExist' , {_csrf: this._csrf, email: this.email.value}).then((response) => {

                if (response.data) { // If the email already exists.
                    this.email.isUnique = false
                    this.showValidationError(this.email, "That email is already being used.")

                } else {
                    this.email.isUnique = true
                    this.hideValidationError(this.email)
                }
                        }).catch(() => {
                            console.log("Please try again later.")
            })
        }
    }

    usernameImmediately () {
        //1: If you includes a speical character,i.e., a character that is not alphanumeric:
        //Argument: in the server side, we leverage the validate package from npm. However, in this case, it is the JS that going to run on the client side.
        //So, in this case, I don't want to have to bundle package from Javascript. <-- too large for client-side to download easily.
       if (this.username.value != "" && !/^([a-zA-Z0-9]+)$/.test(this.username.value)) {
        this.showValidationError(this.username, "Username can only contain letters and numbers")
       }

       if (this.username.value.length > 30) {

        this.showValidationError(this.username, "Username cannot exceed 30 characters")
       }

       if (!this.username.errors) {
        this.hideValidationError(this.username)
       }

       //2: More than 30 chars for username:
    }

    hideValidationError (el) {

        el.nextElementSibling.classList.remove("liveValidateMessage--visible")
    }


    showValidationError (el, message) {

        el.nextElementSibling.innerHTML = message // next element, because it will be the red alert block we have set in the previous lesson.

        el.nextElementSibling.classList.add("liveValidateMessage--visible")

        el.errors = true

    }

    usernameAfterDelay () {
       if (this.username.value.length < 3) {
         this.showValidationError(this.username, "Username must be at least 3 characters.")
       }

       if (!this.username.errors) {
        axios.post('/doesUsernameExist', {_csrf: this._csrf, username : this.username.value}).then((response ) => {

            if (response.data) {
                this.showValidationError(this.username, "That username is already taken.")
                this.username.isUnique = false
            } else {
                this.username.isUnique = true
            }
        }).catch( () => {
            console.log("Please try again later.")
        })
       }
    }

    insertValidationElements() {
        this.allFields.forEach( function(el) {

            el.insertAdjacentHTML( 'afterend' , '<div class="alert alert-danger small liveValidateMessage"></div>') //right after each form of fields
        })
    }
}