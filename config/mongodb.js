const { MongoClient } = require('mongodb');

let db;
let client;

async function connect() {
    try {
        client = new MongoClient(process.env.MONGO_URI);
        await client.connect();
        db = client.db();
        console.log('✓ Conectado a MongoDB Atlas');
    } catch (err) {
        console.error('Error conectando a MongoDB:', err);
        throw err;
    }
}

function getDb() {
    return db;
}

async function close() {
    if (client) {
        await client.close();
    }
}

module.exports = { connect, getDb, close };