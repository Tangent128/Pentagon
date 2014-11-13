(function(script, styleLink) {
	script.src = "//code.jquery.com/jquery-1.11.0.min.js";
	script.onload = function() {
		$(init);
	};
	document.head.appendChild(script);
	
	function init($) {
		$("body").css("background", "red");
	}
})(document.createElement("script"));
