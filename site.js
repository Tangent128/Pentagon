
var Pentagon = Pentagon || [];

var JQUERY_URL = "//code.jquery.com/jquery-1.11.0.min.js";
var PENTAGON_THEME_URL = "theme.html";

/* Page Loading & Theme Applicator Script */
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
			// create new script element to ensure the script will run
			var src = $(this).attr("src");
			var $script = $("<script>");
			$script.attr("src", src);
			callback(src, $script);
		});
	}
	
	// register preloaded files so we don't try pulling them in again
	forMetaFiles($html, function(filename, $tag) {
		loadedFiles[filename] = true;
	});
	
	function makePageRecord($div) {
		$div = $div || $("<div>");
		var record = {
			div: $div,
			title: "",
			loaded: $.Deferred()
		};
		record.div.data("PentagonPage", record);
		return record;
	}
	
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
		
		// register page under proper name & mark loaded
		pageRecords[record.url] = record;
		record.loaded.resolve(record);
		
		// import scripts/stylesheets that aren't already loaded
		forMetaFiles($page, function(filename, $tag) {
			if(loadedFiles[filename]) {
				return;
			}
			loadedFiles[filename] = true;
			// need to append tag via raw DOM methods to
			// prevent jQuery from messing with the url:
			$head[0].appendChild($tag[0]);
		});
	}
	
	/* Page Loader */
	function getPage(url) {
		if(pageRecords[url]) {
			return pageRecords[url];
		}
		var record = makePageRecord();
		pageRecords[url] = record;
		
		var request = $.ajax({
			url: url,
			dataType: "html"
		});
		
		$.when(request, htmlParser).then(function(result, parser) {
			var html = result[0];
			var $page = $(parser.parseFromString(html, "text/html"));
			processPage($page, record);
		});
		
		return record;
	}
	
	/* Load & apply theme */
	getPage(PENTAGON_THEME_URL).loaded.then(function(themeRecord) {
		var $contentDiv = themeRecord.div.find("#Content");
		
		// extract data from initial page, store it in
		// the theme's content holder div
		var initialRecord = makePageRecord($contentDiv);
		processPage($html, initialRecord);
		
		// rearrange contents so that the template is under the real
		// <body> and the page content is in the theme's <div>
		$body.append(themeRecord.div);
		
		loaded("Pentagon.initialPage").resolve(initialRecord);
	});
	
	/* Exports */
	loaded("Pentagon.getPage").resolve(getPage);
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

/* HTML Parser slightly-hacky polyfill */
Pentagon.push(function($, loaded) {
	try {
		// test inspired by https://gist.github.com/eligrey/1129031
		var parser = new DOMParser();
		if(parser.parseFromString("", "text/html")) {
			loaded("htmlParser").resolve(parser);
			return;
		}
	} catch(ex) {}
	
	loaded("htmlParser").resolve({
		parseFromString: function(src, assumedToBeHTML) {
			var html = $("<html>");
			var body = $("<body>");
			html.append(body);
			
			body[0].outerHTML = src;
			
			return html;
		}
	});
});
