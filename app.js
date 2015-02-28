/**
 * Module dependencies.
 */
var SITE_SECRET = 'Blablabla';

var express = require('express'),
//    routes = require('./routes'),
    dateFormat = require('dateformat'),
	http = require('http'),
    path = require('path'),
    mongoose = require('mongoose'),
    gm = require('googlemaps'), // Maps api
    db = mongoose.connect('mongodb://localhost/manipulator2'),
    io = require('socket.io'),
    hash = require('./pass').hash, // User auth
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId,
    Munka = require('./models/munka.js').init(Schema, mongoose),
	Futar = require('./models/futar.js').init(Schema, mongoose),
    User = require('./models/user.js').init(Schema, mongoose),
	distance = require('google-distance'),
	connect = require('connect'); // Session handling
	
var app = express();

var cookieParser = express.cookieParser(SITE_SECRET)
  , sessionStore = new connect.middleware.session.MemoryStore();
  
  mongoose.set('debug', true);
  
// all environments
app.set('port', process.env.PORT || 3456);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(cookieParser);
app.use(express.session({ store: sessionStore }));
app.use(express.methodOverride());
app.use(app.router);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public/mobil')));

var server = http.createServer(app)
  , io = require('socket.io').listen(server);

var SessionSockets = require('session.socket.io')
  , sessionSockets = new SessionSockets(io, sessionStore, cookieParser);

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// ido -> objectid
function objectIdWithTimestamp(timestamp)
{
    if (typeof(timestamp) == 'string') {
        timestamp = new Date(timestamp);
    }
    var hexSeconds = Math.floor(timestamp/1000).toString(16);
    var constructedObjectId = mongoose.Types.ObjectId(hexSeconds + "0000000000000000");
    return constructedObjectId
}

// Authentikacios resz

function authenticate(name, pass, fn) {
    if (!module.parent) console.log('auth: %s:%s', name, pass);

    User.findOne({
        username: name
    },


    function (err, user) {
        if (user) {
            if (err) return fn(new Error('nem találom a usert'));
            hash(pass, user.salt, function (err, hash) {
                if (err) return fn(err);
                if (hash == user.hash) return fn(null, user);
                fn(new Error('rossz jelszó'));
            });
        } else {
            return fn(new Error('nem találom a usert'));
        }
    });
}


function userExist(req, res, next) {
    User.count({
        username: req.body.username
    }, function (err, count) {
        if (count === 0) {
            next();
        } else {
            req.session.error = "Már van ilyen felhasználó"
            res.redirect("/signup");
        }
    });
}

var loggedInUser;
app.get("/", function (req, res) {
    if (req.session.user) {
		loggedInUser = req.session.user.username;
		console.log('-- USER logged in: ' + loggedInUser)
		
		User.findOne({
			username: loggedInUser
		},

		function (err, user) {
			if (user) {
				if (err) return console.log('Mégsem találom a usert, pedig auth alatt meg megvolt.. :? - ' + err);
				if (user.type=="mobile") {
					res.redirect('/mobil');
				}
				else {
					res.render('index', {title: 'Futár Manipulátor', loggedInUser: loggedInUser});
					//res.cookie('username', loggedInUser);
				}
			} else {
				return console.log('Mégsem találom a usert, pedig auth alatt meg megvolt.. :? - ');
			}
		});
    } else {
            res.redirect('/login');
    }
});

app.get("/signup", function (req, res) {
    if (req.session.user) {
        res.redirect("/");
    } else {
        res.render("signup");
    }
});

app.post("/signup", userExist, function (req, res) {
    var password = req.body.password;
    var username = req.body.username;

    hash(password, function (err, salt, hash) {
        if (err) throw err;
        var user = new User({
            username: username,
            salt: salt,
            hash: hash,
        }).save(function (err, newUser) {
            if (err) throw err;
            authenticate(newUser.username, password, function(err, user){
                if(user){
                    req.session.regenerate(function(){
                        req.session.user = user;
                        req.session.success = 'Bejelentkezve, mint ' + session.user.username + ' klikk a <a href="/logout">logouthoz</a>!';
                        res.redirect('/');
                    });
                }
            });
        });
    });
});

app.get("/login", function (req, res) {
    res.render("login", {title: 'Bejelentkezés'});
});

app.post("/login", function (req, res) {
    authenticate(req.body.username, req.body.password, function (err, user) {
        if (user) {
            req.session.regenerate(function () {
			
                req.session.user = user;
//                req.session.success = 'Bejelentkezve, mint ' + user.username + ' klikk a <a href="/logout">logouthoz</a>!';
                res.redirect('/');
            });
        } else {
            req.session.error = 'Rossz felhasználónév vagy jelszó';
            res.redirect('/login');
        }
    });
});

app.get('/logout', function (req, res) {
    req.session.destroy(function () {
        res.redirect('/');
    });
});

var clientsNumber = 0;
var clients = [];
var cookie= require('cookie');

sessionSockets.on('connection', function (err, socket, session) { // Kliens becsatlakozas
var hs = socket.handshake;
var address = hs.address;
//	clients[socket.id] = socket.id;
	console.log('handshake: %j',socket.handshake); // BRUTAL RAW DEBUG
//	console.log('SESSID: %j', socket.handshake.headers.cookie);
//	console.log('store: %j',sessionStore);
//	console.log('Socket connection with sessionID: '+hs.sessionID);
//	console.log('session: %j',session); // DEBUG

if (session) {
	if (session.user==undefined) {
		session.user={};
		session.user.username='Anonymous';
	}
	console.log(objectIdWithTimestamp("2014-04-01"));		
	clientsNumber++;
	socket.emit('ConnectAct', {count: clientsNumber, id: socket.id, ip: address.address, name: session.user.username}); // Kuldjuk csak neki
	socket.broadcast.emit('ConnectAct', {count: clientsNumber, id: socket.id, ip: address.address, name: session.user.username}); // Kuldjuk mindenki masnak
	console.log('-- Client connected: ' +  session.user.username + ' | socketId: '+ socket.id + ' | Connection count:' + clientsNumber + ' --');    
  
	// Csatlakozas utan megkapja az osszes munkat  
	Munka.find({log : {$elemMatch : {event: 'created'}}}, function(err, munkak){
		socket.emit('ListAllMunka', munkak);
    });
	
	// Elkuldjuk az aktiv futarok listajat is
	Futar.find({}, function(err, futarok){
		socket.emit('all_futarok', futarok);
	});
	
	// Uzenetkuldo fuggvenyek
	socket.on('ClientMsg', function(msg) { // Ha jon az uzenet
		console.log('--- ClientMsg --- ' + msg.id + ': '+ msg.text); // Debug a helyi konzolra
		io.sockets.emit('ServerMsg', {id: msg.id, text: msg.text, name: session.user.username} ); // Elkuldjuk mindenkinek
	});

    // Hozzaadas
	socket.on('add', function(data) {	
		var ujmunka = new Munka({
			cim : {
				honnan : {
					varos : data.honnan_varos,
					zip : data.honnan_zip,
					utca : data.honnan_utca,
					info : data.honnan_info,
					location: {
						lat: '',
						lng: ''
					}
				},
				hova : {
					varos : data.hova_varos,
					zip : data.hova_zip,
					utca : data.hova_utca,
					info : data.hova_info,
					location: {
						lat: '',
						lng: ''
					}
				}
			},     
			megrendelo: data.megrendelo,
			tipus: {
				eszkoz : data.eszkoz,
				extrak : {
					tulmeret : data.tulmeret,
					surgos : data.surgos,
					esti : data.esti
				}
			},
			log : [{
				tipus : "order",
				event: "created",
				desc : "telefon",
				ido : new Date(),
				creator : session.user.username
			}],
			futar: data.futar,
			dij: data.dij
		});
			
		var completeAddressHonnan = ujmunka.cim.honnan.zip + ' , ' +  ujmunka.cim.honnan.varos + ' , '+  ujmunka.cim.honnan.utca;
		var completeAddressHova = ujmunka.cim.hova.zip + ' , ' +  ujmunka.cim.hova.varos + ' , '+  ujmunka.cim.hova.utca;
		console.log('-- Location request: %j', completeAddressHonnan);
		gm.geocode(completeAddressHonnan, function(err, result){
			ujmunka.cim.honnan.location.lat = result.results[0].geometry.location.lat;
			ujmunka.cim.honnan.location.lng = result.results[0].geometry.location.lng;
			console.log('-- Geocoding result: ' + ujmunka.cim.honnan.location.lat + ', ' + ujmunka.cim.honnan.location.lng);
			
			console.log('-- Location request: %j', completeAddressHova);
			gm.geocode(completeAddressHova, function(err, result){
				ujmunka.cim.hova.location.lat = result.results[0].geometry.location.lat;
				ujmunka.cim.hova.location.lng = result.results[0].geometry.location.lng;
				console.log('-- Geocoding result: ' + ujmunka.cim.hova.location.lat + ', ' + ujmunka.cim.hova.location.lng);
			
			console.log('-- Distance matrix request: '+ completeAddressHonnan + ' -> '+ completeAddressHova);
			distance.get({
				index: 1,
				mode: 'driving',
				origin: ujmunka.cim.honnan.location.lat+','+ujmunka.cim.honnan.location.lng,
				destination: ujmunka.cim.hova.location.lat+','+ujmunka.cim.hova.location.lng
				},
				function(err, data) {
					if (err) return console.log(err);
					console.log('-- Distance matrix result: %j', data.distance);
					ujmunka.tav = data.distance;
					// console.log('Ujmunka: %j', ujmunka); // BRUTAL RAW DEBUG
					ujmunka.save(function(err){
						if(err) throw err;
						io.sockets.emit('added', ujmunka); // Spagetti blokk vege
					});
				});
			});
		});
	});


	
  // Modositas
   socket.on('edit', function(data){
     Munka.findById(data.id, function(err, munka){
     console.log('Ujmunka data: %j', data); // DEBUG
     console.log('Regimunka munka: %j', munka); // DEBUG
     
		// WARNING : Ipari ganyolas! Egyenkent megnezzuk ugyanaz-e az erteke, ha es nem, akkor stringbe rogzitjuk, hogy valtozott
		var editlogDesc='';
		
		if (munka.cim.honnan.zip != data.honnan_zip)
			{
			editlogDesc += 'Honnanzip: ' + munka.cim.honnan.zip + "->" + data.honnan_zip + "| ";
			munka.cim.honnan.zip = data.honnan_zip;
			}
			
        
		if (munka.cim.honnan.varos != data.honnan_varos)
			{
			editlogDesc += 'Honnanvaros: ' + munka.cim.honnan.varos + "->" + data.honnan_varos + "| ";
			munka.cim.honnan.varos = data.honnan_varos;
			}
		
        if (munka.cim.honnan.utca != data.honnan_utca)
			{
			editlogDesc += 'Honnanutca: ' + munka.cim.honnan.utca + "->" + data.honnan_utca + "| ";
			munka.cim.honnan.utca = data.honnan_utca;
			}
			
			
        if (munka.cim.honnan.info != data.honnan_info)
			{
			editlogDesc += 'Honnaninfo: ' + munka.cim.honnan.info + "->" + data.honnan_info + "| ";
			munka.cim.honnan.info = data.honnan_info;
			}
			
        
        if (munka.cim.hova.zip != data.hova_zip)
			{
			editlogDesc += 'Hovazip: ' + munka.cim.hova.zip + "->" + data.hova_zip + "| ";
			munka.cim.hova.zip = data.hova_zip;
			}
			
        
		if (munka.cim.hova.varos != data.hova_varos)
			{
			editlogDesc += 'Hovavaros: ' + munka.cim.hova.varos + "->" + data.hova_varos + "| ";
			munka.cim.hova.varos = data.hova_varos;
			}
		
        if (munka.cim.hova.utca != data.hova_utca)
			{
			editlogDesc += 'Hovautca: ' + munka.cim.hova.utca + "->" + data.hova_utca + "| ";
			munka.cim.hova.utca = data.hova_utca;
			}
			
			
        if (munka.cim.hova.info != data.hova_info)
			{
			editlogDesc += 'Hovainfo: ' + munka.cim.hova.info + "->" + data.hova_info + "| ";
			munka.cim.hova.info = data.hova_info;
			}
        
        if (munka.megrendelo != data.megrendelo)
			{
			editlogDesc += 'Megrendelo: ' + munka.megrendelo + "->" + data.megrendelo + "| ";
			munka.megrendelo = data.megrendelo;
			}
			
        if (munka.atvevo != data.atvevo)
			{
			editlogDesc += 'Atvevo: ' + munka.atvevo + "->" + data.atvevo + "| ";
			munka.atvevo = data.atvevo;
			}
			
		if (munka.dij != data.dij)
			{
			editlogDesc += 'Dij: ' + munka.dij + "->" + data.dij + "| ";
			munka.dij = data.dij;
			}

        if (munka.tipus.eszkoz != data.eszkoz)
			{
			editlogDesc += 'Eszkoz: ' + munka.tipus.eszkoz + "->" + data.eszkoz + "| ";
			munka.tipus.eszkoz = data.eszkoz;
			}
		
		if (munka.tipus.extrak.tulmeret != data.tulmeret)
			{
			editlogDesc += 'Tulmeret: ' + munka.tipus.extrak.tulmeret + "->" + data.tulmeret + "| ";
			munka.tipus.extrak.tulmeret = data.ttulmeret;
			}		
			
		if (munka.tipus.extrak.surgos != data.surgos)
			{
			editlogDesc += 'Surgos: ' + munka.tipus.extrak.surgos + "->" + data.surgos + "| ";
			munka.tipus.extrak.surgos = data.surgos;
			}		
		
		if (munka.tipus.extrak.esti != data.esti)
			{
			editlogDesc += 'Esti: ' + munka.tipus.extrak.esti + "->" + data.esti + "| ";
			munka.tipus.extrak.esti = data.esti;
			}
			
		if (munka.status != data.status)
			{
			editlogDesc += 'Statusz: ' + munka.status + "->" + data.status + "| ";
			munka.status = data.status;
			}
        
        var logEntry = {
              tipus: 'order',
			  event: 'modify',
              desc : editlogDesc,
              creator : session.user.username
        };
        munka.log.push(logEntry);
	
      console.log('Ujmunka atalakitva: %j', munka); // DEBUG
	  console.log('Modositas: %j', editlogDesc);
        
        munka.save(function(err){
          if(err) throw err;
          socket.emit('edited', munka);
          io.sockets.emit('edited', munka);
        });
      });
  });
   
// Status váltások
	socket.on('accept', function(data){
	 Munka.findById(data.id, function(err, munka){
	 console.log('Ujmunka data: %j', data); // DEBUG
	 console.log('Regimunka munka: %j', munka); // DEBUG
	 munka.cim.status = 2;

		var logEntry = {
			  tipus: 'task',
			  event: 'accept',
			  desc : {lat: data.lat, lng: data.lng},
			  creator : session.user.username
		};
		munka.log.push(logEntry);

	  console.log('Munka statusa: 1 -> 2 %j', munka);
		
		munka.save(function(err){
		  if(err) throw err;
		  socket.emit('edited', munka);
		  io.sockets.emit('edited', munka);
		});
	  });
	});

	socket.on('pickup', function(data){
	 Munka.findById(data.id, function(err, munka){
	 console.log('Ujmunka data: %j', data); // DEBUG
	 console.log('Regimunka munka: %j', munka); // DEBUG
	 munka.cim.status = 3;

		var logEntry = {
			  tipus: 'task',
			  event: 'pickup',
			  desc : {lat: data.lat, lng: data.lng},
			  creator : session.user.username
		};
		munka.log.push(logEntry);

	  console.log('Munka statusa: 2 -> 3 %j', munka);
		
		munka.save(function(err){
		  if(err) throw err;
		  socket.emit('edited', munka);
		  io.sockets.emit('edited', munka);
		});
	  });
	});

	socket.on('refuse', function(data){
	 Munka.findById(data.id, function(err, munka){
	 console.log('Ujmunka data: %j', data); // DEBUG
	 console.log('Regimunka munka: %j', munka); // DEBUG
	 munka.cim.status = 0;

		var logEntry = {
			  tipus: 'task',
			  event: 'refuse',
			  desc : {lat: data.lat, lng: data.lng},
			  creator : session.user.username
		};
		munka.log.push(logEntry);

	  console.log('Munka statusa: 2 -> 0 %j', munka);
		
		munka.save(function(err){
		  if(err) throw err;
		  socket.emit('edited', munka);
		  io.sockets.emit('edited', munka);
		});
	  });
	});
   
	socket.on('delivered', function(data){
	 Munka.findById(data.id, function(err, munka){
	 console.log('Ujmunka data: %j', data); // DEBUG
	 console.log('Regimunka munka: %j', munka); // DEBUG
	 munka.cim.status = 0;

		var logEntry = {
			  tipus: 'task',
			  event: 'delivered',
			  desc : {lat: data.lat, lng: data.lng},
			  creator : session.user.username
		};
		munka.log.push(logEntry);

	  console.log('Munka statusa: 2 -> 0 %j', munka);
		
		munka.save(function(err){
		  if(err) throw err;
		  socket.emit('edited', munka);
		  io.sockets.emit('edited', munka);
		});
	  });
	});
   
   socket.on('wait_start', function(data){
	 Munka.findById(data.id, function(err, munka){
	 console.log('Ujmunka data: %j', data); // DEBUG
	 console.log('Regimunka munka: %j', munka); // DEBUG
	 
	 if (munka.cim.status == 2) {
		munka.cim.status = 3; // Ha epp fel kellett venni, akkor mostantol felvetelre var
		editlogDesc = "Munka statusa: 2 -> 3";
		}
		
	 if (munka.cim.status == 4) {
		munka.cim.status = 5; // Ha epp le kellett adni, akkor mostantol leadasra var
		editlogDesc = "Munka statusa: 4 -> 5";
		}
		
		var logEntry = {
			  tipus: 'task',
			  event: 'delivered',
			  desc : {lat: data.lat, lng: data.lng},
			  creator : session.user.username
		};
		munka.log.push(logEntry);

	  console.log(editlogDesc + ' %j', munka);
		
		munka.save(function(err){
		  if(err) throw err;
		  socket.emit('edited', munka);
		  io.sockets.emit('edited', munka);
		});
	  });
	});
   
   
   
   
  socket.on('filter', function(data) {
  console.log('data.start: %j', data.start); // DEBUG
  filterDateBegin = new Date(data.start);
  filterDateEnd = new Date(data.end);
  filterDateEnd.setDate(filterDateEnd.getDate()+1); // +1 nap, mert kulonben aznap reggel 00:00-ra allna be
  console.log('startdate->id: ' + objectIdWithTimestamp(data.start));
  Munka.find({
	log : {
		$elemMatch : {
			_id: {
				$gte: objectIdWithTimestamp(data.start),
				$lte: objectIdWithTimestamp(data.end)
			}
		}
	}},
	function(err, munkak){
		socket.emit('ListAllMunka', munkak);
    });
	
//    Munka.find({log : {$elemMatch : {desc: 'created', ido: {$gte: filterDateBegin, $lte: filterDateEnd} }}}, function(err, munkak){
    
  });
  
  socket.on('filter_futar', function(data) {
    Munka.find({log : {$elemMatch : {desc: 'created'}}}, function(err, munkak){
      socket.emit('ListAllMunka', munkak);
    });
    
  });
  // Kereses
  socket.on('search', function(data) {
  });
  
  // Torles
  socket.on('delete', function(data) {
  console.log('-- Delete -- | %j', data);
  Munka.find({ _id: data.id }).remove(function(err){
      if(err) throw err;
      io.sockets.emit('deleted', data);
    });
  });
  
	socket.on('disconnect', function() {
		clientsNumber--;
	console.log('-- Client disconnected | Connection count:' + clientsNumber + ' --');
		socket.emit('DisconnectAct', {count: clientsNumber, id: socket.id, ip: address.address});
		socket.broadcast.emit('DisconnectAct', {count: clientsNumber, id: socket.id, ip: address.address});
	});
	  }
});

server.listen(3456);