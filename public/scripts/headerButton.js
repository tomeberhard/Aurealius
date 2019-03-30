
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

$(".viewerChoice").click(function(){
  let btnClicked = $(this);

  userViewChoice(btnClicked);
});

//---functions---//

function userViewChoice (btnClicked) {

  let viewSelection = $(btnClicked).attr("id");

  if (viewSelection === "showActvityFeed") {
    $(".activity").removeClass("d-none");
  } else {
    $(".activity").addClass("d-none");
  }

}
