const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cm7riuy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


const verifyJWT = (req,res,next) =>{
  console.log('hitting verifyJWT');
  // console.log(req.headers.authorization);
  const authorization = req.headers.authorization;
  if(!authorization){
    return res.status(401).send({error:true, message: 'unauthorized access 401'})
  }
  const token = authorization.split(' ')[1];
  console.log('token inside verify jwt',token);

  jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SCRET, (error, decoded)=>{
    if(error){
      return res.status(403).send({error: true, message: 'unauthorized access 403'})
    }
    req.decoded = decoded;
    next();
  })
}

async function run() {
  try {

    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const serviceCollection = client.db("carDoctor").collection("services");

    const bookingCollection = client.db("carDoctor").collection("booking");
    

    // jwt
    app.post('/jwt',(req,res)=>{
      const user = req.body;
      // console.log(user);
      
      const token = jwt.sign(user, process.env.JWT_ACCESS_TOKEN_SCRET, {expiresIn: '1d'});
      // console.log(token);
      // token have normal number, so token must be convert in object 
      res.send({token});
    })

    // demo 
    app.get('/app', async(req,res)=>{
      res.send('aminul paise');
    })

    // services routes 
    app.get('/services', async(req, res)=>{
        const cursor = serviceCollection.find();
        const result = await cursor.toArray();
        // console.log('next1')
        res.send(result);
    })

    // get single data 
    app.get('/services/:id', async(req,res)=>{
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await serviceCollection.findOne(query);
        // console.log('next2')
        res.send(result);
    })

    // booking routes
    // get data from client side checkout form 
    app.post('/booking', async(req,res)=>{
      const booking = req.body;
      const result = await bookingCollection.insertOne(booking);
      // console.log('next3')
      res.send(result);
    })

    app.get('/booking', verifyJWT, async(req,res)=>{     
      // console.log(req.headers.authorization);
      // console.log(req.query);
      const decoded = req.decoded;
      console.log('came back after verify', decoded);
      if(decoded.email!==req.query.email){
        // console.log('next4')
        return res.send({error:1, message: 'forbidden access'})
      }

      let query = {};
      if(req.query?.email){
        query = { email: req.query.email };
        // console.log(query);
        // console.log('next5')
      }
      const result = await bookingCollection.find(query).toArray();
      res.send(result);
    })


    app.get('/booking/:id',async(req, res)=>{
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await bookingCollection.findOne(query);
        // console.log('next7')
        res.send(result); 
    })

    app.delete('/booking/:id', async(req,res)=>{
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await bookingCollection.deleteOne(query);
        // console.log('next8')
        res.send(result);
    })

    app.put('/booking/:id', async(req,res)=>{
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };

      const update = req.body;
      const updateAppointment = {
        $set: {
           name: update.name,
           email: update.email,
           service: update.service,
           date: update.date,
           phone: update.phone,
           massage: update.massage,
           phone: update.phone
        }
      }

      const result = await bookingCollection.updateOne(query, updateAppointment, options);
      // console.log('next10')
      res.send(result);

    
    })

    app.patch('/booking/:id', async(req,res)=>{
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateBooking = req.body;
      console.log(updateBooking);
      
      const updateDoc = {
        $set:{
          status: updateBooking.status
        }        
      }
      const result = await bookingCollection.updateOne(filter, updateDoc);
      // console.log('next11')
      res.send(result); 
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


app.get('/',(req,res)=>{
    res.send('doctor is running');
})

app.listen(port,()=>{
    console.log(`Server Side port ${port}`)
})