const options = {}
const express       = require('express');
const app           = express();
var server          = require('http').Server(options, app);
const bodyParser    = require('body-parser');
var mkFhir = require('fhir.js');
var client = mkFhir({
    baseUrl: 'http://hapi.fhir.org/baseR4'
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

var bundle

server.listen(80)

app.post('/showpatlist', function(request, response){
    var start = request.body.page*10
    var stop = start + 10
    if(request.body.name == ""){
        var searchPatients = client
        .search( {type: 'Patient', query: { }})
        .then(function(res) {
            bundle = res.data
            if(start >= res.data.entry.length || start < 0){
                response.send(403)
                return
            }
            var html_resp = "<table><tr><th>Given name</th><th>Family name</th><th>Details</th></tr>"
            for(var i = start; i < stop; i++){
                if(res.data.entry[i] == undefined){
                    break
                }
                html_resp += "<tr><td>" + res.data.entry[i].resource.name[0].given[0] + "</td><td>" + res.data.entry[i].resource.name[0].family + "</td>" + 
                "<td><button onclick=details('" + res.data.entry[i].resource.id + "') type='button' class='btn btn-light'>Details</button></td></tr>"
            }
            html_resp += "</table>"
            response.send(200, html_resp)
            return
        })
    }
    else{
        var searchPatients = client
        .search( {type: 'Patient', query: {family: request.body.name }})
        .then(function(res) {
            if(start >= res.data.entry.length || start < 0){
                response.send(403)
                return
            }
            var html_resp = "<table><tr><th>Given name</th><th>Family name</th><th>Details</th></tr>"
            for(var i = start; i < stop; i++){
                if(res.data.entry[i] == undefined){
                    break
                }
                html_resp += "<tr><td>" + res.data.entry[i].resource.name[0].given[0] + "</td><td>" + res.data.entry[i].resource.name[0].family + "</td>" + 
                "<td><button onclick=details('" + res.data.entry[i].resource.id + "') type='button' class='btn btn-light'>Details</button></td></tr>"
            }
            html_resp += "</table>"
            response.send(200, html_resp)
            return
        })
    }
})

app.post('/patdet', function(request, response){
    for(var i = 0; i<bundle.entry.length; i++){
        if(bundle.entry[i].resource.id == request.body.id){
            var html_resp = ""
            html_resp += "<table><tr><td>Family name: </td><td>" + bundle.entry[i].resource.name[0].family + "</td></tr>"
            html_resp += "<tr><td>Given name: </td><td>" + bundle.entry[i].resource.name[0].given[0] + "</td></tr>"
            html_resp += "<tr><td>Birth date: </td><td>" + bundle.entry[i].resource.birthDate + "</td></tr>"
            html_resp += "<tr><td>Gender: </td><td>" + bundle.entry[i].resource.gender + "</td></tr>"
            if(bundle.entry[i].resource.address == undefined){
                html_resp += "<tr><td>City: </td><td>" + "unknown" + "</td></tr>"
                html_resp += "<tr><td>State: </td><td>" + "unknown" + "</td></tr>"
                html_resp += "<tr><td>Postal code: </td><td>" + "unknown" + "</td></tr>"
            }
            else{
                html_resp += "<tr><td>City: </td><td>" + bundle.entry[i].resource.address[0].city+ "</td></tr>"
                html_resp += "<tr><td>State: </td><td>" + bundle.entry[i].resource.address[0].state+ "</td></tr>"
                html_resp += "<tr><td>Postal code: </td><td>" + bundle.entry[i].resource.address[0].postalCode+ "</td></tr>"
            }
            if(bundle.entry[i].resource.generalPractitioner == undefined){
                html_resp += "<tr><td>General Practicioner: </td><td>" + "unknown" + "</td></tr>"
            }
            else{
                html_resp += "<tr><td>General Practicioner: </td><td>" + bundle.entry[i].resource.generalPractitioner[0].display+ "</td></tr>"
            }
            html_resp += "<tr><td>Deceased time: </td><td>" + bundle.entry[i].resource.deceasedDateTime+ "</td></tr>"
            if(bundle.entry[i].resource.communication == undefined){
                html_resp += "<tr><td>Language: </td><td>" + "unknown" + "</td></tr>"
            }
            else{
                html_resp += "<tr><td>Language: </td><td>" + bundle.entry[i].resource.communication[0].language.text+ "</td></tr>"
            }
            if(bundle.entry[i].resource.telecom != undefined){
                for(var j = 0; j < bundle.entry[i].resource.telecom.length; j++){
                    html_resp += "<tr><td>" + bundle.entry[i].resource.telecom[j].system + "</td><td>" + bundle.entry[i].resource.telecom[j].value + "</td></tr>"
                }
            }
            html_resp += "</table>"
            break
        }
    }
    response.send(200, html_resp)
    return
})

/*function handlePatientsBundle(patientsBundle) {
    for(var ent of patientsBundle.entry) {
        var patientName = ent.resource.name;
        var Birth = ent.resource.birthDate
        for(var nm of patientName) {
            //console.log(nm.family + " " + nm.given);
        }
        //console.log('########');
    }
    //console.log('********************');
    var hasNext = false;
    for(var link of patientsBundle.link) {
        if(link.relation == "next") {
            hasNext = true;
            break;
        }
    }
    if(hasNext) {
        client.nextPage({bundle: patientsBundle})
            .then(function(res) {
                handlePatientsBundle(res.data);
            })
    }
}*/