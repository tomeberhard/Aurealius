$("#flexBtn").click(function() {
  const btnClicked = $(this);

  toggleDestination(btnClicked);
})

//---functions---//

function toggleDestination (btnClicked) {

  var toggler = $(btnClicked).text();

  if (toggler === "Your Gratitude") {
    $("#flexBtn").text("Activity Page").attr("href", "/index");
  } else {
    $("#flexBtn").text("Your Gratitude").attr("href", "/user");
  }
}
