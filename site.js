
var defer = defer || [];

/* Async Script + jQuery Loader */
(function() {
	var script = document.createElement("script");
	script.src = "//code.jquery.com/jquery-1.11.0.min.js";
	script.onload = function() {
		jQuery(function($) {
			
			var loadMap = {};
			function loaded(name) {
				if(loadMap[name]) return loadMap[name];
				loadMap[name] = $.Deferred();
				return loadMap[name];
			}
			
			var queue = defer;
			defer = {
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

/* Theme Applicator Script */
defer.push(function($, loaded) {
	$("body").css("background", "red");
});

/* Dependency Test */

defer.push(function($, loaded) {
	loaded("C").then(function(C) {
		console.log("loaded A, needed "+C);
		loaded("A").resolve("apple");
	});
});

defer.push(function($, loaded) {
	$.when(loaded("A"), loaded("C")).then(function(A, C) {
		console.log("loaded B, needed "+A+" and "+C);
		loaded("B").resolve("banana");
	});
});

defer.push(function($, loaded) {
	console.log("loaded C");
	loaded("C").resolve("cherry");
});
