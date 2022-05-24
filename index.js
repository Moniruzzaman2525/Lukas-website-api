const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const cors = require('cors');
const jwt = require('jsonwebtoken');
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { ObjectID } = require('bson');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);


app.use(cors())
app.use(express.json())

// assignment12
// G7YlvVSoSB0K2HoS


const uri = "mongodb+srv://assignment12:G7YlvVSoSB0K2HoS@cluster0.hfl6b.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'UnAuthorized access' })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.send(403).send({ message: 'Forbidden Access' })
        }
        req.decoded = decoded;
        next();
    });
}

async function run() {
    try {
        await client.connect();
        const servicesCollection = client.db("assignment12").collection("services");
        const bookingCollection = client.db("assignment12").collection("booking");
        const userCollection = client.db("assignment12").collection("users");
        const profileCollection = client.db("assignment12").collection("profile");



        app.post('/create-payment-intent', verifyJWT, async (req, res) => {
            const service = req.body;
            const price = service.price;
            const amount = price * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: 'use',
                payment_method_types: ['card']
            });
            res.send({ clientSecret: paymentIntent.client_secret })

        })


        app.get('/services', async (req, res) => {
            const query = {};
            const cursor = servicesCollection.find(query);
            const services = await cursor.toArray();
            res.send(services)
        });

        app.delete('/delete/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await servicesCollection.deleteOne(query);
            res.send(result);
        });
        app.post('/add', async (req, res) => {
            const newItem = req.body;
            const result = await servicesCollection.insertOne(newItem);
            res.send(result);
        });


        app.post('/update', async (req, res) => {
            const newItem = req.body;
            const result = await profileCollection.insertOne(newItem);
            res.send(result);
        });

        app.get('/user', async (req, res) => {
            const email = req.query.email;
            const result = await profileCollection.findOne({ email })
            if (result) {
                res.send(result);
            }
            else {
                res.send('User not Found')
            }
        })

        app.get('/users', verifyJWT, async (req, res) => {
            const users = await userCollection.find().toArray();
            res.send(users)
        });


        app.put('/user/admin/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            const requester = req.decoded.email;
            const requesterAccount = await userCollection.findOne({ email: requester })
            if (requesterAccount.role == 'admin') {
                const filter = { email: email };
                const updateDoc = {
                    $set: { role: 'admin' },
                };
                const result = await userCollection.updateOne(filter, updateDoc);
                res.send(result);
            }
            else {
                res.status(403).send({ message: 'fobidden' })
            }
        });

        app.get('/admin/:email', async (req, res) => {
            const email = req.params.email;
            const user = await userCollection.findOne({ email: email });
            const isAdmin = user.role === 'admin';
            res.send({ admin: isAdmin });
        })


        app.delete('/delete/user/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await userCollection.deleteOne(query);
            res.send(result);
        });


        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' })
            res.send({ result, token });
        })
        app.get('/services/:id', async (req, res) => {
            const id = req.params?.id;
            const query = { _id: ObjectId(id) };
            const result = await servicesCollection.findOne(query);
            res.send(result)
        });


        app.get('/booking', async (req, res) => {
            const query = {};
            const cursor = bookingCollection.find(query);
            const services = await cursor.toArray();
            res.send(services)
        })
        app.post('/booking', async (req, res) => {
            const booking = req.body;
            console.log(booking);
            const result = await bookingCollection.insertOne(booking);
            res.send(result);
        });

        // app.get('/booking', verifyJWT, async (req, res) => {
        //     const decodedEmail = req.decoded.email
        //     console.log('decodedEmail', decodedEmail);
        //     const email = req.query.email;
        //     console.log("email", email);
        //     if (email === decodedEmail) {
        //         const query = { email: email }
        //         const cursor = bookingCollection.find(query)
        //         const items = await cursor.toArray()
        //         res.send(items)
        //     }
        //     else {
        //         // console.log(param);
        //         return res.status(403).send({ message: 'forbidden access' })

        //     }
        // })

        app.get('/order', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const email = req.query.email;
            console.log(email, decodedEmail);
            const query = { email: email };
            const cursor = bookingCollection.find(query);
            const addItems = await cursor.toArray();
            res.send(addItems)
        })

        app.get('/booking/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const booking = await bookingCollection.findOne(query);
            res.send(booking)
        })

        app.delete('/delete/booking/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await bookingCollection.deleteOne(query);
            res.send(result);
        });



    }
    finally {

    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello server is Running')
});

app.listen(port, () => {
    console.log('Listing port', port);
})