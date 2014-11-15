var Pentagon = Pentagon || [];

Pentagon.push(function(loaded) {
	
	loaded("Pentagon.getPage", "Pentagon.initialPage", "$").then(
	function(getPage, initialPage, $) {
		
		var currentPage = null;
		var prevPage = null;
		var nextPage = null;
		
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
			
			$holder.append($wrapper);
			$wrapper.append(page.div);
			return page;
		}
		
		function showMetadata(page) {
			// apply page metadata
			$title.text(page.title);
			
			// preload/preview neighbors
			// be careful with class changes to not disrupt animations
			if(page.prev != prevPage) {
				$(".PentagonWrapper.prev").removeClass("prev");
				prevPage = page.prev;
			}
			if(page.prev) {
				var prev = readyPage(page.prev);
				prev.wrapper.addClass("prev");
			}
			if(page.next != nextPage) {
				$(".PentagonWrapper.next").removeClass("next");
				nextPage = page.next;
			}
			if(page.next) {
				var next = readyPage(page.next);
				next.wrapper.addClass("next");
			}
		}
		
		function setCurrentPage(url, pushHistory) {
			
			// set new state
			var page = readyPage(url);
			currentPage = page;
			$(".PentagonWrapper.current").removeClass("current");
			page.wrapper.addClass("current");
			page.wrapper.focus();
			
			// apply metadata optimistically
			showMetadata(page);

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
					break;
				case 39: // right
					if(currentPage.next) {
						setCurrentPage(currentPage.next, true);
					}
					break;
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
