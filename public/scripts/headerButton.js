//-------------------image preview------------------------------------------//
  var loadFile = function(event) {
    var reader = new FileReader();
    reader.onload = function(){
      var output = document.getElementById("bioImagePreview");
      output.src = reader.result;
    };
    reader.readAsDataURL(event.target.files[0]);
    $("#bioImagePreview").removeClass("d-none");
    $("#bioImage").addClass("d-none");
  };


//---close image preview when user presses "close" button---//
var abortPreview = function(event){
    $("#userBioForm")[0].reset();
    $("#bioImagePreview").attr("src", "");
    $("#bioImagePreview").addClass("d-none");
    $("#bioImage").removeClass("d-none");
};

//---User collection pop-up field controls---//
$("#collectionTextArea").on("keyup", function(){

  let textInput = $("#collectionTextArea").val();

  $("#collectionTextArea").attr("name", "grouping");

  if (textInput != "") {
    $("#collectionSelector").prop("disabled", true);
  } else {
    $("#collectionSelector").prop("disabled", false);
  }

});

$("#collectionSelector").on("change", function(){

  let selectionMade = $("#collectionSelector :selected").text();

  console.log(selectionMade);

  if (selectionMade) {
    $("#collectionTextArea").attr("name", "");
  } else {
    $("#collectionTextArea").attr("name", "grouping");
  }

});

//---user page view selection---//
$(".viewerChoice").click(function(){
  let btnClicked = $(this);

  userViewChoice(btnClicked);
});

//---functions---//

function userViewChoice (btnClicked) {

  let viewSelection = $(btnClicked).attr("id");

  if (viewSelection === "showActvityFeed") {
    $(".activity").removeClass("d-none");
    $(".userCollections").addClass("d-none");
  } else {
    $(".activity").addClass("d-none");
    $(".userCollections").removeClass("d-none");
  }

}
