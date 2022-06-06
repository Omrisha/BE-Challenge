const fs = require('fs');
const turbo = require('turbo-http');
const port = +process.argv[2] || 3000;

const client = require('redis').createClient();
const server = turbo.createServer(serverApp);
client.on('error', (err) => console.log('Redis Client Error', err));

client.on('ready', async () => {
    await client.ping();
    console.log(`Example app listening at http://0.0.0.0:${port}`);
    server.listen(port);
})

const allCardsObj = '{"id": "ALL CARDS"}';
const readyMessage = '{"ready": true}';
const cards = (() => {
    let jsonCards = JSON.parse(fs.readFileSync('./cards.json'));
    jsonCards = jsonCards.map(card => Buffer.from(JSON.stringify(card)));
    return jsonCards;
})();

const length = cards.length

async function getMissingCard(key) {
    const currentCards = await client.incr(key)
    if (currentCards > length) {
        return allCardsObj;
    }

    return cards[currentCards - 1];
}

async function serverApp(req, res) {
    if (req.url[1] === 'c') {
        const card = await getMissingCard(req.url);
        res.end(card);
        return;
    }

    res.end(readyMessage);
    return;
}

client.connect();
