var Pentagon = Pentagon || [];

Pentagon.push(function($, loaded) {
	
	loaded("Pentagon.getPage", "Pentagon.initialPage").then(
	function(getPage, initialPage) {
		initialPage.div.css("background", "#ffa");
		//var a = getPage("a.html");
		//var b = getPage("b.html");
		//$("#Holder").append(a.div);
		//$("#Holder").append(b.div);
	});
	
	
});
