
var Pentagon = Pentagon || [];

var JQUERY_URL = "//code.jquery.com/jquery-1.11.0.min.js";
var PENTAGON_THEME_URL = "site.html";

/* Theme Applicator Script */
Pentagon.push(function($, loaded) {
	
	var htmlParser = loaded("htmlParser");
	
	/* Keep track of pages' nav links for swapout, while
	 * importing scripts/styles sitewide */
	var loadedFiles = {};
	var $head = $("head");
	var $body = $("body");
	
	function processPage($page) {
		function getLinks(rel) {
			var $links = $page.find("head link[rel="+rel+"]");
			if($links.length == 0) {
				$links = $page.find("body a[rel="+rel+"]");
			}
			return $links;
		}
		
		var record = {};
		record.url = getLinks("self").attr("href");
		record.div = $("<div>").append($page.find("body").content());
		
		return record;
	}
	
	/* Fetch & apply theme */
	var themeRequest = $.ajax({
		url: PENTAGON_THEME_URL,
		dataType: "html"
	});
	
	$.when(themeRequest, htmlParser).then(function(themeResult, parser) {
		var html = themeResult[0];
		// parse template
		var $theme = $(parser.parseFromString(html, "text/html"));
		var $themeHead = $theme.find("head");
		var $themeBody = $theme.find("body").contents();
		
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

/* HTML Parser hacky polyfill */
Pentagon.push(function($, loaded) {
	try {
		// inspired by https://gist.github.com/eligrey/1129031
		var parser = new DOMParser();
		if(parser.parseFromString("", "text/html")) {
			loaded("htmlParser").resolve(parser);
			return;
		}
	} catch(ex) {}
	
	loaded("htmlParser").resolve({
		parseFromString: function(src) {
			var html = $("<html>");
			
			// jQuery loses track of html/head/body tags in parsing,
			// so we hackily find those parts of the page on our own. >.<
			var head = $("<head>").html(src.match(/<head>([\s\S]*)<\/head>/m)[1]);
			var body = $("<body>").html(src.match(/<body>([\s\S]*)<\/body>/m)[1]);
			
			html.append(head);
			html.append(body);
			return html;
		}
	});
});
