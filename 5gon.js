
var _5gon = _5gon || [];

var JQUERY_URL = "//code.jquery.com/jquery-1.11.0.min.js";
var PENTAGON_THEME_URL = "theme.html";

/* Behavior Script For Typical Themes */
_5gon.push(function(loaded) {
	
	loaded("5gon.getPage", "5gon.ready", "$").then(
	function(getPage, initialPage, $) {
		
		var currentPage = null;
		
		var $body = $("body");
		var $title = $("title");
		var $holder = $("#Holder");
		
		function readyPage(url) {
			var page = getPage(url);
			if(page.wrapper) {
				return page;
			}
			
			var $wrapper = $("<div>")
			$wrapper.addClass("PentagonWrapper");
			$wrapper.attr("tabindex", -1);
			
			page.wrapper = $wrapper;
			
			// settle into final place in the DOM
			$wrapper.append(page.div);
			$holder.append($wrapper);
			
			page.loaded.then(function() {
				page.injected.resolve($wrapper);
			});
			
			return page;
		}
		
		function setSpot(contextPage, page, spot) {
			// ensure we didn't load too late to display
			if(contextPage != currentPage) return;
			
			// be careful with class changes to not disrupt animations
			var $page = page.wrapper;
			$page.addClass("show");
				
			if($page.hasClass(spot)) {
				return;
			}
			var oldSpot = $page.data("spot");
			if(oldSpot) {
				$page.removeClass(oldSpot);
			}
			$page.addClass(spot);
			$page.data("spot", spot);
		}
		
		function preload() {}
		
		function showMetadata(page) {
			// ensure we didn't load too late to display
			if(page != currentPage) return;
			
			// apply page metadata
			$title.text(page.title);
			
			// preload/preview neighbors
			readyPage(page.prev).loaded.then(function(prev) {
				setSpot(page, prev, "prev1");
				readyPage(prev.prev).loaded.then(function(prev2) {
					setSpot(page, prev2, "prev2");
				});
			});
			readyPage(page.next).loaded.then(function(next) {
				setSpot(page, next, "next1");
				readyPage(next.next).loaded.then(function(next2) {
					setSpot(page, next2, "next2");
				});
			});
		}
		
		function setCurrentPage(url, pushHistory) {
			
			// enable 3D transforms if supported
			if($body.css("perspective")
			   || $body.css("-webkit-perspective")) {
				$body.addClass("ThreeDee");
			}
			
			// ensure page change is actually needed
			var page = readyPage(url);
			if(page == currentPage) {
				return;
			}
			
			// recalculate what needs to be onscreen
			$(".PentagonWrapper.show").removeClass("show");
			
			// set new state
			currentPage = page;
			setSpot(page, page, "current");
			
			var $wrapper = page.wrapper;
			$wrapper.focus();

			// remove anything onscreen that shouldn't be
			var remove = "current prev1 prev2 next1 next2";
			$(".PentagonWrapper:not(.show)").removeClass(remove);

			// play nice with back button
			if(pushHistory){
				if(history.pushState) {
					history.pushState({url: url}, page.title, url);
				}
			}
			
			// apply metadata once we know it's loaded
			page.loaded.then(function(page) {
				showMetadata(page);
			});
		}
		
		/* Cleanup Header */
		$("head link[rel=prev]").remove();
		$("head link[rel=self]").remove();
		$("head link[rel=next]").remove();
		
		/* Initialize State */
		setCurrentPage(initialPage.url, false);
		if(history.replaceState) {
			history.replaceState({url: initialPage.url}, initialPage.title, null);
		}
		
		/* Event Handlers */
		
		// link transitions
		function linkClick(evt) {
			evt.preventDefault();
			evt.stopPropagation();
			var href = $(this).attr("href");
			setCurrentPage(href, true);
		}
		$(document).on("click", "a[rel=prev],a[rel=next]", linkClick);
		
		// click transitions
		$(document).on("click", ".PentagonWrapper", function() {
			var page = $(".PentagonPage", this).data("PentagonPage");
			setCurrentPage(page.url, true);
		});
		
		// arrow key transitions
		$(document).on("keydown", function(evt) {
			switch(evt.which) {
				case 37: // left
					if(currentPage.prev) {
						setCurrentPage(currentPage.prev, true);
					}
					return false;
				case 39: // right
					if(currentPage.next) {
						setCurrentPage(currentPage.next, true);
					}
					return false;
			}
		});
		
		// history transitions
		$(window).on("popstate", function(evt) {
			var url = evt.originalEvent.state.url;
			if(url) {
				setCurrentPage(url, false);
			}
		});
	});
	
});

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
	
	function makePageRecord() {
		$div = $("<div>");
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
		
		// register page under proper name & mark loaded
		pageRecords[record.url] = record;
		record.loaded.resolve(record);
		record.injected.then(function(wrapper) {
			loaded("#"+record.url).resolve(wrapper);
		});
	}
	
	/* Page Loader */
	var rejected = makePageRecord();
	rejected.loaded.reject();
	rejected.injected.reject();
	
	function getPage(url) {
		if(url == null) {
			return rejected;
		}
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
		// extract data from initial page, store it in
		// the theme's content holder div
		var initialRecord = makePageRecord();
		processPage($html, initialRecord);
		
		// move template <body> under the real <body>
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
		var $ = jQuery.noConflict();
		
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
