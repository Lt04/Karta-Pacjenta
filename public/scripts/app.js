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
        $("#patdet").html(response.data)
    })
}

function DetailsHide(){
    $("#PatDetails").hide()
    $("#Startowy").show()
}