const fs = require('fs');
const express = require('express')

const app = express()
const port = +process.argv[2] || 3000

const client = require('redis').createClient()
client.on('error', (err) => console.log('Redis Client Error', err));

client.on('ready', () => {
    app.listen(port, '0.0.0.0', () => {
        console.log(`Example app listening at http://0.0.0.0:${port}`)
    })
})

const cardsData = fs.readFileSync('./cards.json');
const cards = JSON.parse(cardsData);
const length = cards.length
const allCardsObj = {id: "ALL CARDS"}

async function getMissingCard(key) {
    const currentCards = await client.incr(key)
    if (currentCards > length) {
        return allCardsObj;
    }

    return cards[currentCards - 1];
}

app.get('/card_add', async (req, res) => {
    res.send(await getMissingCard('u:' + req.query.id))
})

app.get('/ready', async (req, res) => {
    res.send({ready: true})
})

client.connect();
