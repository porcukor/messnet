jQuery(function($){
	"use strict";
  var munkaData, futarData, logData;  
  var ma = new Date();
  var hoeleje = new Date();
  var dd = ma.getDate();
  var mm = ma.getMonth()+1; // Januar a 0.ik
  var yyyy = ma.getFullYear();
  if(dd<10){dd='0'+dd}
  if(mm<10){mm='0'+mm}
  hoeleje = yyyy+'-'+mm+'-01';
  ma = yyyy+'-'+mm+'-'+dd;
  $('#filter-date-begin').val(hoeleje);
  $('#filter-date-end').val(ma);
  
  var honnan_zip = $( "#honnan_zip" ),
      honnan_varos = $( "#honnan_varos" ),
      honnan_utca = $( "#honnan_utca" ),
      honnan_egyeb = $( "#honnan_egyeb" ),

      hova_zip = $( "#hova_zip" ),
      hova_varos = $( "#hova_varos" ),
      hova_utca = $( "#hova_utca" ),
      hova_egyeb = $( "#hova_egyeb" ),
      
  allFields = $( [] )
  .add( honnan_zip ).add( honnan_varos ).add( honnan_utca ).add( honnan_egyeb )
  .add( hova_zip ).add( hova_varos ).add( hova_utca ).add( hova_egyeb );
  var dataValid = false;
  var munkaId;
  


  function sorWelder(data)  {
      var sor='';
      console.log(data);
      var j = 0,
      ido_fel = null,
      ido_le = null;
	  //var ido_be = new Date(data.log[0].ido).toLocaleTimeString('hu-HU'); // TODO: Talan hianyzik egy validalas, mi van ha az elso log event nem a beerkezest tarolja?
	  var ido_be = data.log[0].creationDate;
	
	while (data.log[j]) {
		if (data.log[j].tipus=='fel') {
		ido_fel = data.log[j].ido;
		}
		if (data.log[j].tipus=='le') {
		ido_le = data.log[j].ido;
		}
		j++;
	}

	sor+='<tr id="'+data._id+'"><td>'+ido_be+'</td><td>';
	if (ido_fel==null) { sor+= 'Várakozik';}
	else {
		if (ido_le==null) { sor+= 'Felvéve';}
	else if (ido_le!=null) { sor+= 'Leadva';}
	}
	sor+='</td>';
	sor+='<td>'+data.cim.honnan.zip+'</td><td>'+data.cim.honnan.utca+'</td><td>'+data.cim.honnan.info+'</td>';
	sor+='<td>'+data.cim.hova.zip+'</td><td>'+data.cim.hova.utca+'</td><td>'+data.cim.hova.info+'</td><td>';
	
	switch (data.tipus.eszkoz) {
	case 1:
		sor+='Biciklis';
		break;
	case 2:
		sor+='Autós';
		break;
	case 3:
		sor+='Teherbringás';
		break;
	default:
		sor+='ERROR';
		
	}
	
	sor+='</td><td>'+data.tipus.extrak.tulmeret+'</td><td>'+data.tipus.extrak.surgos+'</td><td>'+data.tipus.extrak.esti+'</td>';
	//TODO Atterni checkboxokra
	
	sor+='<td>'+data.megrendelo+'</td><td>'+data.atvevo+'</td>';
	sor+='<td><div class="kontroll"><button data-munkaid="'+data._id+'" class="modify"><img src="images/modify.png"></button><button data-munkaid="'+data._id+'" class="destroy"><img src="images/erase.png"></button></div></td></tr>';
    return sor;
	}


/* $('#honnan_zip').bind('change focusout', function () {
    var iranyitoszam = $(this).val();
  
   // EZT HAGYJUK INKABB
   
/*
  $.ajax({
  type: "GET",
  url: "http://www.hermesexpress.hu/zipapi/index.php",
  data: {zip: iranyitoszam},
  dataType : 'jsonp',
  jsonp: 'callback',
  jsonpCallback: myCallback = function(data) {
        console.log(data);
        alert(data);
    },
  contentType: 'text/html',
      success: function (data) {
      alert(data);
    }
});/*

  /* Google alapú
var geocoder = new google.maps.Geocoder();
	var latlng = new google.maps.LatLng(47.488369,19.105486); 
  var circleOptions = { // K�r param�terei
		center: latlng,
		fillColor: '#333333',
		opacity: 0.3,
		radius: 15000
	}

	var circle = new google.maps.Circle(circleOptions); // Kor definialasa
	var hatar = circle.getBounds();


  var $this = $(this);
    if ($this.val().length == 4) {
        geocoder.geocode({ 'address': $this.val(), 'bounds': hatar, 'region' : 'hu' }, function (result, status) {
            var city = '';
            console.log(result);
            //start loop to get state from zip
            for (var component in result[0]['address_components']) {
                for (var i in result[0]['address_components'][component]['types']) {
                    if (result[0]['address_components'][component]['types'][i] == "administrative_area_level_2") {
                        //state = result[0]['address_components'][component]['short_name'];
                        // do stuff with the state here!
                        // get city name
                        city = result[0]['address_components'][component]['long_name'];
                        // Insert city name into some input box
                        $('#honnan_varos').val(city);
                    }
                }
            }
        });
    } 
}); 
*/

  var surgos, tulmeret, esti;
  $( "#popup-munka" ).dialog({
      autoOpen: false,
      height: 450,
      width: 850,
      modal: true,
      buttons: {
        "Mentés": function() {
          dataValid = true; // FIXME : Validitásvizsgálat hiányzik
          allFields.removeClass( "ui-state-error" );
          
          if($('#surgos').prop('checked')) {
          surgos =  true ;
          } else {
          surgos = false;
          }
          
          if($('#tulmeret').prop('checked')) {
          tulmeret =  true ;
          } else {
          tulmeret = false;
          }

          if($('#esti').prop('checked')) {
          esti =  true ;
          } else {
          esti = false;
          }
          
      var ujmunka = {
		honnan_zip: $( "#honnan_zip" ).val(),
		honnan_varos : $( "#honnan_varos" ).val(),
		honnan_utca : $( "#honnan_utca" ).val(),
		honnan_info : $( "#honnan_info" ).val(),
		hova_zip : $( "#hova_zip" ).val(),
		hova_varos : $( "#hova_varos" ).val(),
		hova_utca : $( "#hova_utca" ).val(),
		hova_info : $( "#hova_info" ).val(),
		eszkoz : $( "#tipus" ).val(),
		tulmeret : tulmeret,
		surgos : surgos,
		esti : esti,
		megrendelo: $( "#megrendelo" ).val(),
        atvevo: $( "#atvevo" ).val(),
		dij: $("#dij").val(),
		futar: $("#futar").val(), // FIXME: Legordulo
		status: $("#status").val()
		};

          // FIXME: A mezőkben lévő adatokat küldjük el egy emittel
          // Rejtett ID mezőben lévőt is.
          // Ha a szerver kap ID-t az adathalmazza, akkor updatelje a megfelelő sort
          // Ha az ID üres, akkor hozzon létre egyet
          if ( dataValid ) {

          if ($(" #munka_id ").val() != '') {
          console.log('munkaid nemnull');
            munkaId  = $(" #munka_id ").val();
            ujmunka.id = munkaId;
            console.log(ujmunka);
            app.edit(ujmunka); // Editálás
          }
          else {
          console.log('munkaid null');
            app.persist(ujmunka); // Hozzáadás
          }
          
          $( this ).dialog( "close" );
          }
        },
        Cancel: function() {
          $( this ).dialog( "close" );
        }
      },
      close: function() {
        allFields.val( "" ).removeClass( "ui-state-error" );
      }
    });
  
  var newLine='';
  var updatedLine='';
  var server_hostname=window.location.hostname;
  var server_address = 'http://' + server_hostname + ':3456';

  
/*
	// Socket.io 1.0
    var socket = io(server_address);
  socket.on('connect', function(){
     socket.on('connect_failed', function () {alert('A');})
    //socket.on('disconnect', function(){});
  });
  
  */
  
 var socket = io.connect(server_address);
 
  var messages = [];
	var app = {
		init: function(){
			this.list();
			this.actions();
			this.socketActions();
		},
    
		persist: function(new_munka){
			socket.emit('add', new_munka);
		},

		edit: function(edit_munka){
			socket.emit('edit', edit_munka);
		},

		destroy: function(munka_id){
			socket.emit('delete', { id:munka_id });
		},
    
    filter:  function(data){
      socket.emit('filter', { start:data.start, end: data.end, keyword:data.keyword});
      console.log('SZURESI CUCC:' + data);
		},

		changeStatus: function(munka_id, munka_status){
			socket.emit('changestatus', { id: munka_id, status: munka_status });
		},

		allChangeStatus: function(master_status){
			socket.emit('allchangestatus', { status: master_status });
		},
    
		SendClientMsg: function(message) {
			socket.emit('ClientMsg', { text: message, id: socket.socket.sessionid});
		},
		
		SendClientPreparedMsg: function(message) {
			socket.emit('PreparedMsg', { number: message, id: socket.socket.sessionid});
		},
		
    
		actions: function(){

		// Chat events
			$('#chat-input-button').click(function() {
				var message=$('#chat-input-field').val();
				app.SendClientMsg(message);
				$('#chat-input-field').val('');
			});
      
			$('#chat-input-field').keypress(function(event) {
				if (event.which == 13) {
				  var message=$('#chat-input-field').val();
				  app.SendClientMsg(message);
				  $('#chat-input-field').val('');
				}
			});
			
			$('#msg1').click(function() {
				app.SendClientMsg('Defektem van!');
			});
			
			$('#msg2').click(function() {
				app.SendClientMsg('Várni kell!');
			});
			
			$('#msg3').click(function() {
				app.SendClientMsg('Itt vagyok!');
			});
			
			
		// Button events
      
			$('button.addMunkaButton').live('click',function() {
				var futarListaElem, i;
				
				// Mezők nullázása
				$( "#honnan_zip" ).val('');
				$( "#honnan_varos" ).val('');
				$( "#honnan_utca" ).val('');
				$( "#honnan_info" ).val('');
				$( "#hova_zip" ).val('');
				$( "#hova_varos" ).val('');
				$( "#hova_utca" ).val('');
				$( "#hova_info" ).val('');
				
				$( "#megrendelo" ).val('');
				$( "#atvevo" ).val('');
				$( "#dij" ).val('');
				$("#popup-munka #futar").children().remove();
				for (i in futarData) {
					futarListaElem = '<option value="'+futarData[i].nev+'">'+ futarData[i].nev+'</option>';
					$("#popup-munka #futar").append(futarListaElem);
				}
				
				$("#popup-munka").dialog( "open" );
				$("#popup-munka").dialog('option', 'title', 'Új munka felvétele');
				$(" #munka_id ").val(null);
				$("#popup-munka #atvevo").attr('disabled', true);
				$("#popup-munka fieldset#log").hide();
				$("#popup-munka #tipus").val(1).attr('selected', true);
				$("#popup-munka #status").val(0).attr('selected', true);
				$("#popup-munka #status").attr('disabled', true);
				
				// FIXME: Extra pipak resete hianyzik
				
				
			});      
      
			$('button.destroy').live('click',function(e) {
				e.preventDefault();
				var answer = confirm('Biztosan törlöd?');
				if (answer) {
				  app.destroy($(this).attr('data-munkaid'));
				}
			});
			
			var munkaId, chosenMunka;
			$('button.modify').live('click',function(e) {
			chosenMunka={};	
			logListaElem='';
				$("#popup-munka").dialog('option', 'title', 'Munka módosítása');
				// FIXME : Pakoljuk bele az adatokat az adott sorból
				// Tegyünk bele egy ID-t is valahova egy rejtett mezőbe
				var futarListaElem, i, currentStatus;
				munkaId = e.currentTarget.dataset.munkaid;
				for (var i in munkaData) {
				  if (munkaData[i]._id == munkaId) {
					chosenMunka = munkaData[i];
				  }
				}
				$( "#munka_id" ).val(munkaId);
				$( "#honnan_zip" ).val(chosenMunka.cim.honnan.zip);
				$( "#honnan_varos" ).val(chosenMunka.cim.honnan.varos);
				$( "#honnan_utca" ).val(chosenMunka.cim.honnan.utca);
				$( "#honnan_info" ).val(chosenMunka.cim.honnan.info);
				$( "#hova_zip" ).val(chosenMunka.cim.hova.zip);
				$( "#hova_varos" ).val(chosenMunka.cim.hova.varos);
				$( "#hova_utca" ).val(chosenMunka.cim.hova.utca);
				$( "#hova_info" ).val(chosenMunka.cim.hova.info);
				
				$( 'select#tipus' ).val(chosenMunka.tipus.eszkoz).attr('selected', true);
				
				$( "#popup-munka #status" ).attr('disabled', false);
				$( "#megrendelo" ).val(chosenMunka.megrendelo);
				$( "#atvevo" ).val(chosenMunka.atvevo);
				$( "#dij" ).val(chosenMunka.dij);
				if (chosenMunka.tipus.extrak.tulmeret === true) $('#tulmeret').prop('checked', true);
				if (chosenMunka.tipus.extrak.surgos === true) $('#surgos').prop('checked', true);
				if (chosenMunka.tipus.extrak.esti === true) $('#esti').prop('checked', true);
				
				currentStatus = chosenMunka.status;
				
				$('select#status').val(currentStatus).attr('selected', true);
				
				$("#popup-munka #futar").children().remove();
				for (i in futarData) {
					futarListaElem = '<option value="'+futarData[i].nev+'">'+ futarData[i].nev+'</option>';
					$("#popup-munka #futar").append(futarListaElem).val(chosenMunka.futar);
				}
				//console.log(chosenMunka.log);
				$("#popup-munka fieldset#log table tbody").html('');
				for (i in chosenMunka.log) {
					console.log(chosenMunka.log[i]._id);
					var time = chosenMunka.log[i].creationDate,
					actor = chosenMunka.log[i].creator,
					tipus = chosenMunka.log[i].tipus,
					event = chosenMunka.log[i].event,
					desc = chosenMunka.log[i].desc,
					logListaElem = '<tr><td>'+time+'</td><td>' + actor + '</td><td>' + tipus + '</td><td>' + event + '</td><td>' + desc + '</td></tr>';
					
					$("#popup-munka fieldset#log table tbody").append(logListaElem).val(chosenMunka.futar);

				}
				
				// li-k feltoltese;
				
				console.log(chosenMunka);
				$("#popup-munka").dialog( "open" );
				$("#popup-munka #atvevo").disabled = false;
				$("#popup-munka fieldset#log").show();
			});
      
      $('button#filter').live('click',function(e) {
        e.preventDefault();
        var datumStart = $('#filter-date-begin').val();
        var datumEnd = $('#filter-date-end').val();
		var searchText = $('#kereses #search').val();
        var filterParams = {start: datumStart, end: datumEnd, keyword: searchText};
        app.filter(filterParams);


      });
		},

		socketActions: function(){
			socket.on('count', function (data) {
			$('footer #footer').html(data.count+' users online.');
			});

			socket.on('added', function(data){
			console.log('Added' + data);
			app.addToList(data);
			munkaData.push(data);
			});

			socket.on('deleted', function(data){
			app.destroyOnMunkaList(data.id);
			});

			socket.on('statuschanged', function(data){
			app.markOnMunkaList(data.id, data.status);
			});

			socket.on('edited', function(data){
			console.log('Edited' + data);
			app.updateList(data); // Frissitjuk a listat a kliens nezetben

			for (var i in munkaData) { // Frissitjuk a munkaData ojjektum adott tagjat
			  if (munkaData[i]._id == munkaId) {
				munkaData[i] = data;
			  }
			}
			});

			socket.on('allstatuschanged', function(data){
			app.markAllOnMunkaList(data.status);
			});

			socket.on('ServerMsg', function(data){
			app.updateMessages(data);
			});
		},

		list: function(){
			socket.on('ListAllMunka', function(data){
				munkaData = data;
				console.log(munkaData);
			
				$('#munka-list').html('');
				$('#munka-list').append('<thead><tr class="huge"><td colspan=2>Idő</td><td colspan=3>Honnan</td><td colspan=3>Hova</td><td colspan=4>Típus</td><td colspan=2></td><td>Műv</td></tr><tr><td>Beérkezett</td><td>Státusz</td><td>Zip</td><td>Utca</td><td>Egyéb</td><td>Zip</td><td>Utca</td><td>Egyéb</td><td>Eszköz</td><td>Túlméret</td><td>Sürgős</td><td>Esti</td><td>Megrendelő</td><td>Átvevő</td><td></td></tr></thead>');
				$('#munka-list').append('<tr><td colspan=6><a href="#"><button class="addMunkaButton">Új munka<img src="images/add.png"></button></a></td><td colspan=9>Keresés: <input type=text id=search></td></tr></thead>');
				
				for(var i = 0; i< data.length; i++){
					newLine = sorWelder(data[i]);
					$('#munka-list').append(newLine);
				}
			});
      
			socket.on('all_futarok', function(data){
				futarData = data;
      //console.log(futarData);
			});
      
		},
		
		addToList: function(data){
			newLine = sorWelder(data);
			$('#munka-list').append(newLine);
		},
		
		updateList: function(data){
		  updatedLine = sorWelder(data);
		  $('tr#'+data._id).replaceWith(updatedLine);
		  console.log('UPDATELTEM. Jo lett?');
		},
    
		destroyOnMunkaList: function(munka_id){
			$('tr#'+munka_id).remove();
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

	window.App = app.init();
});
