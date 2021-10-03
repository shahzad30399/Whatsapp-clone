//importing
import express from "express";
import mongoose from "mongoose";
import Pusher from "pusher";
import cors from "cors";

import Messages from "../whatsapp-backend/dbMessages.js";
//App config
const app = express();
const port = process.env.PORT || 9000;
//middleware
app.use(express.json());
app.use(cors());

// database config 
const connection_url = 'mongodb+srv://shah:shah1234@cluster0.wcttr.mongodb.net/mernstack?retryWrites=true&w=majority';
mongoose.connect(connection_url,{
    useNewUrlParser:true,
    useUnifiedTopology:true
}).then(()=>{
    console.log("success");
}).catch((err) =>{
    console.log("no connection");
});


const pusher = new Pusher({
    appId: "1273889",
    key: "abb4d1810af22d7758a4",
    secret: "aaf76f137654dde24e21",
    cluster: "eu",
    useTLS: true
  });
// ???
const db = mongoose.connection;
db.once('open',() =>{
    console.log("DB connected");

    const msgCollection = db.collection("messagecontents");
    const changeStream = msgCollection.watch();

    changeStream.on('change',(change) =>{
        console.log('change occur', change);

        if(change.operationType === 'insert' ){
            const messageDetails = change.fullDocument;
            pusher.trigger('messages','inserted',{
                name: messageDetails.name,
                Message: messageDetails.message,
                timestamp: messageDetails.timestamp
            });
        } else{
            console.log("Error triggerin pusher");
        }
    })
})

//api routes
app.get("/",(req,res)=>res.status(200).send('hellow world'));


app.get("/messages/sync", (req, res) => {
    Messages.find((err, data) =>{
        if(err){
            res.status(500).send(err);
        } else {
            res.status(200).send(data);
        }
    });
});

app.route("/messages/new").post((req, res) => {
    
    const dbMessage = req.body;
    console.log(req.body);
    Messages.create(dbMessage, (err,data) => {
        if(err){
            res.status(500).send(err);
            console.log(err);
        } else {
            res.status(201).send(data);
        }
    });
});
//listen
app.listen(port,() => {
    console.log(`Listening to port: ${port}`);
});