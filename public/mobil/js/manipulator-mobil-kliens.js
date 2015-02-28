"use strict";
var server_hostname=window.location.hostname;
var server_address = 'http://' + server_hostname + ':3456';
var socket = io.connect(server_address);

var futarData, munkaData;
var messages = [];

var gpsStatus = document.getElementById("gpsStatus");
var currentLat, currentLng;

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
		currentLat = position.coords.latitude;
		currentLng = position.coords.longitude;
		output.innerHTML = '<p>Szélesség ' + currentLat + '° <br>Hosszúság ' + currentLng + '°</p>';
		signal.innerHTML = "Van";

		var img = new Image();
		img.src = "http://maps.googleapis.com/maps/api/staticmap?center=" + currentLat + "," + currentLng + "&zoom=13&size=300x300&sensor=false";
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
	var mobileData = window.navigator.onLine;
	var dataStatus = document.getElementById("dataStatus");
	if (mobileData) {
		dataStatus.style.color = "green";
		dataStatus.innerHTML = "Van";
	} else {
		dataStatus.style.color = "red";
	}
	console.log(mobileData);
}

function distance(lat1, lon1, lat2, lon2) {
console.log(' lat1: '+ lat1 + ' lon1: '+ lon1 + ' lat2: '+ lat2 + ' lon2: '+ lon2);
	var radlat1 = Math.PI * lat1/180;
	var radlat2 = Math.PI * lat2/180;
	var radlon1 = Math.PI * lon1/180;
	var radlon2 = Math.PI * lon2/180;
	var theta = lon1-lon2;
	var radtheta = Math.PI * theta/180;
	console.log('rad: '+radtheta);
	var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
	console.log('DIST: '+dist);
	dist = Math.acos(dist);
	dist = dist * 180/Math.PI;
	dist = dist * 60 * 1.1515;
	return dist;
}             

function sorWelder(data)  {
	var sor='';
	console.log(data);
	var j = 0,
	ido_fel = null,
	ido_le = null,
	ido_be = null;
	// var ido_be = new Date(data.log[0].ido).toLocaleTimeString('hu-HU'); // TODO: Hianyzik egy validalas, mi van ha az elso log event nem a beerkezest tarolja?
	ido_be = data.log[0].creationDate;
	
	while (data.log[j]) {
		if (data.log[j].tipus=='fel') {
			ido_fel = data.log[j].ido;
		}
		if (data.log[j].tipus=='le') {
			ido_le = data.log[j].ido;
		}
		j++;
	}

// sor+='<li id="'+data._id+'"><span>'+ido_be+'</span><span>';
// if (ido_fel==null) { sor+= 'Várakozik';}
// else {
// 	if (ido_le==null) { sor+= 'Felvéve';}
// else if (ido_le!=null) { sor+= 'Leadva';}
// }
// sor+='</span>';
	if (data.status>=2) { // Ha mar hozza lett rendelve az archoz
	
		if (data.status==2 || data.status==3) { // Fel kell venni
			sor+='<li data-icon="arrow-u"><a href="#page-4" class="p4link" data-id="'+data._id+'">';
		}
		if (data.status==4 || data.status==5) { // Le kell adni
			sor+='<li data-icon="arrow-d"><a href="#page-4" class="p4link" data-id="'+data._id+'">';
		}
		
		sor+='<h2>'+data.cim.honnan.zip+' '+data.cim.honnan.utca+'</h2>';
		sor+='<p>'+data.cim.hova.zip+' '+data.cim.hova.utca+'</p>';
		sor+='<span class="ui-li-count">'+data.tav+'</span>';
		sor+='</a><a href="#"></a></li>';
		//console.log('Egy sor 2-nel nagyobb:'+data.cim.honnan.zip+' '+data.cim.honnan.utca);
	}
	else if (data.status<2) // Ha meg nincs akkor odalistazzuk az elfogadandokhoz
		{
		sor+='<li data-icon="arrow-u"><a href="#page-4" class="p4link" data-id="'+data._id+'">';
		sor+='<h2>'+data.cim.honnan.zip+' '+data.cim.honnan.utca+'</h2>';
		sor+='<p>'+data.cim.hova.zip+' '+data.cim.hova.utca+'</p>';
		sor+='<span class="ui-li-count">'+data.tav+'</span>';
		sor+='</a><a href="#"></a></li>';
		//console.log('Egy sor 2-nel kisebb:'+data.cim.honnan.zip+' '+data.cim.honnan.utca);
		}
	console.log(sor);
	return sor;
}

var app = {
	init: function(){

		this.list();
		this.actions();
		this.socketActions();
	},

	SendClientMsg: function(message) {
		socket.emit('ClientMsg', { text: message, id: socket.socket.sessionid});
	},

	actions: function(){

	// Chat events
		$('#chat-input-button').click(function(e) {
			var message=$('#chat-input-field').val();
			app.SendClientMsg(message);
			$('#chat-input-field').val('');
			e.preventDefault;
			console.log("megnyomtál!");
			return false;
		});
  
		$('#chat-input-field').keypress(function(event) {
			if (event.which == 13) {
			  var message=$('#chat-input-field').val();
			  app.SendClientMsg(message);
				$('#chat-input-field').val('');
			}
		});
		
		$('#msg1').click(function(e) {
			app.SendClientMsg('Defektem van!');
			e.preventDefault;
			return false;
		});
		
		$('#msg2').click(function(e) {
			app.SendClientMsg('Várni kell');
			e.preventDefault;
			return false;
		});
		
		$('#msg3').click(function(e) {
			app.SendClientMsg('Itt vagyok: Lat:' + currentLat + ' Lng: ' + currentLng+ '!');
			$('#chat-input-field').val('');
			e.preventDefault;

			return false;
		});
		

	},

	list: function(){
		socket.on('ListAllMunka', function(data){
		var newLineAktiv = '';
		var newLineElfogadando = '';
			munkaData = data;
			console.log(munkaData);
			$('#munka-list ul').html('');
			$( "#page-2" ).on( "pagebeforecreate", function( event ) {
				for(var i = 0; i< data.length; i++){
						if (data[i].status>=2) { // Ha mar hozza lett rendelve az archoz
						newLineAktiv += sorWelder(data[i]);
//						console.log('Aktiv');
						}
						if (data[i].status<2) {// Ha meg nincs akkor odalistazzuk az elfogadandokhoz
						newLineElfogadando += sorWelder(data[i]);
//						console.log('Elfog');
						}
				}	
					alert(newLineAktiv);
					$('#munka-list ul').append('<li data-role="list-divider">Aktív</li>').append(newLineAktiv);
					$('#munka-list ul').append('<li data-role="list-divider">Elfogadásra vár</li>').append(newLineElfogadando);
				
//						$("#page-2").trigger("refresh");
//						$.mobile.activePage.trigger("refresh");
//						console.log('Page2 loaded with: ' + newLine);
				
				});
			
		
		
			var munkaId, buttonClicked, tavKm;
			
			$(document).on('pagebeforeshow', '#page-2', function(){       
				 $('a.p4link').on("click", function() {
					buttonClicked = $(this);
					console.log(buttonClicked);
					munkaId = $(this).data("id");
					console.log('Clicked on id: '+munkaId);
					//Change page
					$.mobile.changePage("#page-4");
				});    
			});

			$(document).on('pagebeforeshow', '#page-4', function(){    
				var i, chosenMunka;
				
				for (var i in munkaData) {
				  if (munkaData[i]._id == munkaId) {
					chosenMunka = munkaData[i];
				  }
				}
				
				$('#page-4 .honnan_zip').append(chosenMunka.cim.honnan.zip);
				$('#page-4 .honnan_varos').append(chosenMunka.cim.honnan.varos);
				$('#page-4 .honnan_utca').append(chosenMunka.cim.honnan.utca);
				$('#page-4 .honnan_info').append(chosenMunka.cim.honnan.info);
				
				$('#page-4 .hova_zip').append(chosenMunka.cim.hova.zip);
				$('#page-4 .hova_varos').append(chosenMunka.cim.hova.varos);
				$('#page-4 .hova_utca').append(chosenMunka.cim.hova.utca);
				$('#page-4 .hova_info').append(chosenMunka.cim.hova.info);
				
				$('#page-4 .megrendelo').append(chosenMunka.megrendelo);
				$('#page-4 .atvevo').append(chosenMunka.atvevo);
				$('#page-4 .dij').append(chosenMunka.dij);
				$('#page-4 .mod').append(chosenMunka.mod);
				
				tavKm = distance(chosenMunka.cim.honnan.location.lat, chosenMunka.cim.honnan.location.lng, currentLat, currentLng);
				console.log('Tavolsag: '+tavKm.toFixed(2));
				$('#page-4 #distance').html('');
				$('#page-4 #distance').append(tavKm.toFixed(2));
				
				var sor='';
				for (var i in chosenMunka.log) {
				  sor+='<p>'+ chosenMunka.log[i].creationDate + ': ' + chosenMunka.log[i].desc + '</p>';
				  }
				  $('#page-4 #logentries').append(sor);
				
			});	
		});

		socket.on('all_futarok', function(data){
			futarData = data;
			console.log(futarData);
		});
	},

	socketActions: function(){
		socket.on('ServerMsg', function(data){
			app.updateMessages(data);
		});
	},

	updateMessages: function (data) {
		if(data) {
			messages.push(data);
			var html = '';
			for(var i=0; i<messages.length; i++) {
				html += '<b>' + (messages[i].name ? messages[i].name : 'Server') + ': </b>';
				html += messages[i].text + '<br />';
			}
			$('#messages').html(html);
		} else {
			console.log("There is a problem:", data);
		}
	}
};
	

$(document).ready(function () {	
	console.log('Looking for current position');
	gpsCheck();
	console.log('Looking for current data carrier');
	dataCheck();
	
	window.App = app.init();
});