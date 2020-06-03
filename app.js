const options = {}
const express       = require('express');
const app           = express();
var server          = require('http').Server(options, app);
const bodyParser    = require('body-parser');
var mkFhir = require('fhir.js');
var client = mkFhir({
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
    client
    .search( {type: 'Patient', query: { 'birthdate': '1974' }})
    .then(function(res){
        var bundle = res.data;
        console.log(bundle.entry[0].resource.birthDate)
        var count = (bundle.entry && bundle.entry.length) || 0;
        console.log("# Patients born in 1974: ", count);
    })
    .catch(function(res){
        // Error responses
        if (res.status){
            console.log('Error', res.status);
        }

        // Errors
        if (res.message){
            console.log('Error', res.message);
        }
    });
    response.send(200)
    return
})