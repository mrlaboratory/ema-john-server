const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 3000
const app = express()
let dotenv = require('dotenv').config()
const jwt = require('jsonwebtoken')
const { MongoClient, ServerApiVersion , ObjectId} = require('mongodb');
// middleware
app.use(cors())
app.use(express.json())





const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization 
    if(!authorization){
        return res.status(401).send({error:true, message : 'Authorization field 1'})
    }
    const token = authorization.split(' ')[1]
    // console.log(authorization)
    jwt.verify(token, process.env.ACCESS_TOKEN, (err,decoded)=> {
        if(err){
            return res.status(401).send({error:true, message : 'Authorization field'})
        }
        // console.log('token verified')
        req.decoded = decoded
        next()
    })

}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qntinqa.mongodb.net/?retryWrites=true&w=majority`;
// console.log(uri)

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const notesCollection = client.db('data').collection('products')
        app.post('/jwt', (req, res) => {
            const user = req.body
            const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
                expiresIn: '1h'
            })
            res.send({ token })
        })

        app.get('/products',async (req,res)=> {
            const result = await notesCollection.find().toArray()
            res.send(result)
        })
      

        app.get('/totalProducts',async (req,res)=> {
            const result = await notesCollection.estimatedDocumentCount()
            res.send({totalProducts : result})
        })
        app.get('/products2', async (req,res)=> {
            const page = parseInt(req?.query?.page) || 1
            const limit = parseInt(req?.query?.limit) || 10
            const skip  = page * limit
            
            const result = await notesCollection.find().skip(skip).limit(limit).toArray()
          
            res.send(result)
        })

        app.post('/productsByIds',async (req,res)=> {
            const ids = req.body 
            const objectids = ids.map(id => new ObjectId(id))
            const query = {_id: {$in : objectids}}
            const result = await notesCollection.find(query).toArray()
            res.send(result)
        })


       
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);




app.get('/',(req,res)=> {
    res.send('server is running ')
})


app.listen(port,()=> {
    console.log(`server is running on this port ${port}`)
})