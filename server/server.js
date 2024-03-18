require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');

const routes = require('./routes/routes.js');


let app = express();
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: false }));
app.set('json spaces', 1);

app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.use(express.static(__dirname + '/../client'));

const mongoURI = process.env.MONGO_URI;
console.log(mongoURI);

mongoose.connect(mongoURI, { useNewUrlParser: true })
    .then(() => {
        app.use("/api", routes); // adds routes from routes file

        app.listen(8080, () => {
            console.log('Listening on port 8080');
            console.log('http://localhost:8080/');
        })
    });

app.get('/', function(req,res) {
    res.sendFile((path.join(__dirname + '/../client/index.html')));
});
