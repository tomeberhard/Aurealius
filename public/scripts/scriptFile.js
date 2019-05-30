//-------------------active page header formatting--------------------------//

let path = (window.location.pathname);
let navPage = "";

defineNavPage();

switch (navPage) {
  case ("index"):

    $(function() {
      $("li.evyOnPgLk").addClass("activePage");
      $("li.evyOnPgLk").children().addClass("activePage");
    });

    break;

  case ("collections"):
    $(function() {
      $("li.cllctLk").addClass("activePage");
      $("li.cllctLk").children().addClass("activePage");
    });

    break;

  case ("user"):
    $(function() {
      $("li.userPgLk").addClass("activePage");
      $("li.userPgLk").children().addClass("activePage");
    });

    break;
}

//-------------------entry form input expand--------------------------------//
document.addEventListener("click", function(event) {

  if (event.target.closest(".entry-form")) {
    $("textarea.expandTA").animate({
      height: "10em"
    }, 500)

    setTimeout(function() {
      $(".expandable").removeClass("d-none");
    }, 500);

  } else {
    $("textarea.expandTA").animate({
      height: "4em"
    }, 500)
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

  $(".favBtn").hover(function() {
    let favBtnId = $(this).attr("id");
    $("#" + favBtnId).children().toggleClass("d-none")
  });

//-----------------heart click icon toggle----------------------------------//

// $("document").ready(function() {
//   $(".favBtn").click(function() {
//     let favBtnId = $(this).attr("id");
//     $("#" + favBtnId).children().toggleClass("d-none")
//   });
// });



//-----------------------------favBtn AJAX----------------------------------//

$(".favBtn").click(function(event) {
  event.preventDefault();
  event.stopPropagation();
  let favBtnId = $(this).attr("id");
  let favBtnData = $(this).attr("value");
  // let favBtnFormID = $(this).parent().attr("id");
  let data = JSON.stringify({
    _id: favBtnData
  });
  $.ajax({
    url: "/favorite",
    type: "POST",
    contentType: "application/json",
    data: data
  }).done(
    $("#" + favBtnId).children().toggleClass("d-none")
  ).fail(function(err) {
    console.log(err)
  });
});


//-----------------------------followBtn AJAX----------------------------------//
$(".followBtn").on("click", function(event) {
  event.preventDefault();
  event.stopPropagation();
  let followingNumber = $("#followLinklist").children().length;
  let flwBtnClsses = $(this).attr("class");
  let splitPosition = flwBtnClsses.indexOf("btn ") + 4;
  let flwBtnUserPClss = flwBtnClsses.slice(splitPosition, flwBtnClsses.length);
  let flwBtnTxt = $(this).text();
  let flwBtnData = $(this).attr("value");
  let data = JSON.stringify({
    flwBtnUserId: flwBtnData
  });
  $.ajax({
    url: "/follow",
    type: "POST",
    contentType: "application/json",
    data: data
  }).done(function(result) {
    updateFollowing(result);
    if (flwBtnTxt === "Follow") {
      $("." + flwBtnUserPClss).html("Unfollow");
      $("#followNum").html("Following ("+ followingNumber-- +")")
    } else {
      $("." + flwBtnUserPClss).html("Follow");
      $("#followNum").html("Following ("+ followingNumber++ +")")
    }
  }
  ).fail(function(err) {
    console.log(err)
  });
});

function updateFollowing (followPanel) {
  $("#followLinklist").html(followPanel)
}


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


//----------------------------functions--------------------------------------//

function defineNavPage() {
  if (path.indexOf("/", 2) > 0) {
    let cutPathIndex = path.indexOf("/", 2);
    navPage = path.slice(1, cutPathIndex)
    // alert(navPage);
    return navPage
  } else {
    let pathLength = (path).length;
    navPage = path.slice(1, pathLength);
    // alert(navPage);
    return navPage
  }
}

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
