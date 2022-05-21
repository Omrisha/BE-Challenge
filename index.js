const { Appsignal } = require("@appsignal/nodejs");

const appsignal = new Appsignal({
  active: true,
  name: "BE-Challenge"
});

const fs = require('fs');
const express = require('express')
const { expressMiddleware } = require("@appsignal/express");

const app = express()
const port = +process.argv[2] || 3000

const client = require('redis').createClient()
client.on('error', (err) => console.log('Redis Client Error', err));

client.on('ready', () => {
    app.listen(port, '0.0.0.0', () => {
        console.log(`Example app listening at http://0.0.0.0:${port}`)
    })
})

app.use(expressMiddleware(appsignal));

const cardsData = fs.readFileSync('./cards.json');
const cards = JSON.parse(cardsData);

function toHashMap (items) {
    var map = new Map();

    for (let index = 0; index < items.length; index++) {
        const element = items[index];
        
        map.set(element.id, element.name);
    }

    return map;
}

async function getMissingCard(key) {
    const currentCards = await client.incr(key)
    if (currentCards > cards.length) {
        return undefined;
    }

    return cards[currentCards - 1];
}

app.get('/card_add', async (req, res) => {
    const  key = 'user_id:' + req.query.id
    const missingCard = await getMissingCard(key);

    if(missingCard === undefined){
        res.send({id: "ALL CARDS"})
        return
    }
    
    res.send(missingCard)
})

app.get('/ready', async (req, res) => {
    res.send({ready: true})
})

client.connect();
