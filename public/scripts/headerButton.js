// $("#flexBtn").click(function() {
//   let btnClicked = $(this);
//
//   toggleDestination(btnClicked);
// })

// $("#collectionSelector").click(function(){
//   const btnClicked = $(this);
//
//   // userCollectionInputChoice(btnClicked);
// });

$("#collectionTextArea").on("keyup", function(){
  let textInput = $("#collectionTextArea").val();

  if (textInput != "") {
    $("#collectionSelector").prop("disabled", true);
  } else {
    $("#collectionSelector").prop("disabled", false);
  }

});

$("#collectionSelector").click(function(){
  
  let selectionMade = $("#collectionSelector :selected").text();

  alert(selectionMade);
})





// $("#saveBtn").submit(function(){
//
  // if (textInput === "" && selectionMade =! """ ) {
  //   $("#collectionTextArea").prop("disabled", false);
  // }

// });

$(".viewerChoice").click(function(){
  let btnClicked = $(this);

  userViewChoice(btnClicked);
})

//---functions---//

// function toggleDestination (btnClicked) {
//
//   let toggler = $(btnClicked).text();
//
//   if (toggler === "Your Gratitude") {
//     $("#flexBtn").text("Activity Page").attr("href", "/index");
//   } else {
//     $("#flexBtn").text("Your Gratitude").attr("href", "/user");
//   }
// }

function userViewChoice (btnClicked) {

  let viewSelection = $(btnClicked).attr("id");

  if (viewSelection === "showActvityFeed") {
    $(".activity").removeClass("d-none");
    // $(".activity").addClass("disabled");
  } else {
    $(".activity").addClass("d-none");
    // $(".collections").prop("disabled",false);
  }

}
