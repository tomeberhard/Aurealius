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

//---defaults user page choice to show actvity feed, not collections---//
// $(".viewerChoice").on("load", function() {
//   $(".activity").removeClass("d-none");
//   $(".userCollections").addClass("d-none");
// });

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
