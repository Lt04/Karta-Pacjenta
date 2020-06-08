$(function(){
    $("#Startowy").show()
})

function ShowPatList(){
    axios.post('/showpatlist',{
        name: $("#lastname").val()
    })
    .then(function(response){
        $("#starterr").html(response.data)
    })
}

function NextPage(){
    axios.post('/nextpag',{
    })
    .then(function(response){
        $("#starterr").html(response.data)
    })
}

function PrevPage(){
    axios.post('/prevpag',{
    })
    .then(function(response){
        $("#starterr").html(response.data)
    })
}

function details(id){
    $("#PatDetails").show()
    $("#Startowy").hide()
    axios.post('/patdet', {
        id: id
    })
    .then(function(response){
        $("#patdet").html(response.data.patientDetails)
        $("#TimeLine").html(response.data.timeLine);
        $("#dataMonth").val(response.data.initialMonth);
    })
}

function resourceDetails(resType, resId) {
    $("#PatDetails").hide()
    $("#ResDetails").show()
    axios.post('/resdet', {
        resType: resType,
        resId: resId
    })
    .then(function(response){
        $("#resdet").html(response.data)
    })
}

function DetailsHide(){
    $("#PatDetails").hide()
    $("#Startowy").show()
}

function ResDetailsHide() {
    $("#PatDetails").show()
    $("#ResDetails").hide()
}

function chooseTimeLineMonth() {
    axios.post('/timeLineForMonth',{
        monthDate: $("#dataMonth").val()
    })
    .then(function(response){
        $("#TimeLine").html(response.data);
    })
}