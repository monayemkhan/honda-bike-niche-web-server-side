const express = require('express');
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config();
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.we5az.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        await client.connect();
        const database = client.db("HondaBike");
        const BikeCollection = database.collection("bikes");
        const ReviewCollection = database.collection("reviews");

        //get bike api
        app.get('/bikes', async (req, res) => {
            const cursor = BikeCollection.find({});
            const bike = await cursor.toArray();
            res.send(bike);
        });

        //post bike api
        app.post('/bikes', async (req, res) => {
            const bikes = req.body;
            const result = await BikeCollection.insertOne(bikes);
            res.json(result);
        });

        //get review api
        app.get('/reviews', async (req, res) => {
            const cursor = ReviewCollection.find({});
            const bike = await cursor.toArray();
            res.send(bike);
        });

        //post review api
        app.post('/reviews', async (req, res) => {
            const bikes = req.body;
            const result = await ReviewCollection.insertOne(bikes);
            res.json(result);
        });

    }
    finally {
        // await client.close();
    }
}

run().catch(console.dir)
//server root directory
app.get('/', (req, res) => {
    res.send('Running honda bike server site');
});
// server port listening
app.listen(port, () => {
    console.log('Server Listening');
});