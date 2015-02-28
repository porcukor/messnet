var gpsStatus = document.getElementById("gpsStatus");

function gpsCheck () {

	var output = document.getElementById("gpsOut");
	var signal = document.getElementById("signalIndicator");

	var options = {
  		enableHighAccuracy: true,
  		maximumAge: 0
	};

	if (!navigator.geolocation){
		output.innerHTML = "<p>Geolocation is not supported by your browser</p>";
    	return;
	}

  	function success(position) {
    	var latitude  = position.coords.latitude;
    	var longitude = position.coords.longitude;

    	output.innerHTML = '<p>Szélesség ' + latitude + '° <br>Hosszúság ' + longitude + '°</p>';
    	signal.innerHTML = "Van";

    	var img = new Image();
    	img.src = "http://maps.googleapis.com/maps/api/staticmap?center=" + latitude + "," + longitude + "&zoom=13&size=300x300&sensor=false";

    	output.appendChild(img);

    	console.log(position.timestamp);
  		console.log(position.coords.accuracy);
  	};

  	function error() {
    	signal.innerText = "Nincs";
  	};

  	output.innerHTML = "<p>Keresés…</p>";

  	navigator.geolocation.getCurrentPosition(success, error, options);

}

function dataCheck () {
	var mobileData = navigator.mozConnection.metered;
	var dataStatus = document.getElementById("dataStatus");
	if (mobileData) {
		dataStatus.style.color = "green";
		dataStatus.innerHTML = "Van";
	} else {
		dataStatus.style.color = "red";
	}
	console.log(mobileData);
}

gpsCheck();
dataCheck();

