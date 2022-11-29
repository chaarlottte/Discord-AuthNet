# Discord AuthNet
Connect thousands of Discord accounts to your own network, and force them to join servers.

This is a really bad implementation of this that I hacked together in the span of 20 minutes, so don't expect much.

## Setup Instructions
To use this, you have to create a MySQL database. Set your database name and creds and everything in `config.json`. If this is running on a public server, make sure to 
use a secure password!

After it's all set up, create a table called `users`, and execute the following SQL:
```sql
CREATE TABLE `users` (
  `access_token` varchar(100) NOT NULL,
  `refresh_token` varchar(100) NOT NULL,
  `user_id` varchar(100) NOT NULL,
  `tag` varchar(100) NOT NULL,
  `ip` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL
);
```
If you're using XAMPP/phpmyadmin, this can be done at this linke - http://localhost/phpmyadmin/index.php?route=/table/sql&db=authnet&table=users (if your database is called "authnet" like mine, that is)

After you have your SQL database configured properly, go to the [Discord Developer Portal](https://discord.com/developers/applications) and create a new application. 
Call it whetever you want.

Then, go to the OAuth2/General page in the developer portal for your application. Add your redirect link here, in my case I just have it set to `http://localhost:8080/authorize`,
since I was just testing locally and didn't plan to distribute this.

While you're on this page, grab the Client ID and Client Secret, we'll need those in a minute. Also grab the Application ID and Public Key from your application's main page.

Put these into a file called `credentials.json`, like so:
```json
{
    "application_id": "your application id",
    "public_key": "your application public key",
    "client_secret": "your client secret",
    "bot_token": "your bot token (we'll go over this in a moment dw)",
    "redirect_url": "http://localhost:8080/authorize"
}
```

Obviously, set the `redirect_url` to your redirect URL.

Now, go to the "Bot" page on the developer panel, and click Add Bot. Grab the bot's token, and put it in the `credentials.json` file.

To invite this bot to servers, go to the URL Generator tab under OAuth2, click `bot`, click `Administrator`, then copy the URL and invite to whatever server.

**Note:** The bot must be in a server for members to be able to join it.

## Usage instructions
Now that everything is set up correctly, install all dependencies by running `npm i btoa express axios mysql2`.

Once you have run that, you can simply run `node index.js` to start the server.

Once you have users in the database, you can run `node user_join.js` and have them join a server that our previously mentioned bot is already in.

# TODO
- Automatically get new access tokens
- Fully implemented into a Discord bot, with verification, DMs, etc

# Contributing/bugs/suggestions
For bugs or suggestions, [open an issue](https://github.com/chaarlottte/Discord-AuthNet/issues/new)

For contributions, make a pull request.
