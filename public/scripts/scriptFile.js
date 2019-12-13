//-------------------launch top of page button ----------------------------//

$(document).on("click", ".goToTopIconContainer", function(event) {

    $(".goToTopIcon").removeClass("primaryPurpleFont");

    setTimeout(function() {
      $(".goToTopIcon").addClass("primaryPurpleFont");
    }, 10);

    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
});

//-------------------active page header formatting--------------------------//

let path = (window.location.pathname);
let navPage = "";

defineNavPage();

switch (navPage) {
  case ("everyone"):

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

  case ("yourGratitude"):
    $(function() {
      $("li.userPgLk").addClass("activePage");
      $("li.userPgLk").children().addClass("activePage");
    });

    break;
}

//-------------------follower/following collapse placement------------------//

if ($(window).width() < 500 ) {

$(".mobileExpd").removeClass("d-none");
$(".nonMobileExpd").addClass("d-none");

} else {

  $(".mobileExpd").addClass("d-none");
  $(".nonMobileExpd").removeClass("d-none");

}

if ($(window).width() > 501 && $(window).width() < 770) {

$(".followingPrvw").addClass("d-none");

} else {

$(".followingPrvw").removeClass("d-none");

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

$(document).on("click",".expndCrdBtn", function() {
  let getId = $(this).children().attr("id");
  $("#" + getId).toggleClass("fa-rotate-180");

});

//-----------------heart hover icon toggle (entries)---------------------------//


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

//-----------------heart hover icon toggle (collections)----------------------//


$(document).on("mouseenter", ".favBtn-clt", function() {
  let favBtnId = $(this).attr("id");
  let favUnfavId = $("#" + favBtnId).find(".d-none").attr("id");

  if ($("#" + favBtnId).hasClass("clicked") === false) {
    $("#" + favBtnId).children().eq(0).addClass("d-none");
    $("#" + favBtnId).children().eq(1).removeClass("d-none");
  }

}).on("mouseleave", ".favBtn-clt", function() {
  let favBtnId = $(this).attr("id");
  let favUnfavId = $("#" + favBtnId).find(".d-none").attr("id");

  if ($("#" + favBtnId).hasClass("clicked") === false) {

    $("#" + favBtnId).children().eq(1).addClass("d-none");
    $("#" + favBtnId).children().eq(0).removeClass("d-none");
  }
});

//-----------------------------editEntryBtn----------------------------------//

$(document).on("click", ".editBtn", function(event) {

  let editBtnEntryId = $(this).attr("value");

  let userPagePath = userPageDesignator(path);
  console.log(userPagePath);

  let currentCaptionHeight = $("#" + "cpt" + userPagePath + editBtnEntryId).outerHeight();
  console.log(currentCaptionHeight);
  let currentCaptionWidth = $("#" + "cpt" + userPagePath  + editBtnEntryId).outerWidth();
  console.log(currentCaptionWidth);
  let numberLineHeight = parseInt($("#" + "cpt" + userPagePath + editBtnEntryId).css("lineHeight"));
  console.log(numberLineHeight);
  let rows = Math.ceil(currentCaptionHeight / numberLineHeight)+1;
  console.log(rows);

  $("#" + "editCptTA" + userPagePath + editBtnEntryId).attr("rows", rows);
  $("#" + "editCptTA" + userPagePath + editBtnEntryId).css("width", currentCaptionWidth);
  $("#" + "editCptTA"  + userPagePath + editBtnEntryId).parents(":eq(1)").removeClass("d-none");
  $("#" + "cpt" + userPagePath + editBtnEntryId).addClass("d-none");

}).on("click", ".closeEditBtn", function(event) {
  event.preventDefault();
  event.stopPropagation();
  let editBtnEntryId = $(this).attr("value");

  let userPagePath = userPageDesignator(path);

  let currentCaptionText = $("#" + "cpt" + userPagePath + editBtnEntryId).text();
  // console.log(currentCaptionText);

  $("#" + "editCptTA" + userPagePath + editBtnEntryId).parents(":eq(1)").addClass("d-none");

  $(this).closest("form").get(0).reset();

  $("#" + "cpt" + userPagePath + editBtnEntryId).removeClass("d-none");
});

$(document).on("click", ".submitEditBtn", function(event) {
  event.preventDefault();
  event.stopPropagation();

  let updatedCaption = $(this).closest(".editEntryForm").find("textarea").val();
  // console.log(updatedCaption);

  let userPagePath = userPageDesignator(path);
  // console.log(userPagePath);

  let editBtnEntryId = $(this).attr("value");
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
  }).done(function(response) {

    if(response) {

      $("#eID" + userPagePath + editBtnEntryId).append("<h3 class='text-center invalidUser validateWarning'></h3>");

      $(".invalidUser").text(response);

      $("#" + "editCptTA" + userPagePath + editBtnEntryId).parents(":eq(1)").addClass("d-none");
      $("#" + "cpt" + userPagePath + editBtnEntryId).removeClass("d-none");
      $(".editIcnContainer").addClass("d-none");

      setTimeout(function() {
        $(".invalidUser").remove();
      }, 3000);

    } else {
      $("#" + "cpt" + userPagePath + editBtnEntryId).closest(".captionContainer").find(".card-text").text(updatedCaption);
      $("#" + "editCptTA" + userPagePath + editBtnEntryId).parents(":eq(1)").addClass("d-none");
      $("#" + "cpt" + userPagePath + editBtnEntryId).removeClass("d-none");
    }

  }).fail(function(err) {
    console.log(err)
  });
});

//----------------------User collection pop-up field controls----------------//
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

//--------------------------user page rendered entries------------------------//

if (path === "/Yours") {

$("#userEntriesContainer").addClass("active");
$("#followingEntriesContainer").addClass("d-none");
$("#favoriteEntriesContainer").addClass("d-none");

  $.ajax({
    url: "/userEntries",
    type: "GET",
    contentType: "application/json"
  }).done(function(result) {
    updateUserEntries(result);

    jQuery(function() {
      jQuery(".userEntriesImg.orientation").each(function() {
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
      // $(".appendedBelow").remove();
    });

  }).fail(function(err) {
    console.log(err);
  });

}

function updateUserEntries(userEntries) {

  // $("#renderedEntryContainer").append("<div class='appendedBelow'></div>");
  $("#userEntriesContainer").append(userEntries);
  // $("div.appendedBelow").nextAll().children().addClass("scrollImages");
}

//--------------------------public user page rendered entries------------------------//

if (path.includes("/user/")) {

$("#userEntriesPublicContainer").addClass("active");
$("#followingEntriesPublicContainer").addClass("d-none");
$("#favoriteEntriesPublicContainer").addClass("d-none");

let profileName = path.substring(6,path.length);
// console.log(profileName);

let data = JSON.stringify({
  profileName: profileName
});

  $.ajax({
    url: "/userEntriesPublic",
    type: "Post",
    contentType: "application/json",
    data: data
  }).done(function(result) {
    updateUserEntriesPublic(result);

    jQuery(function() {
      jQuery(".userEntriesPublicImg.orientation").each(function() {
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
      // $(".appendedBelow").remove();
    });

  }).fail(function(err) {
    console.log(err);
  });

}

function updateUserEntriesPublic(userEntries) {

  // $("#renderedEntryContainer").append("<div class='appendedBelow'></div>");
  $("#userEntriesPublicContainer").append(userEntries);
  // $("div.appendedBelow").nextAll().children().addClass("scrollImages");
}



//--------------------------user page render------------------------//

$(document).on("click",".userBtnBar", function(event) {

let routeChoice = $(this).val();
console.log(routeChoice);
let renderContainerChoice = routeChoice.substring(1,routeChoice.length);
console.log(renderContainerChoice);
let imgClass = renderContainerChoice + "Img";
console.log(imgClass);


let containerID = ("#"+ renderContainerChoice + "Container");
console.log(containerID);
let containerStatus = $(containerID +" > div").length;
// let containerStatus = ("#"+ renderContainerChoice + "Container").children().length;
console.log(containerStatus);

$("#userBtnBarContainer").find(".customActive").removeClass("customActive");
let userBtnID = ("#show"+ renderContainerChoice);
// console.log(userBtnID);
$(userBtnID).addClass("customActive");

// let routeChoiceValidate = routeChoice.includes("Public");
// console.log(routeChoiceValidate);

if(routeChoice.includes("Public")) {

  let profileName = path.substring(6,path.length);
  // console.log(profileName);

  let data = JSON.stringify({
    profileName: profileName
  });

  $.ajax({
    url: routeChoice,
    type: "POST",
    contentType: "application/json",
    data: data
  }).done(function(returnedEntries) {

    $("#renderingContainer").find(".active").empty();
    $("#renderingContainer").find(".active").removeClass("active").addClass("d-none");
    $(containerID).removeClass("d-none").addClass("active");

    $(containerID).append(returnedEntries);

    jQuery(function() {
      jQuery("."+ imgClass + ".orientation").each(function() {
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
      // $(".appendedBelow").remove();
    });

  }).fail(function(err) {
    console.log(err);
  });

} else {

    $.ajax({
      url: routeChoice,
      type: "GET",
      contentType: "application/json"
    }).done(function(returnedEntries) {

      $("#renderingContainer").find(".active").empty();
      $("#renderingContainer").find(".active").removeClass("active").addClass("d-none");
      $(containerID).removeClass("d-none").addClass("active");

      $(containerID).append(returnedEntries);
      //
      // updateUserEntries(returnedEntries);

      jQuery(function() {
        jQuery("."+ imgClass + ".orientation").each(function() {
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
        // $(".appendedBelow").remove();
      });

    }).fail(function(err) {
      console.log(err);
    });

}

});

// function renderEntries(returnedEntries) {
//
//   // $("#renderedEntryContainer").append("<div class='appendedBelow'></div>");
//   $("#" + renderContainerChoice + "Container").append(returnedEntries);
//   // $("div.appendedBelow").nextAll().children().addClass("scrollImages");
// }


//-----------------------------infinite scroll ----------------------------------//

let totalSeenIds = [];
let isWorking = 0;

if (path == "/yourGratitude") {
  $(window).scroll(function() {

    var scrollPercent = Math.round(($(window).scrollTop()) / ($(document).height() - $(window).height()) * 100);
    // get new data only if scroll bar is greater 80% of screen
    if (scrollPercent > 80) {

      if (isWorking === 0) {

        isWorking = 1;

        let ids = $("#renderedEntryContainer").children(".card").map(function() {
          return $(this).attr("id").substr(3);
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

}

function updateEveryoneEntries(everyoneEntries) {

  $("#renderedEntryContainer").append("<div class='appendedBelow'></div>");
  $("#renderedEntryContainer").append(everyoneEntries);
  $("div.appendedBelow").nextAll().children().addClass("scrollImages");

}

//-----------------------------launch email AJAX----------------------------------//

$(document).on("click", "#submitLPEmailBtn", function(event) {
  event.preventDefault();
  event.stopPropagation();

  let lPEmailField = $("#lPemailAddressInput").val();
  console.log(lPEmailField.includes("@"));

  if (lPEmailField.includes("@") === true ) {

    let data = JSON.stringify({
      email: lPEmailField
    });

    $.ajax({
      url: "/launchPage",
      type: "POST",
      contentType: "application/json",
      data: data
    }).done(function(response) {

      $("#lPResponse").html(response.message);
      $("#lPSubmitModal").modal('show');

      $("#launchPageForm").trigger("reset");

    }).fail(function(err) {
      console.log(err)
    });

  } else {

    $(".validateEmail").removeClass("d-none");

    setTimeout(function() {
    $(".validateEmail").addClass("d-none");
    }, 3000);

}

});

//-----------------------------contactUs Form-------------------------------------//

$(document).on("click", "#submitLContactBtn", function(event) {
  event.preventDefault();
  event.stopPropagation();

  let contactUsEmail = $("#lContactEmail").val();
  // console.log(updatedFieldValue);

  if (contactUsEmail.includes("@")) {

    let contactUsFName = $("#lContactFName").val();
    let contactUsLName = $("#lContactLName").val();
    let contactRationale = $("#contactRationale").val();
    let lContactContent = $("#lContactContent").val();

    let contactUsObj = new Object();

    contactUsObj["firstName"] = contactUsFName;
    contactUsObj["lastName"] = contactUsLName;
    contactUsObj["email"] = contactUsEmail;
    contactUsObj["contactRationale"] = contactRationale;
    contactUsObj["lContactContent"] = lContactContent;

    // console.log(contactUsObj);

    let data = JSON.stringify({
      data: contactUsObj
    });

    $.ajax({
      url: "/launchContactUs",
      type: "POST",
      contentType: "application/json",
      data: data
    }).done(function(response) {

      $("#lContactResponse").html(response.message);
      $("#lContactSubmitModal").modal('show');

      $("#launchContactusForm").trigger("reset");

    }).fail(function(err) {
      console.log(err)
    });

  } else {

    $(".validateEmail").removeClass("d-none");

    setTimeout(function() {
    $(".validateEmail").addClass("d-none");
    }, 3000);

  }

});

//-----------------------------delete Entry AJAX----------------------------------//

$(document).on("click", "#deleteButton", function(event) {
  event.preventDefault();
  event.stopPropagation();

  let deleteBtnData = $(this).val();
  // console.log(deleteBtnData);

  let userPagePath = userPageDesignator(path);

  let deleteBtnEntryId = deleteBtnData.slice(0, deleteBtnData.indexOf(" "));
  let deleteBtnimageFile = deleteBtnData.slice(deleteBtnData.indexOf(" ") + 1, deleteBtnData.length);

  let data = JSON.stringify({
    entryId: deleteBtnEntryId,
    fileName: deleteBtnimageFile
  });
  $.ajax({
      url: "/delete",
      type: "POST",
      contentType: "application/json",
      data: data
    }).done(function(response) {

      if(response) {

        $("#eID" + userPagePath + deleteBtnEntryId).append("<h3 class='text-center invalidUser validateWarning'></h3>");

        $(".invalidUser").text(response);

        $("#" + "editCptTA" + userPagePath + deleteBtnEntryId).parents(":eq(1)").addClass("d-none");
        $("#" + "cpt" + userPagePath + deleteBtnEntryId).removeClass("d-none");
        $(".deleteIcnContainer").addClass("d-none");

        setTimeout(function() {
          $(".invalidUser").remove();
        }, 3000);

      } else {

        $("#eID" + userPagePath + deleteBtnEntryId).empty();
        $("#eID" + userPagePath + deleteBtnEntryId).append("<p style='text-align:center'>Your entry has been succesfully deleted.</p>");

        setTimeout(function(){
          $("#eID" + userPagePath + deleteBtnEntryId).remove();
        }, 2500);

      }

    })
    .fail(function(err) {
      console.log(err)
    });
});



//-----------------------------report Entry AJAX----------------------------------//

$(document).on("click", ".reportSubmitBtn", function(event) {
  event.preventDefault();
  event.stopPropagation();

  let reportedEntryId = this.id.substr(6);
  console.log(reportedEntryId);

  let userPagePath = userPageDesignator(path);
  console.log(userPagePath);

  let entryId = "eID" + userPagePath + reportedEntryId;
  console.log(entryId);
  let checkedOption = $(".form-check-input:checked").val();
  console.log(checkedOption);
  let reportComment = $(".reportTA").val()
  console.log(reportComment);
  let reportModalId = "rptModal" + reportedEntryId;
  console.log(reportModalId);

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
      $("#" + reportModalId).modal("hide");
      $("body").removeClass("modal-open");
      $("body").removeAttr("style");
      $(".modal-backdrop").remove();

      $("#" + entryId).empty();
      $("#" + entryId).append("<p style='text-align:center'>Thank you for reporting this entry.<br> We will review and let you know what we decide.</p>");

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

//-----------------------------favorate collection AJAX----------------------------------//

$(document).on("click", ".favBtn-clt", function(event) {
  event.preventDefault();
  event.stopPropagation();

  let favCltBtnId = $(this).attr("id");
  let favCltUnfavId = $("#" + favCltBtnId).find(".d-none").attr("id");

  if ($("#" + favCltBtnId).hasClass("clicked")) {
    $("#" + favCltBtnId).removeClass("clicked");
  } else {
    $("#" + favCltBtnId).addClass("clicked");
  }

  let favCltBtnData = $(this).attr("value");
  // let favBtnFormID = $(this).parent().attr("id");
  let data = JSON.stringify({
    _id: favCltBtnData
  });
  $.ajax({
    url: "/favoriteGrouping",
    type: "POST",
    contentType: "application/json",
    data: data
  }).done(function() {

    if ($("#" + favCltBtnId).hasClass("clicked") === false) {
      $("#" + favCltBtnId).children().eq(1).addClass("d-none");
      $("#" + favCltBtnId).children().eq(0).removeClass("d-none");
    } else {
      $("#" + favCltBtnId).children().eq(0).addClass("d-none");
      $("#" + favCltBtnId).children().eq(1).removeClass("d-none");
    }

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

//-----------------------------userEntry privacy change AJAX----------------------------------//

$(document).on("click", ".pubPriSubmitBtn", function(event) {
  event.preventDefault();
  event.stopPropagation();

  let pubPriSubmitvalue = $(this).attr("value");

  let pubPriEntryId = pubPriSubmitvalue.slice(0, pubPriSubmitvalue.indexOf(" "));
  let pubPriEntryViewStatus = pubPriSubmitvalue.slice(pubPriSubmitvalue.indexOf(" ") + 1, pubPriSubmitvalue.length);

  function toggleViewStatus() {
    if (pubPriEntryViewStatus === "public") {
      pubPriEntryViewStatus = "private";
    } else {
      pubPriEntryViewStatus = "public";
    }
    return pubPriEntryViewStatus
  }

  let data = JSON.stringify({
    entryId: pubPriEntryId,
    viewStatus: toggleViewStatus()
  });
  $.ajax({
      url: "/updateEPrivacy",
      type: "POST",
      contentType: "application/json",
      data: data
    }).done(function() {
      $("#ddModal" + pubPriEntryId).modal("hide");
      $("body").removeClass("modal-open");
      $("body").removeAttr("style");
      $(".modal-backdrop").remove();

      $("#sbmtddModal" + pubPriEntryId).val(pubPriEntryId + " " + pubPriEntryViewStatus);
      $("#dd" + pubPriEntryId).click();

      $("#dd" + pubPriEntryId).find(".currentOption").children().toggleClass("d-none");
      $("#formDD" + pubPriEntryId).find(".dDoption").children().toggleClass("d-none");


    })
    .fail(function(err) {
      console.log(err)
    });
});

//-----------------------------user Collection privacy change AJAX----------------------------------//

$(document).on("click", ".pubPriSubmitBtn-clt", function(event) {
  event.preventDefault();
  event.stopPropagation();

  let pubPriSubmitvalue = $(this).attr("value");

  let pubPriCltId = pubPriSubmitvalue.slice(0, pubPriSubmitvalue.indexOf(" "));
  let pubPriCltViewStatus = pubPriSubmitvalue.slice(pubPriSubmitvalue.indexOf(" ") + 1, pubPriSubmitvalue.length);

  function toggleCltViewStatus() {
    if (pubPriCltViewStatus === "public") {
      pubPriCltViewStatus = "private";
    } else {
      pubPriCltViewStatus = "public";
    }
    return pubPriCltViewStatus
  }

  let data = JSON.stringify({
    collectionId: pubPriCltId,
    viewStatus: toggleCltViewStatus()
  });
  $.ajax({
      url: "/updateCltPrivacy",
      type: "POST",
      contentType: "application/json",
      data: data
    }).done(function() {
      $("#ddModal" + pubPriCltId).modal("hide");
      $("body").removeClass("modal-open");
      $("body").removeAttr("style");
      $(".modal-backdrop").remove();

      $("#sbmtddModal" + pubPriCltId).val(pubPriCltId + " " + pubPriCltViewStatus);
      $("#dd" + pubPriCltId).click();

      $("#dd" + pubPriCltId).find(".currentOption").children().toggleClass("d-none");
      $("#formDD" + pubPriCltId).find(".dDoption").children().toggleClass("d-none");


    })
    .fail(function(err) {
      console.log(err)
    });
});


//-------------------edit settings bioImage------------------------------------------//

$(document).on("click", ".userBioPicBtn", function(event) {
  event.preventDefault();
  event.stopPropagation();

  $(this).addClass("d-none");
  $(this).next("#userBioPicSettingsBtnBar").removeClass("d-none");

});

$(document).on("click", "#closeUserBioPicEditSettingsBtn", function(event) {
  event.preventDefault();
  event.stopPropagation();

  $("#userBioPicForm")[0].reset();
  $("#imagePreview").empty();
  $("#imagePreview").addClass("d-none");
  $("#userBioImage").removeClass("d-none");

  $(".userBioPicBtn").removeClass("d-none");
  $(".userBioPicBtn").next("#userBioPicSettingsBtnBar").addClass("d-none");

});

$(document).on("click", ".userBioPicSubmitBtn", function(event) {
  event.preventDefault();
  event.stopPropagation();

  $(userBioPicForm).ajaxSubmit({

    error: function(err) {
      console.log(err)
    },
    success: function(response) {
      $("#userBioImage").attr("image", "image/" + response);

      console.log("image/" + response);

      $("#userBioImage").empty();

      $("#imagePreview").addClass("d-none");
      $("#userBioPicForm")[0].reset();
      $("#imagePreview").empty();

      $("#userBioImage").removeClass("d-none");

      jQuery(function() {
        jQuery(".userSettingsImage.orientation").each(function() {
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

      $(".userBioPicBtn").removeClass("d-none");
      $(".userBioPicBtn").next("#userBioPicSettingsBtnBar").addClass("d-none");
    }

  });
});

$(document).on("click", "#closeUserBioPicEditSettingsBtn", function(event) {
  event.preventDefault();
  event.stopPropagation();

  $("#userBioPicForm")[0].reset();
  $("#imagePreview").empty();
  $("#upload-file-info").text("");
  $("#imagePreview").addClass("d-none");
  $("#userBioImage").removeClass("d-none");

  $(".userBioPicBtn").removeClass("d-none");
  $(".userBioPicBtn").next("#userBioPicSettingsBtnBar").addClass("d-none");

});

//-------------------edit collection Image------------------------------------------//

$(document).on("click", ".cltImagePicBtn", function(event) {
  event.preventDefault();
  event.stopPropagation();

  $(this).addClass("d-none");
  $(this).next("#cltImageSettingsBtnBar").removeClass("d-none");

});

$(document).on("click", "#closecltImageEditSettingsBtn", function(event) {
  event.preventDefault();
  event.stopPropagation();

  $("#cltImageForm")[0].reset();
  $("#imagePreview").empty();
  $("#imagePreview").addClass("d-none");
  $("#cltImage").removeClass("d-none");

  $(".cltImagePicBtn").removeClass("d-none");
  $(".cltImagePicBtn").next("#cltImageSettingsBtnBar").addClass("d-none");

});

// $(document).on("click", ".cltImageSubmitBtn", function(event) {
//   event.preventDefault();
//   event.stopPropagation();
//
//   $(cltImageForm).ajaxSubmit({
//
//     error: function(err) {
//       console.log(err)
//     },
//     success: function(response) {
//       $("#cltImage").attr("image", "image/" + response);
//
//       console.log("image/" + response);
//
//       $("#cltImage").empty();
//
//       $("#imagePreview").addClass("d-none");
//       $("#cltImageForm")[0].reset();
//       $("#imagePreview").empty();
//
//       $("#cltImageForm").removeClass("d-none");
//
//       jQuery(function() {
//         jQuery(".cltImagePreview.orientation").each(function() {
//           var div = $(this);
//           loadImage(
//             div.attr("image"),
//             function(img) {
//               div.append(img);
//             }, {
//               orientation: true,
//               aspectRatio: 1 / 1
//             }
//           );
//         });
//       })
//
//       $(".cltImagePicBtn").removeClass("d-none");
//       $(".cltImagePicBtn").next("#cltImageSettingsBtnBar").addClass("d-none");
//     }
//
//   });
// });

// $(document).on("click", "#closecltImageEditSettingsBtn", function(event) {
//   event.preventDefault();
//   event.stopPropagation();
//
//   $("#cltImageForm")[0].reset();
//   $("#imagePreview").empty();
//   $("#upload-file-info").text("");
//   $("#imagePreview").addClass("d-none");
//   $("#cltImage").removeClass("d-none");
//
//   $(".cltImagePicBtn").removeClass("d-none");
//   $(".cltImagePicBtn").next("#cltImageSettingsBtnBar").addClass("d-none");
//
// });

//------------------image preview (collection and bioImage)-------------------//

var loadFilePreview = function(event) {

  loadImage(
    event.target.files[0],
    function(img) {
      $("#imagePreview").append(img);
    }, {
      orientation: true,
      aspectRatio: 1 / 1
    }
  );

  $("#imagePreview").removeClass("d-none");

  if (path === "/settings") {
    $("#userBioImage").addClass("d-none");
  } else {
    $("#cltImage").addClass("d-none");
  }

}

//-----------------------------edituserSettings------------------------------//

$(document).on("click", ".editSettingsBtn", function(event) {
  event.preventDefault();
  event.stopPropagation();

  let userField = $(this).attr("value")

  $("#" + userField + "EditInput").css("width", "100%").removeClass("d-none");
  $("#" + userField + "EditBtnContainer").removeClass("d-none");
  $("#" + userField + "SettingsInputWBtnContainer").addClass("d-none");

});

$(document).on("click", ".closeEditSettingsBtn", function(event) {
  event.preventDefault();
  event.stopPropagation();

  let userField = $(this).attr("value")

  $("#" + userField + "EditInput").addClass("d-none");
  $("#" + userField + "EditInput").val("");
  $("#" + userField + "EditBtnContainer").addClass("d-none");
  $(this).closest("form").get(0).reset();
  $("#" + userField + "SettingsInputWBtnContainer").removeClass("d-none");


});

$(document).on("click", ".submitEditSettingsBtn", function(event) {
  event.preventDefault();
  event.stopPropagation();

  let fieldName = $(this).attr("id").replace("SubmitBtn", "");

  let updatedFieldValue = $("#" + fieldName + "EditInput").val();
  // console.log(updatedFieldValue);

  let userEditObj = new Object();

  userEditObj[fieldName] = updatedFieldValue;
  // console.log(userEditObj);

  let data = JSON.stringify({
    data: userEditObj
  });

  $.ajax({
    url: "/userSettingsUpload",
    type: "POST",
    contentType: "application/json",
    data: data
  }).done(function() {

    $("#" + fieldName + "EditInput").addClass("d-none");
    $("#" + fieldName + "EditInput").val("");
    $("#" + fieldName + "EditInput").attr("placeholder", updatedFieldValue);
    $("#" + fieldName + "EditBtnContainer").addClass("d-none");
    $("#" + fieldName + "EditInput").closest("form").get(0).reset();
    $("#" + fieldName + "SettingsInputWBtnContainer").removeClass("d-none");
    $("#" + fieldName + "SettingsContent").text(updatedFieldValue);
    // console.log(updatedFieldValue);

  }).fail(function(err) {
    console.log(err)
  });
});

//--------------------------edit Collection Name------------------------------//

$(document).on("click", ".editCltTileContainerBtn", function(event) {
  event.preventDefault();
  event.stopPropagation();

  let cltId = $(this).attr("value");

  $("#cltId" + cltId).addClass("d-none");
  $("#editCltId" + cltId).css("width", "100%").removeClass("d-none");
  $("#editCltContainer" + cltId).removeClass("d-none");

});

$(document).on("click", ".closeEditCollectionNameBtnBar", function(event) {
  event.preventDefault();
  event.stopPropagation();

  let cltId = $(this).attr("value")

  $("#cltId" + cltId).removeClass("d-none");
  $("#editCltId" + cltId).addClass("d-none");
  $("#editCltId" + cltId).val("");
  $("#editCltContainer" + cltId).addClass("d-none");

});

$(document).on("click", ".submitEditCollectionNameBtn", function(event) {
  event.preventDefault();
  event.stopPropagation();


  let cltId = $(this).parent().attr("id").replace("editCltContainer","");
  console.log(cltId);
  let updatedCltValue = $("#editCltId" + cltId).val();
  console.log(updatedCltValue);

  let data = JSON.stringify({
    _id: cltId,
    groupingName: updatedCltValue
  });

  $.ajax({
    url: "/collectionNameUpdate",
    type: "POST",
    contentType: "application/json",
    data: data
  }).done(function() {

    $("#cltId" + cltId).text(updatedCltValue);
    $("#cltId" + cltId).removeClass("d-none");
    $("#editCltId" + cltId).addClass("d-none");
    $("#editCltId" + cltId).val("");
    $("#editCltId" + cltId).attr("placeholder", updatedCltValue);;
    $("#editCltContainer" + cltId).addClass("d-none");

    // $("#" + fieldName + "EditInput").addClass("d-none");
    // $("#" + fieldName + "EditInput").val("");
    // $("#" + fieldName + "EditInput").attr("placeholder", updatedFieldValue);
    // $("#" + fieldName + "EditBtnContainer").addClass("d-none");
    // $("#" + fieldName + "EditInput").closest("form").get(0).reset();
    // $("#" + fieldName + "SettingsInputWBtnContainer").removeClass("d-none");
    // $("#" + fieldName + "SettingsContent").text(updatedFieldValue);
    // console.log(updatedFieldValue);

  }).fail(function(err) {
    console.log(err)
  });
});

//------change password collapse-----//

$(document).on("click", "#changePWToggleBtn", function(event) {

  $("#subClosePWBtnContainer").toggleClass("dDactive");

  if ($("#subClosePWBtnContainer").hasClass("dDactive")) {
    $(this).text("Close");
    $(this).removeClass("btn-primary");
    $(this).removeClass("btn-block");
    $(this).addClass("btn-secondary");
    $("#pWSubmitBtn").removeClass("d-none");

  } else {

    if (!$(".validatePW").hasClass("d-none")) {
      $(".validatePW").addClass("d-none");
    }

    $(this).text("Change Password");
    $(this).removeClass("btn-secondary");
    $(this).addClass("btn-primary");
    $(this).addClass("btn-block");
    $("#pWSubmitBtn").addClass("d-none");

  }

});

//------password form disable waterfall-----//

$(document).on("keydown", "#currentPW", function(event) {

  let textInput = $("#currentPW").val();

  if (textInput != "") {
    $("#newPW1").removeAttr("disabled");
  } else {
    $("#newPW1").attr("disabled", true);
  }

});

$(document).on("keydown", "#newPW1", function(event) {

  let textInput = $("#newPW1").val();

  if (textInput != "") {
    $("#newPW2").removeAttr("disabled");
  } else {
    $("#newPW2").attr("disabled", true);
  }

});

//-----------------------------changePassword----------------------------------//

$(document).on("click", ".submitPWEditSettingsBtn", function(event) {
  event.preventDefault();
  event.stopPropagation();


  let oldPWord = $("#currentPW").val();
  // console.log(oldPWord);
  let newPWord1 = $("#newPW1").val();
  let newPWord2 = $("#newPW2").val();
  // console.log(newPWord2);

  if (newPWord1 === newPWord2) {

    let data = JSON.stringify({
      oldpassword: oldPWord,
      newpassword: newPWord2
    });

    $.ajax({
      url: "/changePassword",
      type: "POST",
      contentType: "application/json",
      data: data
    }).done(function(response) {

      if (response.success === true) {

        if ($(".validatePW").hasClass("d-none")) {


          $(".changePWMsg").text(response.message);

          setTimeout(function() {
            $("#changePWToggleBtn").click()
            $("#changePWContainer").closest("form").get(0).reset();
            $(".changePWMsg").text("");
          }, 2000);

        } else {

          $(".validatePW").addClass("d-none");
          $(".changePWMsg").text(response.message);

          setTimeout(function() {
            $("#changePWToggleBtn").click()
            $("#changePWContainer").closest("form").get(0).reset();
            $(".changePWMsg").text("");
          }, 2000);
        }
      } else {

        if ($(".validatePW").hasClass("d-none")) {

          $(".validatePW").addClass("d-none");
          $(".changePWMsg").addClass("validateWarning");
          $(".changePWMsg").text(response.message);

        } else {

          $(".changePWMsg").addClass(validateWarning);
          $(".changePWMsg").text(response.message);

        }

      }


    }).fail(function(err) {
      console.log(err)
    });

  } else {

    $(".validatePW").removeClass("d-none");

  }

});

//-----------------------------editEmailSettings----------------------------------//

$(document).on("click", ".editEmailSettingsBtn", function(event) {
  event.preventDefault();
  event.stopPropagation();

  let userField = $(this).attr("value");

  $("#" + userField + "EditInput").css("width", "100%").removeClass("d-none");
  $("#" + userField + "EditBtnContainer").removeClass("d-none");
  $("#" + userField + "SettingsInputWBtnContainer").addClass("d-none");

});

$(document).on("click", ".closeEditSettingsBtn", function(event) {
  event.preventDefault();
  event.stopPropagation();

  let userField = $(this).attr("value")

  $("#" + userField + "EditInput").addClass("d-none");
  $("#" + userField + "EditInput").val("");
  $("#" + userField + "EditBtnContainer").addClass("d-none");
  $(this).closest("form").get(0).reset();
  $("#" + userField + "SettingsInputWBtnContainer").removeClass("d-none");

  if (!$(".validateEmail").hasClass("d-none")) {
    $(".validateEmail").addClass("d-none");
  }


});

$(document).on("click", ".submitEmailEditSettingsBtn", function(event) {
  event.preventDefault();
  event.stopPropagation();

  let fieldName = $(this).attr("id").replace("SubmitBtn", "");

  let updatedFieldValue = $("#" + fieldName + "EditInput").val();
  // console.log(updatedFieldValue);

  if (updatedFieldValue.includes("@")) {

    let userEditObj = new Object();

    userEditObj[fieldName] = updatedFieldValue;


    // console.log(userEditObj);


    let data = JSON.stringify({
      data: userEditObj
    });

    $.ajax({
      url: "/userSettingsUpload",
      type: "POST",
      contentType: "application/json",
      data: data
    }).done(function(response) {

      if (response) {

        $(".validateEmail").text(response);
        // console.log(response);
        $(".validateEmail").removeClass("d-none");

      } else {

        $("#" + fieldName + "EditInput").addClass("d-none");
        $("#" + fieldName + "EditInput").val("");
        $("#" + fieldName + "EditBtnContainer").addClass("d-none");
        $("#" + fieldName + "EditInput").closest("form").get(0).reset();
        $("#" + fieldName + "SettingsInputWBtnContainer").removeClass("d-none");
        $("#" + fieldName + "SettingsContent").text(updatedFieldValue);
        // console.log(updatedFieldValue);

        if (!$(".validateEmail").hasClass("d-none")) {

          $(".validateEmail").text("Your email has been successfully updated!");
          $(".validateEmail").css("color", "#465559");


          setTimeout(function() {
            $(".validateEmail").addClass("d-none");
            $(".validateEmail").text("Please choose a valid email address!");
            $(".validateEmail").css("color", "red");
          }, 2000);

        } else {

          $(".validateEmail").removeClass("d-none");
          $(".validateEmail").text("Your email has been successfully updated!");
          $(".validateEmail").css("color", "#465559");
          // console.log(updatedFieldValue);
          $("#emailEditInput").attr("placeholder", updatedFieldValue);

          setTimeout(function() {
            $(".validateEmail").addClass("d-none");
            $(".validateEmail").text("Please choose a valid email address!");
            $(".validateEmail").css("color", "red");
          }, 2000);
        }

      }

    }).fail(function(err) {
      console.log(err)
    });

  } else {

    if ($(".validateEmail").text("Please choose a valid email address!")) {

      $(".validateEmail").removeClass("d-none");

    } else {

      $(".validateEmail").text("Please choose a valid email address!");
      $(".validateEmail").removeClass("d-none");

    }


  }

});


//-----------------------------editreminderSettings-----------------------------//

if (path === "/settings") {

  let loadStatus = $("#toggleValueChanger").attr("value");
  // console.log(loadStatus);
  let loadFrequency = $("#emailFrequency").attr("name");
  let loadDayOfWeek = $("#dayOfWeek").attr("name");

  $("#emailFrequency option[value = " + loadFrequency + "]").attr("selected", "selected");
  $("#dayOfWeek option[value = " + loadDayOfWeek + "]").attr("selected", "selected");

  if(loadStatus === "off") {
    $("#emailFrequency").attr("disabled","disabled");
    $("#dayOfWeek").attr("disabled","disabled");
    $("#timepicker1").attr("disabled","disabled");
  } else {
    if(loadFrequency === "Daily") {
      $("#dayOfWeek").attr("disabled","disabled");
    }
  }

}


//------ajax email request----------------//

$(document).on("change", ".emailReminderFrm", function(event) {
  event.preventDefault();
  event.stopPropagation();


  let fieldChanged = $(this).attr("class");
  // console.log(fieldChanged);
  // console.log(fieldChanged.includes("reminderStatusBox"));

  if (fieldChanged.includes("reminderStatusBox")) {

    if ($("#toggleValueChanger").attr("value") === "on") {
      $("#toggleValueChanger").attr("value", "off");
      $("#emailFrequency").attr("disabled", "disabled");
      $("#dayOfWeek").attr("disabled", "disabled");
      $("#timepicker1").attr("disabled", "disabled");

    } else {
      $("#toggleValueChanger").attr("value", "on");
      $("#emailFrequency").removeAttr("disabled", "disabled");
      $("#timepicker1").removeAttr("disabled", "disabled");

      if($("#emailFrequency").val() != "Daily") {
      $("#dayOfWeek").removeAttr("disabled", "disabled");
      }

    }

    if ($("#reminderStatusBox").attr("checked")) {
        $("#reminderStatusBox").removeAttr("checked");
    } else {
      $("#reminderStatusBox").attr("checked");

  }
}

if (fieldChanged.includes("dayOfWeekOnOff")) {
  // console.log($("#emailFrequency").val());

  if($("#emailFrequency").val() === "Daily") {

  $("#dayOfWeek").attr("disabled", "disabled");

  } else {

    $("#dayOfWeek").removeAttr("disabled", "disabled");

  }

}

  let statusSetting = $("#toggleValueChanger").attr("value");
  // console.log(statusSetting);
  let frequencySetting = $("#emailFrequency").val();
  // console.log(frequencySetting);
  let dayOfWeekSetting = $("#dayOfWeek").val();
  // console.log(dayOfWeekSetting);
  let timeOfDaySetting = $("#timepicker1").val();
  // console.log(timeOfDaySetting);

  let emailSettingsObj = new Object();

  emailSettingsObj = {
    status: statusSetting,
    frequency: frequencySetting,
    dayOfWeek: dayOfWeekSetting,
    timeOfDay: timeOfDaySetting
  };

  // console.log(emailSettingsObj);

  let data = JSON.stringify(emailSettingsObj);

  $.ajax({
    url: "/userEMSttings",
    type: "POST",
    contentType: "application/json",
    data: data
  }).done(function() {

    // setDayOfWeek();

    // console.log("Successfully updated email reminder settings.")

  }).fail(function(err) {
    console.log(err)
  });

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

function userPageDesignator(pathName) {
  let uPP;
  // console.log(pathName);
  if (pathName === "/Yours" || pathName.includes("user")) {
    uPP =  $("#renderingContainer").find(".active").attr("value");
    console.log(path);
    console.log(uPP);
  } else {
    uPP = "";
    console.log("nope");
  }
  return uPP;
}
