
var Pentagon = Pentagon || [];

var JQUERY_URL = "//code.jquery.com/jquery-1.11.0.min.js";
var PENTAGON_THEME_URL = "site.html";

/* Theme Applicator Script */
Pentagon.push(function($, loaded) {
	
	/* Fetch & apply theme */
	$.ajax({
		url: PENTAGON_THEME_URL,
		dataType: "html"
	}).then(function(html) {
		var $body = $("body");
		// parse template
		// jQuery loses track of html/head/body tags in parsing,
		// so we hackily find those parts of the page on our own. >.<
		var head = html.match(/<head>([\s\S]*)<\/head>/m);
		var body = html.match(/<body>([\s\S]*)<\/body>/m);
		
		var $themeHead = $("<div>").append($.parseHTML(head[1]));
		var $themeBody = $.parseHTML(body[1]);
		
		// grab template & page content
		var $initialContent = $body.contents();
		
		// rearrange contents so that the template is under the real
		// <body> and the page content is in the right <div>
		$body.append($themeBody);
		var $content = $("#Content");
		$content.append($initialContent);
		
		// loaded("Pentagon.initialPage").resolve({... div = $content});
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
			
			var queue = Pentagon;
			Pentagon = {
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
