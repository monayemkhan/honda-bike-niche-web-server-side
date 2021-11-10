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


//server root directory
app.get('/', (req, res) => {
    res.send('Running honda bike server site');
});
// server port listening
app.listen(port, () => {
    console.log('Server Listening');
});