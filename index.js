const express = require('express');
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config();
const admin = require("firebase-admin");
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.we5az.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function verifyToken(req, res, next) {
    if (req.headers?.authorization?.startsWith('Bearer ')) {
        const token = req.headers.authorization.split(' ')[1];

        try {
            const decodedUser = await admin.auth().verifyIdToken(token);
            req.decodedEmail = decodedUser.email;
        }
        catch {

        }

    }
    next();
}
// create database collection
async function run() {
    try {
        await client.connect();
        const database = client.db("HondaBike");

        const BikeCollection = database.collection("bikes");
        const ReviewCollection = database.collection("reviews");
        const OrdersCollection = database.collection("orders")
        const UsersCollection = database.collection("users");

        // get bike API
        app.get('/bikes', async (req, res) => {
            const cursor = BikeCollection.find({});
            const bike = await cursor.toArray();
            res.send(bike);
        });

        // get limited bike API
        app.get('/bikes/home', async (req, res) => {
            const cursor = BikeCollection.find({}).limit(6);
            const bikes = await cursor.toArray();
            res.send(bikes);
        });

        // post bikes API
        app.post('/bikes', async (req, res) => {
            const bikes = req.body;

            const result = await BikeCollection.insertOne(bikes);
            res.json(result);
        });

        // delete single API
        app.delete('/bikes/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await BikeCollection.deleteOne(query);
            res.json(result);

        });

        // get single API 
        app.get('/purchase/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const singleBike = await BikeCollection.findOne(query);
            res.json(singleBike);
        });

        // add oder
        app.post("/addOrder", async (req, res) => {
            console.log(req.body);
            const result = await OrdersCollection.insertOne(req.body);
            res.send(result);
        });


        // get order
        app.get("/orders", async (req, res) => {
            const result = await OrdersCollection.find({}).toArray();
            res.send(result);
        });

        // delete order
        app.delete("/deleteOrder/:id", async (req, res) => {
            console.log(req.params.id);
            const result = await OrdersCollection.deleteOne({
                _id: ObjectId(req.params.id),
            });
            res.send(result);
        });

        // get my order
        app.get("/myOrder", async (req, res) => {
            const email = req?.query?.email;
            const query = { user_email: email }
            const cursor = OrdersCollection.find(query);
            const orders = await cursor.toArray();
            res.json(orders);
        });

        // update order status
        app.put('/updateOrder/:id', async (req, res) => {
            const order = req.body;
            console.log(req.body)
            const options = { upsert: true };
            const updatedOrder = {
                $set: { bike_status: order.bike_status }
            };
            const updateStatus = await OrdersCollection.updateOne({ _id: ObjectId(req.params.id) }, updatedOrder, options);
            res.json(updateStatus);
        });

        // get reviews API
        app.get('/reviews', async (req, res) => {
            const cursor = ReviewCollection.find({});
            const review = await cursor.toArray();
            res.send(review);
        });

        // post reviews API
        app.post('/reviews', async (req, res) => {
            const reviews = req.body;

            const result = await ReviewCollection.insertOne(reviews);
            res.json(result);
        });


        // get user API
        app.get('/users', async (req, res) => {
            const cursor = UsersCollection.find({});
            const user = await cursor.toArray();
            res.send(user);
        });

        // get single user APi
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await UsersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        })

        //  post user API
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await UsersCollection.insertOne(user);
            console.log(result);
            res.json(result);
        });

        // upsert user API
        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await UsersCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        });

        // make admin
        app.put('/users/admin', verifyToken, async (req, res) => {
            const user = req.body;

            const requester = req.decodedEmail;
            if (requester) {
                const requesterAccount = await UsersCollection.findOne({ email: requester });
                if (requesterAccount.role === 'admin') {
                    const filter = { email: user.email };
                    const updateDoc = { $set: { role: 'admin' } };
                    const result = await UsersCollection.updateOne(filter, updateDoc);
                    res.json(result);
                }
            }
            else {
                res.status(403).json({ message: 'You do not have access to make Admin' })
            }
        })

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