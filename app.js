const options = {}
const express       = require('express');
const app           = express();
var server          = require('http').Server(options, app);
const bodyParser    = require('body-parser');
var Fhir = require('fhir').Fhir;

var client = new Fhir({
    baseUrl: 'http://hapi.fhir.org/baseR4/Patient?_pretty=true'
});

app.use(express.static('public'));
app.use(bodyParser.json());                                           
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));        
app.use(bodyParser.urlencoded({ extended: true }));                     
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

server.listen(80)

app.post('/showpatlist', function(request, response){
    console.log(client)
    response.send(200)
    return
})