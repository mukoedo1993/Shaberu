# Locally Use: #
You should have a local `.env` file like below:
See more [here](https://devcenter.heroku.com/articles/heroku-local#copy-heroku-config-vars-to-your-local-env-file) for reference:
```
#The real file name should be .env
#Set these variables either via .env. Or, if you want to deploy this via heroku, you could set these as Config Vars. <br>

# Deploying via heroku #
CONNECTIONSTRING=<connection string, no any quote>
PORT=<port value>
JWTSECRET=<secret string.>
SENDGRIDAPIKEY=<send grid key>