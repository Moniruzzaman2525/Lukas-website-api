const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');


app.use(cors())
app.use(express())

// assignment12
// G7YlvVSoSB0K2HoS



const uri = "mongodb+srv://assignment12:G7YlvVSoSB0K2HoS@cluster0.hfl6b.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
    try {
        await client.connect();
        console.log('db connect');
        const servicesCollection = client.db("assignment12").collection("services");

        app.get('/services', async (req, res) => {
            const query = {};
            const cursor = servicesCollection.find(query);
            const services = await cursor.toArray();
            res.send(services)
        })
    }
    finally {

    }
}
run().catch(console.dir())

app.get('/', (req, res) => {
    res.send('Hello server is Running')
});

app.listen(port, () => {
    console.log('Listing port', port);
})