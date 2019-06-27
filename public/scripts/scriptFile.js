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

//-----------------------------editEntryBtn----------------------------------//

$(document).on("click", ".editBtn", function(event) {
  let editBtnEntryId = $(this).attr("value");
  let currentCaptionHeight = $("#" + "cpt" + editBtnEntryId).outerHeight();
  let currentCaptionWidth = $("#" + "cpt" + editBtnEntryId).outerWidth();
  let numberLineHeight = parseInt($("#" + "cpt" + editBtnEntryId).css("lineHeight"));
  let rows = Math.ceil(currentCaptionHeight / numberLineHeight)+1;

  $("#" + "editCptTA" + editBtnEntryId).attr("rows", rows);
  $("#" + "editCptTA" + editBtnEntryId).css("width", currentCaptionWidth);
  $("#" + "editCptTA" + editBtnEntryId).parents(":eq(1)").removeClass("d-none");
  $("#" + "cpt" + editBtnEntryId).addClass("d-none");

}).on("click", ".closeEditBtn", function(event) {
  event.preventDefault();
  event.stopPropagation();
  let editBtnEntryId = $(this).attr("value");
  let currentCaptionText = $("#" + "cpt" + editBtnEntryId).text();
  console.log(currentCaptionText);
  $("#" + "editCptTA" + editBtnEntryId).parents(":eq(1)").addClass("d-none");

  $(this).closest("form").get(0).reset();

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

//--------------------------user page view selection--------------------------//
$(".viewerChoice").click(function() {
  let btnClicked = $(this);

  userViewChoice(btnClicked);
});


//-----------------------------infinite scroll ----------------------------------//

let totalSeenIds = [];
let isWorking = 0;

if (window.location.pathname != "/settings") {
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

//-----------------------------report Entry AJAX----------------------------------//
$(document).on("click", ".reportSubmitBtn", function(event) {
  event.preventDefault();
  event.stopPropagation();

  let reportedEntryId = this.id.substr(6);
  console.log(reportedEntryId);
  let entryId = $("#eID" + reportedEntryId).closest(".card-body").attr("id");
  console.log(entryId);
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
      $("#reportModal").modal("hide");
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
  $("#bioImagePreview").empty();
  $("#bioImagePreview").addClass("d-none");
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

      $("#bioImagePreview").addClass("d-none");
      $("#userBioPicForm")[0].reset();
      $("#bioImagePreview").empty();

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
  $("#bioImagePreview").empty();
  $("#bioImagePreview").addClass("d-none");
  $("#userBioImage").removeClass("d-none");

  $(".userBioPicBtn").removeClass("d-none");
  $(".userBioPicBtn").next("#userBioPicSettingsBtnBar").addClass("d-none");

});


//------------------new bioImage preview------------------------------------------//

var loadFile = function(event) {

  loadImage(
    event.target.files[0],
    function(img) {
      $("#bioImagePreview").append(img);
    }, {
      orientation: true,
      aspectRatio: 1 / 1
    }
  );

  $("#bioImagePreview").removeClass("d-none");
  $("#userBioImage").addClass("d-none");
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

if (window.location.pathname === "/settings") {

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
