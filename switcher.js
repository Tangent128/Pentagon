var _5gon = _5gon || [];

_5gon.push(function(loaded) {
	
	loaded("5gon.getPage", "5gon.ready", "$").then(
	function(getPage, initialPage, $) {
		
		var currentPage = null;
		
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
				setSpot(page, prev, "prev");
				readyPage(prev.prev).loaded.then(function(prev2) {
					setSpot(page, prev2, "prev2");
				});
			});
			readyPage(page.next).loaded.then(function(next) {
				setSpot(page, next, "next");
				readyPage(next.next).loaded.then(function(next2) {
					setSpot(page, next2, "next2");
				});
			});
		}
		
		function setCurrentPage(url, pushHistory) {
			
			$(".PentagonWrapper.show").removeClass("show");
			
			// enable 3D transforms if supported
			if($holder.css("perspective")
			   || $holder.css("-webkit-perspective")) {
				$holder.addClass("ThreeDee");
			}
			
			// set new state
			var page = readyPage(url);
			currentPage = page;
			setSpot(page, page, "current");
			
			var $wrapper = page.wrapper;
			$wrapper.focus();

			// remove anything onscreen that shouldn't be
			$(".PentagonWrapper.current:not(.show)").removeClass("current");
			$(".PentagonWrapper.prev:not(.show)").removeClass("prev");
			$(".PentagonWrapper.next:not(.show)").removeClass("next");

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
