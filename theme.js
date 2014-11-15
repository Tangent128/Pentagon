var Pentagon = Pentagon || [];

Pentagon.push(function(loaded) {
	
	loaded("Pentagon.getPage", "Pentagon.initialPage", "$").then(
	function(getPage, initialPage, $) {
		
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
		
		function setCurrentPage(url, pushHistory) {
			// reset view state
			$(".PentagonPage.current").removeClass("current");
			
			// set new state
			var page = readyPage(url);
			page.div.addClass("current");

			// play nice with back button
			if(pushHistory){
				if(history.pushState) {
					history.pushState({url: url}, page.title, url);
				}
			}
			
			// preload neighbors
			page.loaded.then(function(page) {
				if(page.prev) readyPage(page.prev);
				if(page.next) readyPage(page.next);
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
