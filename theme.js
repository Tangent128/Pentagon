var Pentagon = Pentagon || [];

Pentagon.push(function(loaded) {
	
	loaded("Pentagon.getPage", "Pentagon.initialPage", "$").then(
	function(getPage, initialPage, $) {
		
		var currentPage = null;
		
		var $title = $("title");
		var $holder = $("#Holder");
		
		function readyPage(url) {
			var page = getPage(url);
			if(page._readied) {
				return page;
			}
			page._readied = true;
			$holder.append(page.div);
			return page;
		}
		
		function showMetadata(page) {
			// apply page metadata
			$title.text(page.title);
			
			// preload/preview neighbors
			if(page.prev) {
				var prev = readyPage(page.prev);
				prev.div.addClass("prev");
			}
			if(page.next) {
				var next = readyPage(page.next);
				next.div.addClass("next");
			}
		}
		
		function setCurrentPage(url, pushHistory) {
			// reset view state
			$(".PentagonPage.current").removeClass("current");
			$(".PentagonPage.prev").removeClass("prev");
			$(".PentagonPage.next").removeClass("next");
			
			// set new state
			var page = readyPage(url);
			currentPage = page;
			page.div.addClass("current");
			
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
		
		/* Initialize State */
		setCurrentPage(initialPage.url, false);
		if(history.replaceState) {
			history.replaceState({url: initialPage.url}, initialPage.title, null);
		}
		
		/* Event Handlers */
		function linkClick(evt) {
			evt.preventDefault();
			evt.stopPropagation();
			var href = $(this).attr("href");
			setCurrentPage(href, true);
		}
		$(document).on("click", "a[rel=prev],a[rel=next]", linkClick);
		
		$(window).on("popstate", function(evt) {
			var url = evt.originalEvent.state.url;
			if(url) {
				setCurrentPage(url, false);
			}
		});
	});
	
});
