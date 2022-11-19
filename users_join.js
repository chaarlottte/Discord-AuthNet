const mysql = require("mysql2")
const axios = require("axios")
const readline = require("readline")

const config = require("./config.json")
const creds =  require("./credentials.json")
const { exit } = require("process")

let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

var pool = mysql.createPool({
    host: config.host,
    user: config.username,
    password: config.password,
    database: config.name,
})

let guildData = {
    name: ""
}

let success = 0;

function ask(question) {
    return new Promise(resolve => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    })
}

function join(guildId, user_id, tag, access_token) {
    axios.put(`https://discordapp.com/api/v6/guilds/${guildId}/members/${user_id}`, {
        "access_token": access_token
    }, { headers: {"Authorization": `Bot ${creds.bot_token}`} }).then((resp) => {
        if(resp.status == 201) {
            console.log(`Successfully had ${tag} join ${guildData.name}.`)
            success = success + 1;
        } else if(resp.status == 204) {
            console.log(`${tag} is already a member of ${guildData.name}.`)
            success = success + 1;
        } else {
            console.log(`Was not able to make ${tag} join ${guildData.name}.`)
        }
    }, (error) => {
        console.log(error)
    });
}

async function getGuildData(guildId) {
    axios.get(`https://discordapp.com/api/v6/guilds/${guildId}/preview`, 
    { headers: {"Authorization": `Bot ${creds.bot_token}`} }).then((resp) => {
        guildData.name = resp.data.name
        return resp.data
    }, (error) => {
        console.log(error)
    });
}

ask("What is the ID of the guild you want the users to join? > ").then(guildId => {
    getGuildData(guildId)
    pool.query(`SELECT * FROM users`, (err, results) => {
        if (err) throw err
        for (let i = 0; i < results.length; ++i) {
            let user_id = results[i]?.user_id
            let access_token = results[i]?.access_token
            let tag = results[i]?.tag
            join(guildId, user_id, tag, access_token)
        }
    })
});