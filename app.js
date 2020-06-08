const options = {}
const express       = require('express');
const app           = express();
var server          = require('http').Server(options, app);
const bodyParser    = require('body-parser');
var mkFhir = require('fhir.js');
const baseServerUrl = 'http://hapi.fhir.org/baseR4';
var client = mkFhir({
    baseUrl: baseServerUrl
});
const axios = require('axios');

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
var chosenPatientData
const significantResources = ["Patient", "Observation", "MedicationStatement"]
const timeLineResources = ["Observation", "MedicationStatement"]

server.listen(80)

app.post('/showpatlist', function(request, response){
    if(request.body.name == ""){
        var searchPatients = client
        .search( {type: 'Patient', query: { }})
        .then(function(res) {
            bundle = res.data
            response.send(200, getPatientsListView(bundle))
            return
        })
    }
    else{
        var searchPatients = client
        .search( {type: 'Patient', query: {family: request.body.name }})
        .then(function(res) {
            bundle = res.data
            response.send(200, getPatientsListView(bundle))
            return
        })
    }
})

app.post('/nextpag', function(request, response){
    var hasNext = false;
    for(var link of bundle.link) {
        if(link.relation == "next") {
            hasNext = true;
            break;
        }
    }
    if(hasNext) {
        client.nextPage({bundle: bundle})
            .then(function(res) {
                bundle = res.data
                response.send(200, getPatientsListView(bundle))
                return
            })
    }
})

app.post('/prevpag', function(request, response){
    var hasPrev = false;
    for(var link of bundle.link) {
        if(link.relation == "previous") {
            hasPrev = true;
            break;
        }
    }
    if(hasPrev) {
        client.prevPage({bundle: bundle})
            .then(function(res) {
                bundle = res.data
                response.send(200, getPatientsListView(bundle))
                return
            })
    }
})

app.post('/patdet', function(request, response){
    chosenPatientData = []

    axios.get(baseServerUrl + "/Patient/" + request.body.id + "/$everything")
        .then(fhirResp => {
            handlePatientEverythingBundle(fhirResp.data, response);
        })
        .catch(error => {
            console.log(error);
        });
})

app.post('/timeLineForMonth', function(request, response) {
    var monthDate = new Date(request.body.monthDate);
    var respToClient = getTimeLineView(monthDate, chosenPatientData);
    response.send(200, respToClient)
    return
})

app.post('/resdet', function(request, response) {
    var resType = request.body.resType;
    var resId = request.body.resId;

    axios.get(baseServerUrl + "/" + resType + "/" + resId)
        .then(function(fhirResp) {
            var resource = fhirResp.data
            var html_resp = "<h4 class='cardHeader'>" + resType + "</h4>"
            html_resp += "<table>"
            var fieldsWithText = []
            if(resType == "Observation") {
                fieldsWithText = ["category", "code", "referenceRange", "interpretation", "method"];
                if(resource.valueQuantity != undefined) {
                    var value = resource.valueQuantity.value;
                    var unit = resource.valueQuantity.unit;
                    if(value != undefined && unit != undefined) {
                        html_resp += "<tr><td>value</td><td>" + value + " " + unit + "</td></tr>"
                    }
                }
            }
            else if(resType == "MedicationStatement") {
                fieldsWithText = ["medicationCodeableConcept", "category", "reasonCode", "note", "dosage"]
                if(resource.medicationReference != undefined 
                    && resource.medicationReference.display != undefined) {
                        html_resp += "<tr><td>medication</td><td>" 
                            + resource.medicationReference.display + "</td></tr>"
                    }
            }
            html_resp += "<tr><td>status</td><td>" + resource.status + "</td></tr>"
            for(field of fieldsWithText) {
                html_resp += "<tr><td>" + field + "</td><td>"
                if(resource[field] != undefined && resource[field].text != undefined) {
                    html_resp +=  resource[field].text
                }
                else if(resource[field] != undefined &&
                     resource[field][0] != undefined &&
                        resource[field][0].text != undefined) {
                    html_resp +=  resource[field][0].text
                }
                else {
                    html_resp += "unknown"
                }
                html_resp += "</td></tr>"
            }
            html_resp += "</table>"
            response.send(200, html_resp)
            return
        })
        .catch(error => {
            console.log(error);
        });
})

function getPatientsListView(patientsBundle) {
    var html_list = "<table><tr><th>Given name</th><th>Family name</th><th>Details</th></tr>"
    for(var i = 0; i < patientsBundle.entry.length; i++) {
        html_list += "<tr><td>" + patientsBundle.entry[i].resource.name[0].given[0] +
            "</td><td>" + patientsBundle.entry[i].resource.name[0].family + "</td>" + 
            "<td><button onclick=details('" + patientsBundle.entry[i].resource.id + "') type='button' class='btn btn-light'>Details</button></td></tr>"
    }
    html_list += "</table>"
    return html_list
}

function getPatientDetailsView(resource) {
    var html_resp = ""
    html_resp += "<table><tr><td>Family name: </td><td>" + resource.name[0].family + "</td></tr>"
    html_resp += "<tr><td>Given name: </td><td>" + resource.name[0].given[0] + "</td></tr>"
    html_resp += "<tr><td>Birth date: </td><td>" + resource.birthDate + "</td></tr>"
    html_resp += "<tr><td>Gender: </td><td>" + resource.gender + "</td></tr>"
            if(resource.address == undefined){
                html_resp += "<tr><td>City: </td><td>" + "unknown" + "</td></tr>"
                html_resp += "<tr><td>State: </td><td>" + "unknown" + "</td></tr>"
                html_resp += "<tr><td>Postal code: </td><td>" + "unknown" + "</td></tr>"
            }
            else{
                html_resp += "<tr><td>City: </td><td>" + resource.address[0].city+ "</td></tr>"
                html_resp += "<tr><td>State: </td><td>" + resource.address[0].state+ "</td></tr>"
                html_resp += "<tr><td>Postal code: </td><td>" + resource.address[0].postalCode+ "</td></tr>"
            }
            if(resource.generalPractitioner == undefined){
                html_resp += "<tr><td>General Practicioner: </td><td>" + "unknown" + "</td></tr>"
            }
            else{
                html_resp += "<tr><td>General Practicioner: </td><td>" + resource.generalPractitioner[0].display+ "</td></tr>"
            }
            html_resp += "<tr><td>Deceased time: </td><td>" + resource.deceasedDateTime+ "</td></tr>"
            if(resource.communication == undefined){
                html_resp += "<tr><td>Language: </td><td>" + "unknown" + "</td></tr>"
            }
            else{
                html_resp += "<tr><td>Language: </td><td>" + resource.communication[0].language.text+ "</td></tr>"
            }
            if(resource.telecom != undefined){
                for(var j = 0; j < resource.telecom.length; j++){
                    html_resp += "<tr><td>" + resource.telecom[j].system + "</td><td>" + resource.telecom[j].value + "</td></tr>"
                }
            }
            html_resp += "</table>"
            return html_resp;
}

function handlePatientEverythingBundle(evBundle, response) {
    var bundleImportantResources = evBundle.entry
        .filter(ent => {
            return significantResources.includes(ent.resource.resourceType);
        })
    for(res of bundleImportantResources) {
        chosenPatientData.push(res);
    }
    var hasNext = false;
    for(var link of evBundle.link) {
        if(link.relation == "next") {
            hasNext = true;
            break;
        }
    }
    if(hasNext) {
        client.nextPage({bundle: evBundle})
            .then(function(res) {
                handlePatientEverythingBundle(res.data, response);
            })
    }
    else {
        sendPatientEverythingToClient(response);
    }
}

function sendPatientEverythingToClient(response) {
    var respToClient = {
        patientDetails: "",
        timeLine: "",
        initialMonth: ""
    }

    var maxEffectiveDate = findMaxEffectiveDate(chosenPatientData);
    var now = new Date();
    if(maxEffectiveDate > now) {
        maxEffectiveDate = now;
    }
    if(maxEffectiveDate != null) {
        respToClient.initialMonth = formatDate(maxEffectiveDate.getFullYear(), 
            maxEffectiveDate.getMonth());
        var initialMonthDate = new Date(maxEffectiveDate.getFullYear(), maxEffectiveDate.getMonth());
        respToClient.timeLine = getTimeLineView(initialMonthDate, chosenPatientData);
    }
    for(var i = 0; i < chosenPatientData.length; i++){
         if(chosenPatientData[i].resource.resourceType == "Patient"){
            respToClient.patientDetails = getPatientDetailsView(chosenPatientData[i].resource);
            break;
        }
    }
    response.send(200, respToClient)
    return
}

function findMaxEffectiveDate(entries) {
    var maxDate = null
    for(ent of entries) {
        var resDate = null
        if(timeLineResources.includes(ent.resource.resourceType)) {
            if(ent.resource.effectiveDateTime != undefined) {
                resDate = new Date(ent.resource.effectiveDateTime);
            }
            else if(ent.resource.effectiveInstant != undefined) {
                resDate = new Date(ent.resource.effectiveInstant);
            }
            else if(ent.resource.effectivePeriod != undefined) {
                resDate = new Date(ent.resource.effectivePeriod.end);
            }
            if(resDate != null) {
                if(maxDate == null || resDate > maxDate) {
                    maxDate = resDate;
                }
            }
        }
    }
    return maxDate;
}

function getTimeLineView(monthDate, entries) {
    var dayToResources = assignResourcesToDaysOfMonth(monthDate, entries);
    var html_resp = "";
    for(day in dayToResources) {
        if(dayToResources[day].length > 0) {
            html_resp += "<h4 class='offset-sm-2'>" + formatDate(monthDate.getFullYear(),
             monthDate.getMonth(), day)  + "</h4>";
            for(res of dayToResources[day]) {
                html_resp += "<div class='row'>";
                html_resp += "<div class='col-sm-4 timeLineLeft'><h6>" +
                         res.dateDescription + "</h6>";
                html_resp += "<button type='button' class='btn btn-sm btn-light' onclick=resourceDetails('" +
                        res.resourceType + "','" + res.id +
                        "')>Details</button></div>"
                html_resp += "<div class='col-sm-8 timeLineRight'>" + 
                        "<h5>" + res.resourceType + "</h5><p>" + res.description + "</p></div>";
                html_resp += "</div>";
            }
        }
    }
    return html_resp;
}

function assignResourcesToDaysOfMonth(monthDate, entries) {
    var dayToResources = {}
    var monthEndDate
    for(var tmpDate = new Date(monthDate);
         tmpDate.getMonth() == monthDate.getMonth();
         tmpDate.setDate(tmpDate.getDate() + 1) ) {
             dayToResources[tmpDate.getDate()] = []
             monthEndDate = tmpDate
         }
    for(ent of entries) {
        if(timeLineResources.includes(ent.resource.resourceType)) {
            if(ent.resource.effectiveDateTime != undefined 
                || ent.resource.effectiveInstant != undefined
                || ent.resource.effectiveTiming != undefined) {
                    var resourceDates = [];
                    if(ent.resource.effectiveDateTime != undefined) {
                        resourceDates = [ent.resource.effectiveDateTime];
                    }
                    else if(ent.resource.effectiveTiming != undefined) {
                        if(ent.resource.effectiveTiming.event != undefined) {
                            resourceDates = ent.resource.effectiveTiming.event;
                        }
                    }
                    else {
                        resourceDates = [ent.resource.effectiveInstant];
                    }
                    for(var resourceDateText of resourceDates) {
                        var resourceDate = new Date(resourceDateText);
                        if(resourceDate.getFullYear() != monthDate.getFullYear()) {
                            continue;
                        }
                        var dateDescription;
                        if(resourceDateText.includes("T")) {
                            dateDescription = formatTime(resourceDate);
                        }
                        else {
                            dateDescription = resourceDateText;
                        }
                        if(resourceDateText.length < 10) { // YYYY or YYYY-MM
                            if(resourceDateText.length < 5 
                                || resourceDate.getMonth() == monthDate.getMonth()) {
                                    for(var tmpDate = new Date(monthDate);
                                        tmpDate.getMonth() == monthDate.getMonth();
                                        tmpDate.setDate(tmpDate.getDate() + 1)) {
                                            dayToResources[tmpDate.getDate()].push(
                                                getResourceTimeLineData(ent.resource,
                                                    resourceDate, dateDescription));
                                    }
                                }
                        }
                        else if(resourceDate.getMonth() == monthDate.getMonth()) {
                            dayToResources[resourceDate.getDate()].push(
                                getResourceTimeLineData(ent.resource, resourceDate, dateDescription));
                        }
                    }
            }
            else if(ent.resource.effectivePeriod != undefined) {
                var resStartDateText = ent.resource.effectivePeriod.start;
                var resEndDateText = ent.resource.effectivePeriod.end;
                var resStartDate = new Date(resStartDateText);
                var resEndDate = new Date(resEndDateText);
                var resMonthStart = monthDate;
                if(resMonthStart < resStartDate) {
                    resMonthStart = resStartDate;
                }
                var resMonthEnd = monthEndDate;
                if(resMonthEnd > resEndDate) {
                    resMonthEnd = resEndDate;
                }
                var dateDescription = formatDateTime(resStartDate) + " - " + formatDateTime(resEndDate);
                for(var tmpDate = new Date(resMonthStart);
                    tmpDate <= resMonthEnd;
                    tmpDate.setDate(tmpDate.getDate() + 1 )) {
                        var resourceDate = tmpDate;
                        if(tmpDate.getTime() == resStartDate.getTime()) {
                            resourceDate = resStartDate;
                        }
                        else if(tmpDate.getTime() == resEndDate.getTime()) {
                            resourceDate = resEndDate;
                        }
                        dayToResources[tmpDate.getDate()].push(
                            getResourceTimeLineData(ent.resource,
                                 resourceDate, dateDescription));
                }
            }
        }
    }
    for(key in dayToResources) {
        dayToResources[key] = dayToResources[key].sort((r1, r2) => {
            if(r1.date < r2.date) {
                return -1;
            }
            if(r1.date > r2.date) {
                return 1;
            }
            return 0;
        })
    }
    return dayToResources;
}

function getResourceTimeLineData(res, resDate, dateDescription) {
    var description = ""
    if(res.text != undefined && res.text.div != undefined) {
        description = res.text.div;
    }
    else {
        if(res.resourceType == "Observation") {
            if(res.code != undefined && res.code.text != undefined) {
                description = res.code.text;
            }
        }
        else if(res.resourceType == "MedicationStatement") {
            if(res.medicationCodeableConcept != undefined && res.medicationCodeableConcept.text != undefined) {
                description = res.medicationCodeableConcept.text;
            }
        }
    }   
    return {
        id: res.id,
        resourceType: res.resourceType,
        description: description,
        date: new Date(resDate),
        dateDescription: dateDescription
    }
}

function formatDateTime(dateTime) {
    return formatDate(dateTime.getFullYear(),
     dateTime.getMonth(), dateTime.getDate()) 
     + " " + formatTime(dateTime);
}

function formatDate(year, month, day) {
    var dateFormatted = year + "-" + twoDigitNumber(month+1);
    if(day) {
        dateFormatted += "-" + twoDigitNumber(day);
    }
    return dateFormatted;
}

function formatTime(dateTime) {
    return twoDigitNumber(dateTime.getHours()) + ":" + twoDigitNumber(dateTime.getMinutes());
}

function twoDigitNumber(number) {
    return number < 10 ? "0" + number : number;
}