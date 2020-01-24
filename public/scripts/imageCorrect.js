jQuery(function() {
  jQuery(".orientation").each(function() {
    var div = $(this);

		let imageClassList = div.attr("class");

		if(imageClassList.includes("followingPrvw") ||
    imageClassList.includes("userProfilePic") ||
    imageClassList.includes("userSettingsImage") ||
    imageClassList.includes("collectionImg") ||
    imageClassList.includes("collectionBioImagePrvw") ||
    imageClassList.includes("favCollectionImg")) {

			loadImage(
				div.attr("image"),
				function(img) {
					div.append(img);
				}, {
					orientation: true,
					aspectRatio: 1/1,
				}
			);

		} else {
			loadImage(
	      div.attr("image"),
	      function(img) {
	        div.append(img);
	      }, {
	        orientation: true,
	      }
	    );

		}

  });

});
