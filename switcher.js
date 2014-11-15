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
			
			page.injected.resolve($wrapper);
			
			return page;
		}
		
		function setSpot(page, spot) {
			// be careful with class changes to not disrupt animations
			var $page = page.wrapper;
			
			if($page.hasClass(spot)) {
				return;
			}
			var oldSpot = $page.data("spot");
			if(oldSpot) {
				$page.removeClass(oldSpot);
			}
			$page.addClass(spot);
			$page.data("spot", spot);
			$page.addClass("show");
		}
		
		function showMetadata(page) {
			// apply page metadata
			$title.text(page.title);
			
			// preload/preview neighbors
			if(page.prev) {
				var prev = readyPage(page.prev);
				setSpot(prev, "prev");
			}
			if(page.next) {
				var next = readyPage(page.next);
				setSpot(next, "next");
			}
		}
		
		function setCurrentPage(url, pushHistory) {
			
			$(".PentagonWrapper.show").removeClass("show");
			
			// set new state
			var page = readyPage(url);
			currentPage = page;
			setSpot(page, "current");
			page.wrapper.focus();
			
			// apply metadata optimistically
			showMetadata(page);

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
				// ensure we didn't load too late to display
				if(page == currentPage) {
					showMetadata(page);
				}
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
		$(document).on("keydown", ".PentagonWrapper", function(evt) {
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
