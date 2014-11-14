
var $defer = $defer || [];

var JQUERY_URL = "//code.jquery.com/jquery-1.11.0.min.js";
var PENTAGON_THEME_URL = "site.html";

/* Theme Applicator Script */
$defer.push(function($, loaded) {
	$.ajax({
		url: PENTAGON_THEME_URL,
		dataType: "html"
	}).then(function(html) {
		$themePage = $(html);
	});
});

/* Async Script + jQuery Loader */
(function() {
	var script = document.createElement("script");
	script.src = JQUERY_URL;
	script.onload = function() {
		jQuery(function($) {
			
			var loadMap = {};
			function loaded(name) {
				if(loadMap[name]) return loadMap[name];
				loadMap[name] = $.Deferred();
				return loadMap[name];
			}
			
			var queue = $defer;
			$defer = {
				push: function(callback) {
					callback($, loaded);
				}
			};
			
			$.each(queue, function(i, callback) {
				callback($, loaded);
			});
		});
	};
	document.head.appendChild(script);
	
})();
