let express = require('express');
let app = express();
let path = require('path');
let bodyParser = require('body-parser');

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: false }));
app.set('json spaces', 1);

app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.use(express.static(__dirname + '/client'));
// app.use(express.static(__dirname + '/static/css'));
// app.use(express.static(__dirname + '/static/js'));
// app.use(express.static(__dirname + '/../lib/'));

const server = app.listen(8080, function () {
    console.log('Listening on port %d', server.address().port);
    console.log('http://localhost:8080/');
});

app.get('/', function(req,res) {
    res.sendFile((path.join(__dirname + '/client/index.html')));
});

app.post('/email', function(req, res) {
    let email = req.body.email;
    console.log('---Received new email---');
    console.log('Design Name: ', email);

    let data;
    // try {
    //     data = await constellation.goldbar(langText, categories,
    //         {designName: designName,
    //             numDesigns: numDesigns,
    //             maxCycles: maxCycles,
    //             representation: representation,
    //         });
    //     res.status(200).send(data);
    // } catch (error) {
    //     console.log(error);
    //     res.status(405).send(String(error));
    // }
});

