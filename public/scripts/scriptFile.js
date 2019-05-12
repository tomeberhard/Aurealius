//-------------------entry form input expand--------------------------------//
document.addEventListener("click", function(event) {

  if (event.target.closest(".entry-form")) {
    $("textarea.expandTA").animate({ height: "10em" }, 500)

    setTimeout(function() {
      $(".expandable").removeClass("d-none");
    }, 500);

  } else {
    $("textarea.expandTA").animate({ height: "4em" }, 500)
    setTimeout(function() {
      $(".expandable").addClass("d-none");
    }, 500);
  }

});

//--------------------------expand card flip--------------------------------//

$(".expndCrdBtn").click(function() {
  let getId = $(this).children().attr("id");
  $("#" + getId).toggleClass("fa-rotate-180");

});

//-----------------expand user column follow flip---------------------------//

$(".expndFollowerBtn").click(function() {
  let getId = $(this).children().attr("id");
  $("#" + getId).toggleClass("fa-rotate-90");

});

//-----------------heart hover icon toggle----------------------------------//

$("document").ready(function() {
    $(".favBtn").hover(function(){
      let favBtnId = $(this).attr("id");
      $("#" + favBtnId).children().toggleClass("d-none")
    });
});


//-------------------image preview------------------------------------------//
var loadFile = function(event) {
  var reader = new FileReader();
  reader.onload = function() {
    var output = document.getElementById("bioImagePreview");
    output.src = reader.result;
  };
  reader.readAsDataURL(event.target.files[0]);
  $("#bioImagePreview").removeClass("d-none");
  $("#bioImage").addClass("d-none");
};


//---close image preview when user presses "close" button---//
var abortPreview = function(event) {
  $("#userBioForm")[0].reset();
  $("#bioImagePreview").attr("src", "");
  $("#bioImagePreview").addClass("d-none");
  $("#bioImage").removeClass("d-none");
};

//---User collection pop-up field controls---//
$("#collectionTextArea").on("keyup", function() {

  let textInput = $("#collectionTextArea").val();

  $("#collectionTextArea").attr("name", "grouping");

  if (textInput != "") {
    $("#collectionSelector").prop("disabled", true);
  } else {
    $("#collectionSelector").prop("disabled", false);
  }

});

$("#collectionSelector").on("change", function() {

  let selectionMade = $("#collectionSelector :selected").text();

  console.log(selectionMade);

  if (selectionMade) {
    $("#collectionTextArea").attr("name", "");
  } else {
    $("#collectionTextArea").attr("name", "grouping");
  }

});

//---------------------------------user page view selection------------------//
$(".viewerChoice").click(function() {
  let btnClicked = $(this);

  userViewChoice(btnClicked);
});


//---functions---//

function userViewChoice(btnClicked) {

  let viewSelection = $(btnClicked).attr("id");

  if (viewSelection === "showActvityFeed") {
    $(".activity").removeClass("d-none");
    $(".favoritesActvity").addClass("d-none");
    $(".userCollections").addClass("d-none");
  } else {
    if (viewSelection === "showCollections") {
      $(".activity").addClass("d-none");
      $(".favoritesActvity").addClass("d-none");
      $(".userCollections").removeClass("d-none");
    } else {
      $(".activity").addClass("d-none");
      $(".favoritesActvity").removeClass("d-none");
      $(".userCollections").addClass("d-none");
    }
  }
}
