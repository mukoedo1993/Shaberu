import axios from 'axios'

import DOMPurify from 'dompurify'

export default class Search {
    //1: Select DOM elements, and keep track of any useful data
    constructor () {
      this._csrf = document.querySelector('[name="_csrf"]').value

       this.injectHTML()
       this.headerSearchIcon = document.querySelector(".header-search-icon")
       this.overlay = document.querySelector(".search-overlay")
       this.closeIcon = document.querySelector(".close-live-search")
       this.inputField = document.querySelector("#live-search-field")
       this.resultsArea = document.querySelector(".live-search-results")
       this.loaderIcon = document.querySelector(".circle-loader") //As soon as someone is typing in this field of search (see the div class of live-search-results)

       this.typingWaitTimer 
       //waiting for 500ms to 700ms after it stopped typing new characters. Wait a tiny bit after they(users) stopped typing, and then send off a request.


       this.previousValue
       //Only if value in the field has changed, then we show a loading icon here.

       this.events()
    }


    //2: Events
    events() {
       this.inputField.addEventListener("keyup", () => this.keyPressHandler()) //So, once they click the key on the keyboard and release their finger from that key and then key comes up, 
                                                   // 

        this.closeIcon.addEventListener("click", () => {
            this.closeOverlay()
        })
        this.headerSearchIcon.addEventListener("click", (e) => {
            //prevent default behavior clicking on the link
            e.preventDefault()
            this.openOverlay()
        })
    }

    //3: Methods:
    keyPressHandler()
  {
    let value = this.inputField.value

    if (value == "") {
      clearTimeout(this.typingWaitTimer)

      //After that, hiding both loader icon and results.
      this.hideLoaderIcon()
      this.hideResultsArea()
      console.log("value ==empty string ")
    }
    
    if (value != "" && value != this.previousValue) {
      clearTimeout(this.typingWaitTimer)
      console.log("value !=empty string ")
      this.showLoaderIcon()

      this.hideResultsArea()

      this.typingWaitTimer = setTimeout( () => this.sendRequest() , 750)
      //If you typed alphabet 'p', and then wait for 2000ms, then you typed alphabet 'u', the clearTimeout will reset the time.
      //But if you finally typed 'y', and then wait for 3000ms, then typingWaitTimer will finish its mission.
    }

    this.previousValue = value
    //this.showLoaderIcon() //Commented out in course 93rd
  }


  sendRequest () {
    axios.post('/search', {_csrf: this._csrf, searchTerm: this.inputField.value}).then(response => {
      console.log(response.data)

      this.renderResultsHTML(response.data) //pass an array of raw Json data.

    }).catch(() => {
      alert("Hello, the request failed.")
    })
  
  }

  renderResultsHTML (posts) {
    
    if(posts.length) {
      console.log("if(posts.length)")

      //DOMPurify.sanitize could remove any malicious code of cross-site scripting... It will hollow out all potential dangerous content within dangerous divs.
      //It's alreay the worst scenario... It assumes that our backend database was already compromised, but we still want our frontend to work well.
      this.resultsArea.innerHTML = DOMPurify.sanitize( `    <div class="list-group shadow-sm">
      <div class="list-group-item active"><strong>Search Results</strong> (${posts.length > 1 ? `${posts.length} items found` : `${posts.length} item found`})</div>
     ${posts.map(post => {
       let postDate = new Date(post.createdDate)
       console.log(postDate)
      return `<a href="/post/${post._id}" class="list-group-item list-group-item-action">
      <img class="avatar-tiny" src="${post.author.avatar}"> <strong>${post.title}</strong>
      <span class="text-muted small">by ${post.author.username} on ${postDate.getMonth() + 1}/${postDate.getDate()}/${postDate.getFullYear()}</span>
    </a>`

     }).join('')} <!--join is the separating char.-->
    </div>`)
    }else {
      this.resultsArea.innerHTML = `<p class="alert alert-danger text-center shadow-sm">Sorry, we cannot find any results for that search.</p>`
    }

    this.hideLoaderIcon()
    this.showResultsArea()
  }

    showLoaderIcon()
    {
      console.log("showLOaderIcon called")
      this.loaderIcon.classList.add("circle-loader--visible")
    }

    hideLoaderIcon()
    {
      console.log("hideLOaderIcon called")
      this.loaderIcon.classList.remove("circle-loader--visible")
    }

    showResultsArea()
    {
      this.resultsArea.classList.add("live-search-results--visible")
    }
    hideResultsArea()
    {
      this.resultsArea.classList.remove("live-search-results--visible")
    }


    openOverlay()
 {
   this.overlay.classList.add("search-overlay--visible")

   //However, because 

   //This will focus the element, or in other words, place the user's cursor here, so that they can begin typing into the field. However, because of the div lives within
   // was hidden until this line of code ran, certain browsers will run into the issues that not be able to follow this element. What we can do to get around of this is 
   //after we make a search overlay visible, 

   setTimeout( () =>  this.inputField.focus(),50) //first argument: the function you want to run. Second argument: How long you are going to wait before running it.


  
 }

    closeOverlay()
 {
   this.overlay.classList.remove("search-overlay--visible")
 }
    injectHTML()
    {
        document.body.insertAdjacentHTML('beforeend', ` <div class="search-overlay"> <!--Delete the search-overlay class here.-->
        <div class="search-overlay-top shadow-sm">
          <div class="container container--narrow">
            <label for="live-search-field" class="search-overlay-icon"><i class="fas fa-search"></i></label>
            <input type="text" id="live-search-field" class="live-search-field" placeholder="What are you interested in?">
            <span class="close-live-search"><i class="fas fa-times-circle"></i></span>
          </div>
        </div>
    
        <div class="search-overlay-bottom">
          <div class="container container--narrow py-3">
            <div class="circle-loader"></div>
            <div class="live-search-results"></div>
          </div>
        </div>
      </div>`)
    }
}



