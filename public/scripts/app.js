$(function(){
    $("#Startowy").show()
})

var page = 0

function ShowPatList(){
    axios.post('/showpatlist',{
    })
    .then(function(response){

    })
    .catch(function(error){

    })
}