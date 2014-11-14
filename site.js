
var Pentagon = Pentagon || [];

var JQUERY_URL = "//code.jquery.com/jquery-1.11.0.min.js";
var PENTAGON_THEME_URL = "theme.html";

/* Theme Applicator Script */
Pentagon.push(function($, loaded) {
	
	var $html = $("html");
	var $head = $("head");
	var $body = $("body");
	var htmlParser = loaded("htmlParser");
	
	/* Keep track of pages' metadata, and import any needed stylesheets
	 * and script files (without adding a file multiple times) */
	var loadedFiles = {};
	var pageRecords = {};
	
	function forMetaFiles($context, callback) {
		$context.find("head link[rel=stylesheet]").each(function() {
			var $stylesheet = $(this);
			callback($stylesheet.attr("href"), $stylesheet);
		});
		$context.find("head script").each(function() {
			var $script = $(this);
			callback($script.attr("src"), $script);
		});
	}
	
	forMetaFiles($html, function(filename, tag) {
		loadedFiles[filename] = tag;
		console.log("mark "+filename+" as preloaded");
	});
	
	function processPage($page, record) {
		// capture page data
		function getHref(rel) {
			var $links = $page.find("head link[rel="+rel+"]");
			if($links.length == 0) {
				$links = $page.find("body a[rel="+rel+"]");
			}
			return $links.attr("href");
		}
		
		record.url = getHref("self");
		record.div.append($page.find("body").contents());
		record.title = $page.find("head title").text();
		record.next = getHref("next");
		record.prev = getHref("prev");
		record.icon = getHref("icon");
		
		// capture scripts/stylesheets
		forMetaFiles($page, function(filename, $tag) {
			if(loadedFiles[filename]) {
				return;
			}
			loadedFiles[filename] = $tag;
			console.log("append "+filename+" to head");
			$head.append($tag);
		});
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
	
		var themeRecord = {};
		themeRecord.div = $("<div>");
		processPage($theme, themeRecord);
		pageRecords[themeRecord.url] = $.when(themeRecord);
		
		// extract data from initial page
		var record = {};
		record.div = themeRecord.div.find("#Content");
		processPage($html, record);
		pageRecords[record.url] = $.when(record);
		
		// rearrange contents so that the template is under the real
		// <body> and the page content is in the right <div>
		$body.append(themeRecord.div);
		
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
