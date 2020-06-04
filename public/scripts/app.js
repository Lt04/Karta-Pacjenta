var page = 0
$(function(){
    $("#Startowy").show()
})

function ShowPatList(){
    axios.post('/showpatlist',{
        page: page,
        name: $("#lastname").val()
    })
    .then(function(response){
        $("#starterr").html(response.data)
    })
}

function NextPage(){
    page += 1
    axios.post('/showpatlist',{
        page: page,
        name: $("#lastname").val()
    })
    .then(function(response){
        $("#starterr").html(response.data)
    })
    .catch(function(error){
        page -= 1
    })
}

function PrevPage(){
    page -= 1
    axios.post('/showpatlist',{
        page: page,
        name: $("#lastname").val()
    })
    .then(function(response){
        $("#starterr").html(response.data)
    })
    .catch(function(error){
        page += 1
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