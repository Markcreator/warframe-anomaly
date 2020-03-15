var useTestData = false;
var languages = {
	"en": {
		"flag": "🇺🇸" // https://apps.timwhitlock.info/emoji/tables/iso3166
	},
	"nl": {
		"flag": "🇳🇱"
	},
	"ko": {
		"flag": "🇰🇷"
	},
	"cn": {
		"flag": "🇨🇳"
	}
}
var worldStateURLs = {
	"pc": "http://content.warframe.com/dynamic/worldState.php",
	"ps4": "http://content.ps4.warframe.com/dynamic/worldState.php",
	"xbox": "http://content.xb1.warframe.com/dynamic/worldState.php",
	"switch": "http://content.swi.warframe.com/dynamic/worldState.php"
};

// HTTPS upgrade
if(window.location.toString().startsWith("http://")) {
	window.location = "https://" + window.location.toString().split("http://")[1];
}

$(function() {
	// Load tooltips
	$('.tooltipped').tooltip();

	// Register languages
	languageOptions = [];
	for(langOption in languages) {
		langSettings = languages[langOption];
		languageOptions.push("<li><a data-param='lang' data-value='" + escapeHtml(langOption) + "' class='grey lighten-4 grey-text text-darken-1'>" + escapeHtml(langSettings.flag) + " " + escapeHtml(langOption.toUpperCase()) + "</a></li>");
	}
	$("#dropdown-language").append(languageOptions.join(""));

	// Register service worker for PWA support
	if("serviceWorker" in navigator) {
		navigator.serviceWorker.register("js/service-worker.js").then(function(registration) {
			window.serviceWorker = registration;
		}).catch(function(error) {
			console.warn("Service worker registration failed", error);
		});
	}
	
	// Get which platform
	var url_string = window.location.href;
	var url = new URL(url_string);
	var platform;
	try {
		platform = url.searchParams.get("platform");
	} catch(err) {
	}
	if(platform == null || !(platform in worldStateURLs)) {
		platform = "pc";
	}
	$("#" + platform).addClass("indigo-text text-darken-2");
	var worldStateURL = worldStateURLs[platform];
	
	// Get which language
	var language;
	var dictionary = {};
	try {
		language = url.searchParams.get("lang");
	} catch(err) {
	}
	if(language == null || !(language in languages)) {
		language = "en";
	}
	
	loadLanguage(language);
	
	// Audio feedback
	var audio = new Audio('sound/sound.mp3');
	audio.volume = localStorage.sound || 0;
	function loadSoundButton(volume) {
		if(!volume) {
			$("#sounds").addClass("red");
			$("#sounds").removeClass("green");
			$("#soundsIcon").text("volume_off");
		
		} else if(volume == 0.33) {
			$("#sounds").addClass("green");
			$("#sounds").removeClass("red");
			$("#soundsIcon").text("volume_down");
			
		} else {
			$("#sounds").addClass("green");
			$("#sounds").removeClass("red");
			$("#soundsIcon").text("volume_up");
		}
	}
	$("#sounds").click(function() {
		if(!localStorage.sound) {
			localStorage.sound = 0.33;
		} else if(localStorage.sound == 0.33) {
			localStorage.sound = 1.0;
		} else {
			delete localStorage.sound;
		}
		
		loadSoundButton(localStorage.sound);
		
		audio.volume = localStorage.sound || 0;
		if(audio.volume != 0) {
			audio.pause();
			audio.currentTime = 0;
			audio.play();
		}
	});
	loadSoundButton(localStorage.sound);
	
	// Night mode
	$("#night").click(function() {
		if($(this).hasClass("amber")) {
			$(this).removeClass("amber");
			$(this).addClass("blue darken-3");
			$("#nightIcon").text("brightness_3");
			localStorage.night = true;
			
			$("body, .nav-wrapper, .card, a").not(".btn, .brand-logo").addClass("darken-4").not("li a").addClass("grey-text");
			$("img").addClass("darkImg");
			
		} else {
			$(this).addClass("amber");
			$(this).removeClass("blue darken-3");
			$("#nightIcon").text("brightness_5");
			delete localStorage.night;
			
			$("body, .nav-wrapper, .card, a").not(".btn, .brand-logo").removeClass("darken-4").not("li a").removeClass("grey-text");
			$("img").removeClass("darkImg");
		}
	});
	if(localStorage.night) {
		$("#night").click();
	}
	
	// Notifications
	$("#notifications").click(function() {
		if($(this).hasClass("red")) {
			Notification.requestPermission().then(function(result) {
				if(result === "granted") {
					$("#notifications").removeClass("red");
					$("#notifications").addClass("green");
					localStorage.notifications = true;
				}
			});

		} else {
			$(this).addClass("red");
			$(this).removeClass("green");
			delete localStorage.notifications;
		}
	});
	if(localStorage.notifications) {
		$("#notifications").click();
	}
	
	// Parameter appending
	$("[data-param]").on("click", function(e) {
		e.preventDefault();
		var param = $(this).data("param");
		var value = $(this).data("value");
		
		url.searchParams.set(param, value);
		window.location = url;
	});
	
	// Data
	
	var nodes = {
		"CrewBattleNode505": {
			"value": "Ruse War Field (Veil Proxima)"
		},
		"CrewBattleNode510": {
			"value": "Gian Point (Veil Proxima)"
		},
		"CrewBattleNode550": {
			"value": "Nsu Grid (Veil Proxima)"
		},
		"CrewBattleNode551": {
			"value": "Ganalen's Grave (Veil Proxima)"
		},
		"CrewBattleNode552": {
			"value": "Rya (Veil Proxima)"
		},
		"CrewBattleNode553": {
			"value": "Flexa (Veil Proxima)"
		},
		"CrewBattleNode554": {
			"value": "H-2 Cloud (Veil Proxima)"
		},
		"CrewBattleNode555": {
			"value": "R-9 Cloud (Veil Proxima)"
		}
	};
	var worldState;
	var disc = false;
	
	// Timers
	// TODO turn into timed anomaly discovery
	/*for(var acolyte in acolytes) {
		var json = acolytes[acolyte];
		var name = json.name;
		var mods = json.mods;
		
		if(new Date().getTime() < json.arrival) {
			var output = [];
			output.push('<div id="' + name + '-timer-card" class="card grey lighten-4 horizontal hoverable">');

			output.push('<div class="card-content flow-text">');
			output.push("	<b>" + name.toUpperCase() + '</b> arrives in: <span id="' + name + '-timer"></span>');
			output.push("			<a class='dropdown-button btn waves-effect waves-light grey darken-3 grey-text right' data-beloworigin='true' data-activates='dropdown-" + name + "'>Drops</a>");
			output.push("			<ul id='dropdown-" + name + "' class='dropdown-content'>");
			var x = 0;
			for(var x = 0; x < mods.length; x++) {
			output.push("				<li><a target='_blank' href='http://warframe.wikia.com/wiki/" + mods[x].split(" (")[0].replace(" ", "_") + "' class='grey lighten-4 grey-text text-darken-1'>" + mods[x] + "</a></li>");
			}
			output.push("			</ul");
			output.push('</div>');
		
			$("#timers").append(output.join(""));
			
			startTimer($("#" + name + "-timer"), json.arrival, $("#" + name + "-timer-card"));
		}
	}*/
	
	// Start update loop
	update();
	
	// Functions
	
	function getJSON(url, callback) {
		$.getJSON('https://api.allorigins.win/get?url=' + encodeURIComponent(url), function(data) {
			callback(JSON.parse(data.contents));
		});
	}
	
	function loadLanguage(lang) {
		if(window.location.toString().startsWith("file://")) {
			alert("Sorry, language loading is not available.");
		} else {
			$.getJSON("lang/" + lang + ".json", function(data) {
				dictionary = data;

				$("[data-lang]").each(function() {
					var key = $(this).data("lang");
					$(this).text(getLangText(key));
				});
			});
		}
	}

	function getLangText(key) {
		return escapeHtml(dictionary[key] || dictionary["undefined"] || "N/A");
	}

	function escapeHtml(unsafe) {
		return unsafe
			 .replace(/&/g, "&amp;")
			 .replace(/</g, "&lt;")
			 .replace(/>/g, "&gt;")
			 .replace(/"/g, "&quot;")
			 .replace(/'/g, "&#039;");
	}
	
	// Update countdown function
	function loopCountdownUpdate(seconds, callback, timesLeft) {
		if(typeof(timesLeft) == 'undefined') {
			timesLeft = seconds;
		}
		$("#counter").text(timesLeft != 0 ? (getLangText("refreshin") + ' ' + timesLeft + ' ' + getLangText("seconds")) : "");
		
		if(timesLeft == 0) {
			callback();
			
		} else {
			setTimeout(function() { loopCountdownUpdate(seconds, callback, timesLeft-1); }, 1000);
		}		
	}
	
	// Function to render anomaly cards
	function render() {
		$("#anomaly").empty();
		var tmpState = JSON.parse(worldState.Tmp);
		var currentDisc = typeof tmpState.sfn !== 'undefined';
		var location = currentDisc ? escapeHtml(nodes["CrewBattleNode" + tmpState.sfn].value) : getLangText("unknown");
		
		if(disc != currentDisc) {
			disc = currentDisc;
			
			if($("#sounds").hasClass("green")) {
				audio.play();
			}
			if($("#notifications").hasClass("green")) {
				notifyAnomaly(disc, location);
			}
		}
			
		var output = [];
		output.push('<div id="anomaly" class="card grey lighten-4 horizontal hoverable">');
		output.push('	<div class="card-image">');
		output.push('		<img src="img/anomaly.jpg">');
		output.push('	</div>');
		output.push('	<div class="card-stacked">');
		output.push('		<div class="card-content flow-text">');
		output.push("			<b>Sentient Anomaly</b>");
		output.push("			<br/>");
		output.push("			<b>" + getLangText("location") + "</b> " + location);
		output.push("			<br/>");
		output.push('		</div>');
		output.push('	</div>');
		output.push('</div>');
		
		$("#anomaly").append(output.join(""));
		
		$('.dropdown-button').dropdown({
			constrainWidth: false
		});
		
		//Night mode
		if($("#night").hasClass("blue")) {
			$(".card, a").not(".btn, .brand-logo").addClass("darken-4").not("li a").addClass("grey-text");
			$("img").addClass("darkImg");
		}
	}
	
	// UI refreshing behaviour
	function update() {
		$("#loader").show();
		$("#counter").hide();
		
		getJSON(worldStateURL, function(worldStateJSON) {
			worldState = worldStateJSON;

			render();
			
			$("#loader").hide();
			loopCountdownUpdate(30, update);
			$("#counter").show();
		});
	}
	
	// Notification behaviour
	function notifyAnomaly(disc, location) {
		var title = "Anomaly Tracker";
		var options = {
			icon: 'img/anomaly.jpg',
			body: "Sentient Anomaly" + getLangText("acolytelocationupdate") + "\n" + location
		};
		
		if (!("Notification" in window)) {
			return;
		
		} else if (Notification.permission === "granted") {
			var notification = new Notification(title, options);
		
		} else if (Notification.permission !== 'denied') {
			Notification.requestPermission(function (permission) {
				if (permission === "granted") {
					var notification = new Notification(title, options);
				}
			});
		}
		
		// Else no notifications
	}
	
	function startTimer(targetDiv, epoch, removeOnEnd) {
		setInterval(function() {
			var distance = epoch - new Date().getTime();
			
			// Time calculations for days, hours, minutes and seconds
			var days = Math.floor(distance / (1000 * 60 * 60 * 24));
			var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
			var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
			var seconds = Math.floor((distance % (1000 * 60)) / 1000);

			targetDiv.text(days + " " + getLangText("days") + " " + hours + " " + getLangText("hours") + " " + minutes + " " + getLangText("minutes") + " " + seconds + " " + getLangText("seconds"));

			// If the count down is finished, write some text
			if (distance < 0) {
				clearInterval(this);
				removeOnEnd.remove();
			}
		}, 1000);
	}
});