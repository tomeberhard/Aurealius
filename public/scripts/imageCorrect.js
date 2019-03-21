jQuery(function() {
	jQuery(".orientation").each(function() {
		var div = $(this);
		loadImage(
		        div.attr("image"),
		        function (img) { div.append(img); },
		        {orientation: true}
		    );

	});

})
