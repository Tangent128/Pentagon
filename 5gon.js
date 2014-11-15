
var _5gon = _5gon || [];

var JQUERY_URL = "//code.jquery.com/jquery-1.11.0.min.js";
var PENTAGON_THEME_URL = "theme.html";

/* Page Loading & Theme Applicator Script */
_5gon.push(function(loaded) {loaded("$").then(function($) {
	
	var $html = $("html");
	var $head = $("head");
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
		$context.find("head style").each(function() {
			var $stylesheet = $(this);
			callback(null, $stylesheet);
		});
		$context.find("head script").each(function() {
			// create new script element to ensure the script will run
			var src = $(this).attr("src");
			var $script = $("<script>");
			if(src) {
				$script.attr("src", src);
				callback(src, $script);
			} else {
				$script.text($(this).text());
				callback(null, $script);
			}
		});
	}
	
	// register preloaded files so we don't try pulling them in again
	forMetaFiles($html, function(filename, $tag) {
		loadedFiles[filename] = (filename != null);
	});
	
	function makePageRecord($div) {
		$div = $div || $("<div>");
		var record = {
			div: $div,
			title: "",
			loaded: $.Deferred(),
			injected: $.Deferred()
		};
		$div.data("PentagonPage", record);
		$div.addClass("PentagonPage");
		return record;
	}
	
	function processPage($page, record, importInlines) {
		// capture page data
		function getHref(rel) {
			var $links = $page.find("head link[rel="+rel+"]");
			if($links.length == 0) {
				$links = $page.find("body a[rel="+rel+"]");
			}
			return $links.attr("href");
		}
		
		var $pageBody = $page.find("body");
		
		record.url = getHref("self");
		record.title = $page.find("head title").text();
		record.next = getHref("next");
		record.prev = getHref("prev");
		record.icon = getHref("icon");
		record.div.append($pageBody.contents());
		
		// register page under proper name & mark loaded
		pageRecords[record.url] = record;
		record.loaded.resolve(record);
		
		// import scripts/stylesheets that aren't already loaded
		forMetaFiles($page, function(filename, $tag) {
			if(loadedFiles[filename]) {
				return;
			}
			if(filename != null || importInlines) {
				loadedFiles[filename] = (filename != null);
				// need to append script tag via raw DOM methods
				// to prevent jQuery from messing with the url:
				$head[0].appendChild($tag[0]);
			}
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
			processPage($page, record, true);
		});
		
		return record;
	}
	
	/* Load & apply theme */
	var theme = getPage(PENTAGON_THEME_URL);
	$.when(theme.loaded, loaded("$.ready")).then(function(themeRecord) {
		var $contentDiv = themeRecord.div.find("#Content");
		
		// extract data from initial page, store it in
		// the theme's content holder div
		var initialRecord = makePageRecord($contentDiv);
		processPage($html, initialRecord);
		
		// rearrange contents so that the template is under the real
		// <body> and the page content is in the theme's <div>
		var $body = $("body");
		$body.append(themeRecord.div.contents());
		
		// everything is in the proper place
		loaded("5gon.ready").resolve(initialRecord);
	});
	
	/* Exports */
	loaded("5gon.getPage").resolve(getPage);
});});

/* Async Script + jQuery Loader */
(function() {
	var script = document.createElement("script");
	script.src = JQUERY_URL;
	script.onload = function() {
		var $ = jQuery.noConflict(true);
		
		var loadMap = {};
		function grabDeferred(name) {
			if(loadMap[name]) return loadMap[name];
			loadMap[name] = $.Deferred();
			return loadMap[name];
		}
		function loaded() {
			if(arguments.length == 1) {
				// don't wrap, so resolve() can be called on it
				return grabDeferred(arguments[0]);
			}
			var deferreds = [];
			for(var i = 0; i < arguments.length; i++) {
				deferreds.push(grabDeferred(arguments[i]));
			}
			return $.when.apply($, deferreds);
		}
		loaded("$").resolve($);
		
		var queue = _5gon;
		_5gon = {
			push: function(callback) {
				callback(loaded);
			}
		};
		
		$.each(queue, function(i, callback) {
			callback(loaded);
		});
		
		$(function() {
			loaded("$.ready").resolve($);
		});
	};
	document.head.appendChild(script);
	
})();

/* HTML Parser slightly-hacky polyfill */
_5gon.push(function(loaded) {loaded("$").then(function($) {
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
});});
