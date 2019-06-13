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
$(document).on("click", function(event) {

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

//-----------------heart hover icon toggle----------------------------------//


$(document).on("mouseenter", ".favBtn", function() {
  let favBtnId = $(this).attr("id");
  let favUnfavId = $("#" + favBtnId).find(".d-none").attr("id");

  if ($("#" + favBtnId).hasClass("clicked") === false) {
    $("#" + favBtnId).children().eq(0).addClass("d-none");
    $("#" + favBtnId).children().eq(1).removeClass("d-none");
  }

}).on("mouseleave", ".favBtn", function() {
  let favBtnId = $(this).attr("id");
  let favUnfavId = $("#" + favBtnId).find(".d-none").attr("id");

  if ($("#" + favBtnId).hasClass("clicked") === false) {

    $("#" + favBtnId).children().eq(1).addClass("d-none");
    $("#" + favBtnId).children().eq(0).removeClass("d-none");
  }
});

//-----------------------------infinite scroll ----------------------------------//

let totalSeenIds = [];
let isWorking = 0;

$(window).scroll(function() {

  var scrollPercent = Math.round(($(window).scrollTop()) / ($(document).height() - $(window).height()) * 100);
  // get new data only if scroll bar is greater 80% of screen
  if (scrollPercent > 80) {

    if (isWorking === 0) {

      isWorking = 1;

      let ids = $("#renderedEntryContainer").children().map(function() {
        return $(this).attr("id").substr(3).slice(0, -1);
      }).get();

      console.log(ids);

      let data = JSON.stringify({
        totalSeenIds: ids
      });

      $.ajax({
        url: "/moreEEntries",
        type: "POST",
        contentType: "application/json",
        data: data
      }).done(function(result) {
        updateEveryoneEntries(result);

        jQuery(function() {
          jQuery(".everyOneImg.orientation.scrollImages").each(function() {
            var div = $(this);
            loadImage(
              div.attr("image"),
              function(img) {
                div.append(img);
              }, {
                orientation: true,
              }
            );
          });
          $(".appendedBelow").remove();
        });

      }).fail(function(err) {
        console.log(err);
      });

      setTimeout(function() {
        isWorking = 0
      }, 2500);
      $(".scrollImages").removeClass("scrollImages");

    }

  }

});

function updateEveryoneEntries(everyoneEntries) {

  $("#renderedEntryContainer").append("<div class='appendedBelow'></div>");
  $("#renderedEntryContainer").append(everyoneEntries);
  $("div.appendedBelow").nextAll().children().addClass("scrollImages");

}

//-----------------------------report Entry AJAX----------------------------------//
$(document).on("click", "#reportSubmitBtn", function(event) {
  event.preventDefault();
  event.stopPropagation();

  let entryId = $(this).closest(".card-body").attr("id");

  let reportedEntryId = $(this).attr("value");
  console.log(reportedEntryId);
  let checkedOption = $(".form-check-input:checked").val();
  console.log(checkedOption);
  let reportComment = $(".reportTA").val()
  console.log(reportComment);

  let data = JSON.stringify({
    entryId: reportedEntryId,
    ruleBroken: checkedOption,
    comments: reportComment
  });
  $.ajax({
      url: "/report",
      type: "POST",
      contentType: "application/json",
      data: data
    }).done(function() {

      $("#modalCloseBtn").click()

      $("#" + entryId).empty();
      $("#" + entryId).add("<p style='text-align:center'>Thank you for reporting this entry.<br> We will review and let you know what we decide.</p>");

    })
    .fail(function(err) {
      console.log(err)
    });
});

//-----------------------------favBtn AJAX----------------------------------//

$(document).on("click", ".favBtn", function(event) {
  event.preventDefault();
  event.stopPropagation();
  let favBtnId = $(this).attr("id");
  let favUnfavId = $("#" + favBtnId).find(".d-none").attr("id");
  if ($("#" + favBtnId).hasClass("clicked")) {
    $("#" + favBtnId).removeClass("clicked");
  } else {
    $("#" + favBtnId).addClass("clicked");
  }
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
  }).done(function() {
    if ($("#" + favBtnId).hasClass("clicked") === false) {
      $("#" + favBtnId).children().eq(1).addClass("d-none");
      $("#" + favBtnId).children().eq(0).removeClass("d-none");
    } else {
      $("#" + favBtnId).children().eq(0).addClass("d-none");
      $("#" + favBtnId).children().eq(1).removeClass("d-none");
    }

    // $("#" + favBtnId).children().toggleClass("d-none")
    // }
  }).fail(function(err) {
    console.log(err)
  });
});



//-----------------------------followBtn AJAX----------------------------------//
$(document).on("click", ".followBtn", function(event) {
  event.preventDefault();
  event.stopPropagation();

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

      let followingNumber = $("#followLinklist > a").length;

      if (flwBtnTxt === "Follow") {
        $("." + flwBtnUserPClss).html("Unfollow");
        $("#followNum").html("Following (" + followingNumber + ")");
      } else {
        $("." + flwBtnUserPClss).html("Follow");
        $("#followNum").html("Following (" + followingNumber + ")");
      }

      jQuery(function() {
        jQuery(".followingPrvw.orientation").each(function() {
          var div = $(this);
          loadImage(
            div.attr("image"),
            function(img) {
              div.append(img);
            }, {
              orientation: true,
              aspectRatio: 1 / 1
            }
          );

        });

      })

    })
    .fail(function(err) {
      console.log(err)
    });
});

function updateFollowing(followPanel) {
  $("#followLinklist").html(followPanel)
}

//-----------------------------editEntryBtn----------------------------------//

$(document).on("click", ".editBtn", function(event) {
  let editBtnEntryId = $(this).attr("value");
  let currentCaptionHeight = $("#" + "cpt" + editBtnEntryId).outerHeight();
  let currentCaptionWidth = $("#" + "cpt" + editBtnEntryId).outerWidth();
  let numberLineHeight = parseInt($("#" + "cpt" + editBtnEntryId).css("lineHeight"));
  let rows = Math.ceil(currentCaptionHeight / numberLineHeight) + 1;

  $("#" + "editCptTA" + editBtnEntryId).attr("rows", rows);
  $("#" + "editCptTA" + editBtnEntryId).css("width", currentCaptionWidth);
  $("#" + "editCptTA" + editBtnEntryId).parents(":eq(1)").removeClass("d-none");
  $("#" + "cpt" + editBtnEntryId).addClass("d-none");

});

$(document).on("click", ".closeEditBtn", function(event) {
  event.preventDefault();
  event.stopPropagation();
  let editBtnEntryId = $(this).attr("value");
  $("#" + "editCptTA" + editBtnEntryId).parents(":eq(1)").addClass("d-none");
  $("#" + "cpt" + editBtnEntryId).removeClass("d-none");
});

$(document).on("click", ".submitEditBtn", function(event) {
  event.preventDefault();
  event.stopPropagation();

  let updatedCaption = $(this).closest(".editEntryForm").find("textarea").val();
  // console.log(updatedCaption);

  let editCaptionFormId = $(this).parent().attr("id");
  let editBtnEntryId = editCaptionFormId.slice(13);
  // console.log(editBtnEntryId);

  let data = JSON.stringify({
    _id: editBtnEntryId,
    caption: updatedCaption
  });
  $.ajax({
    url: "/update",
    type: "POST",
    contentType: "application/json",
    data: data
  }).done(function() {
    $("#" + "cpt" + editBtnEntryId).closest(".captionContainer").find(".card-text").text(updatedCaption);
    $("#" + "editCptTA" + editBtnEntryId).parents(":eq(1)").addClass("d-none");
    $("#" + "cpt" + editBtnEntryId).removeClass("d-none");
  }).fail(function(err) {
    console.log(err)
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

//--------------------------user page view selection--------------------------//
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
