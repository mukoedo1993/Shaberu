import DOMPurify from 'dompurify'

export default class Chat {
    constructor () {
        alert("Chat feature is loading")


        this.openedYet = false
        this.chatWrapper = document.querySelector("#chat-wrapper")
        this.openIcon = document.querySelector(".header-chat-icon")

        this.injectHTML()
        this.chatLog = document.querySelector("#chat")

        this.chatField = document.querySelector("#chatField")
        this.chatForm = document.querySelector("#chatForm")


        this.closeIcon = document.querySelector(".chat-title-bar-close") //Because this element doesn't even exist before we inject the HTML.

        this.events()


        // Create a few properties select the text field.


    }

    // Events
    events() {
        this.chatForm.addEventListener("submit", (e) => {
            e.preventDefault() //When this form is submitted, we want to prevent a hard reload. We want to stop that default behavior.
            this.sendMessageToServer()

        })

        this.openIcon.addEventListener("click", () => this.showChat())

        this.closeIcon.addEventListener("click", () => this.hideChat())
    }

    // Methods
    sendMessageToServer() {
        //Argument: Note that all messages will not be sent back to the sender. We must add some HTML here.
        //Here, we make a message from sender showed as dark blue, and, a message, from receiver, showed as light blue.
        this.socket.emit('chatMessageFromBrowser', {message: this.chatField.value})

        this.chatLog.insertAdjacentHTML('beforeend', DOMPurify.sanitize(`
        <div class="chat-self">
        <div class="chat-message">
          <div class="chat-message-inner">
           ${this.chatField.value} test here line 52nd of chat.js file.
          </div>
        </div>
        <img class="chat-avatar avatar-tiny" src="${this.avatar}">
      </div>
        
        `))

        this.chatLog.scrollTop = this.chatLog.scrollHeight //To scroll down all of its height.
        this.chatField.value = ''
        
        this.chatField.focus()
    }

    hideChat () {
        this.chatWrapper.classList.remove("chat--visible") 


    }

    showChat () {

        // For the first time, it is false. But once it is called, it will be true.
        if (!this.openedYet) {
            this.openConnection()
        }

        this.openedYet = true
        this.chatWrapper.classList.add("chat--visible") 

        this.chatField.focus() //So, once we click the chat icon, our cursor will be blinking inside the chatbox.
    }

    openConnection () {

        this.socket = io() //It will open a connection between the browser and the server.

        this.socket.on('welcome', (data) => {
            this.username = data.username
            this.avatar = data.avatar

        })
        this.socket.on('chatMessageFromServer' , (data)  => {
          this.displayMessageFromServer(data)
        }) 
    }

    displayMessageFromServer (data) {
        alert(data.message)
       
        this.chatLog.insertAdjacentHTML('beforeend', DOMPurify.sanitize(`      <div class="chat-other">
        <a href="/profile/${data.username}"><img class="avatar-tiny" src="${data.avatar}"></a>
        <div class="chat-message"><div class="chat-message-inner">
          <a href="/profile/${data.username}"><strong>${data.username}:</strong></a>
           ${data.message}
        </div></div>
      </div>`))
      
      this.chatLog.scrollTop = this.chatLog.scrollHeight //To scroll down all of its height.

     
    }
//
    injectHTML() {
        this.chatWrapper.innerHTML = `
        <div class="chat-title-bar">Chat <span class="chat-title-bar-close"><i class="fas fa-times-circle"></i></span></div>
        <div id="chat" class="chat-log"></div>

        <form id="chatForm" class="chat-form border-top">
        <input type="text" class="chat-field" id="chatField" placeholder="Type a message…" autocomplete="off">
      </form>
        `
    }
}