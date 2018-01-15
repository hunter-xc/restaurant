var http = require('http');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
//var ExifImage = require('exif').ExifImage;
var ObjectId = require('mongodb').ObjectID;
var mongourl = 'mongodb://user2:password@ds137054.mlab.com:37054/my_database';
var fileUpload = require('express-fileupload');
var express = require('express');
var session = require('cookie-session');
var bodyParser = require('body-parser');
var app = express();


app.listen(process.env.PORT || 8099);


app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(express.static(__dirname +  '/public'));
app.use(fileUpload());




var users = new Array(
	{name: 'demo', password: ''},
	{name: 'user1', password: 'password'},
	{name: 'user2', password: 'password'}
);



app.use(session({
  name: 'session',
  keys: ['ouhk', 'comps381f']
}));


app.get("/", function(req,res) {
	res.status(200);
	if (req.session.authenticated)
		res.redirect('/read');
	else 
		res.render('login.ejs');
});


app.post("/login", function(req, res) {  
	// attribute name inside login.ejs should be the same as database, or it can not match
	console.log(req.body);
	
	var criteria = {};
	criteria['username'] = req.body.username;
	criteria['password'] = req.body.password;
	
	/*
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err,null);   
		console.log('Connected to MongoDB\n');
	
		db.collection('users').find(criteria, function(err, result) {  
			assert.equal(err,null); 
			db.close();
			
			req.session.authenticated = true;
			req.session.username = req.body.username;
			res.send('login successfully');
			res.end();	
		});
	});	
	*/
	
	
	
	for (var i=0; i<users.length; i++) {
		if (users[i].name == req.body.username &&
		    users[i].password == req.body.password) {
			req.session.authenticated = true;
			req.session.username = users[i].name;
		}
	}
	
	res.redirect('/');

});

app.get('/logout', function(req, res) {
	req.session = null;
	res.redirect('/');
});

app.get('/register', function(req, res) {
	res.render('register.ejs');
})


app.post('/register', function(req, res) {
	var criteria = {};
	criteria['username'] = req.body.username;
	criteria['password'] = req.body.password;
	
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err,null);   
		console.log('Connected to MongoDB\n');
	

		db.collection('users').insertOne(criteria, function(err, result) {  
			assert.equal(err,null); 
			db.close();
		
			res.send('register successfully!');
			res.end();	

		});
	});	
})

app.get('/add_helper', function(req, res) {
	res.render('add_helper.ejs');
});

app.post('/add_helper', function(req, res) {
	var criteria = {};
	criteria['name'] = req.body.name;
	criteria['post'] = req.body.post;
	criteria['phone'] = req.body.phone;
	criteria['email'] = req.body.email;
	criteria['userid'] = req.session.username;
	
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err, null);
		console.log('Connecte db successfully');
		add_helper(db, criteria, function(result) {
			db.close();
			res.writeHead(200, {'Content-Type': 'text/plain'});
			res.end('\nNew helper was added successfully!');
		});
	});
});

app.get('/read_helper', function(req, res) {
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err, null);
		read_helper(db, {}, function(result) {
			db.close();
			res.render('read_helper.ejs', {result:result});
		});
	});
});

app.get('/add_guest', function(req, res) {
	res.render('add_guest.ejs');
});


app.get('/read', function(req, res) {
	if (!req.session.authenticated)
		res.render('login.ejs');
	else {
		username = req.session.username;
		findRestaurant(res, {}, username);
	}
			
});

app.get('/api/restaurant/read/:c/:x', function(req, res) {
	c = req.params.c;
	x = req.params.x;
	
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err,null);   
		console.log('Connected to MongoDB\n');
		var criteria = {[c] : x};
		db.collection('restaurant').find(criteria).toArray(function(err, result) {  
			assert.equal(err,null); 
			db.close();
			console.log(JSON.stringify(result));
		
			res.json(result);
			res.end();	

		});
	});		
	
});


app.post('/api/restaurant/create', function(req, res) {
	if (!req.session.authenticated)
		res.render('login.ejs');
	console.log(req.body);
	
	var criteria = {};
	criteria['name'] = (req.body.name != null)? req.body.name : null;
	criteria['borough'] = (req.body.borough != null)? req.body.borough : null;
	criteria['cuisine'] = (req.body.cuisine != null)? req.body.cuisine : null;
	criteria['address'] = {};
	criteria.address.street = (req.body.street != null)? req.body.street : null;
	criteria.address.building = (req.body.building != null)? req.body.building : null;
	criteria.address.zipcode = (req.body.zipcode != null)? req.body.zipcode : null;
	criteria.address['coord'] = [];
	criteria.address.coord.push(req.body.coord_lon);
	criteria.address.coord.push(req.body.coord_lat);
	criteria['ratings'] = [];
	criteria['image'] = (req.body.image != null) ? req.body.image : null;
	criteria['mimetype'] = (req.body.mimetype != null) ? req.body.mimetype : null;
	criteria['owner'] = req.session.username;

	
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err,null);   
		console.log('Connected to MongoDB\n')	
		
		db.collection('restaurant').insertOne(criteria, function(err, result) {
			console.log(result);
			db.close();
			res.json(result.ops[0]);
			res.end();
		});	
	});
			
});




app.get('/search', function(req, res) {
	console.log('/search criteria = ' + JSON.stringify(req.query));
	username = req.session.username;
	findRestaurant(res, req.query, username);
});

app.get('/new', function(req, res) {
	res.status(200);
	res.render("new.ejs");
});


app.post('/create', function(req, res) {
	console.log(JSON.stringify(req.body));
	if (!req.session.authenticated)
		res.render('login.ejs');
	var new_r = {};
	var image = {};
	var exif = {};
	new_r['name'] = req.body.name;
	new_r['borough'] = req.body.borough;
	new_r['cuisine'] = req.body.cuisine;
	new_r['address'] = {
			'street': req.body.street,
			'building': req.body.building,
			'zipcode': req.body.zipcode,
			'coord': [req.body.coord_lon, req.body.coord_lat]
	};
	new_r['owner'] = req.session.username;
	

	if (req.files.photo) {
		var mimetype = req.files.photo.mimetype;	
		new_r['mimetype'] = mimetype;	

		//image file should put together with folder, or set path for fs.read()
 
		new_r['image'] = new Buffer(req.files.photo.data).toString('base64');
				
	}	
	

	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err,null);   
		console.log('Connected to MongoDB\n');

		db.collection('restaurant').insertOne(new_r, function(err, result) {
			assert.equal(err, null);
			console.log('create new restaurant successfully');
			console.log(JSON.stringify(result));
			db.close();
			res.status(200);
			res.send('New restaurant has been created! <a href="/">Back to Home</a>');
			res.end();
		});
	});

});






app.get('/display', function(req, res) {
	var criteria = {};
	criteria['_id'] = ObjectId(req.query._id);
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err,null);   
		console.log('Connected to MongoDB\n');

		db.collection('restaurant').findOne(criteria, function(err, result) {
			assert.equal(err,null);
			console.log(result); 
			res.render('display.ejs', {restaurant:result});
		});
	});
});

app.get('/map', function(req,res) {
  res.status(200);
  // lat and lon will be limited by the current area, then display map
  res.render('gmap.ejs', {lat:req.query.lat,lon:req.query.lon,title:req.query.title});
});


app.get('/rate', function(req, res) {
	var _id = ObjectId(req.query._id);
	res.render('rate.ejs', {_id: _id});
});

app.post('/valid_rate', function(req, res) {
	var criteria = {
	'_id':ObjectId(req.body['_id']),
	'ratings':{$elemMatch: {'user':req.session.username}}
	};
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err,null);   
		console.log('Connected to MongoDB\n');

		db.collection('restaurant').findOne(criteria, function(err, result) {
			assert.equal(err, null);
			console.log(result);		
			if (result != null) {
				console.log('You have rated for this restaurant.');
				res.send('You have rated for this restaurant. <a href="/read">Back to Home</a>');
			}
			else	{
				var criteria2 = {'ratings': {'user':req.session.username, 'score': req.body['score']}};
				db.collection('restaurant').update({'_id':ObjectId(req.body['_id'])}, {$push: criteria2}, function(err, result2) {
					assert.equal(err, null);
					console.log('You rated for this restaurant successfully');
					res.send('You rated for this restaurant successfully. <a href="/read">Back to Home</a>');
				});		
			}						
		});
	});	
});

app.get('/edit', function(req, res) {
	var _id = ObjectId(req.query._id);
	var criteria = {'_id': _id};	

	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err,null);   
		console.log('Connected to MongoDB\n');

		db.collection('restaurant').findOne(criteria, function(err, result){
			assert.equal(err, null);
			console.log(result);
		
			if (result.owner != req.session.username) {
				res.send('You have no right to edit the restaurant.');
			}  else {
				res.status(200);
				res.render('edit.ejs', {restaurant: result});
				res.end();
			}
		
		});
	});
});

app.post('/update', function(req, res) {
	if (!req.session.authenticated)
		res.render('login.ejs');
	var new_r = {};
	var image = {};
	var exif = {};
	console.log(req.body._id);
	var criteria = {'_id': req.body._id};
	new_r['name'] = req.body.name;
	new_r['borough'] = req.body.borough;
	new_r['cuisine'] = req.body.cuisine;
	new_r['address'] = {
			'street': req.body.street,
			'building': req.body.building,
			'zipcode': req.body.zipcode,
			'coord': [req.body.coord_lon, req.body.coord_lat]
	};
	new_r['owner'] = req.session.username;
	

	if (req.files.photo) {
		var mimetype = req.files.photo.mimetype;	
		new_r['mimetype'] = mimetype;	

		//image file should put together with folder, or set path for fs.read()
 
		new_r['image'] = new Buffer(req.files.photo.data).toString('base64');
				
	}	
	

	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err,null);   
		console.log('Connected to MongoDB\n');

		db.collection('restaurant').update({'_id':ObjectId(req.body['_id'])}, {$set: new_r}, function(err, result) {
			assert.equal(err, null);
			console.log('Update restaurant successfully');
			console.log(JSON.stringify(result));
			db.close();
			res.status(200);
			res.send('Restaurant has been updated! <a href="/">Back to Home</a>');
			res.end();
		});
	});
	
});


app.get('/delete', function(req, res) {
	var id = ObjectId(req.query._id);
	var criteria = {'_id': id};
	console.log(id);
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err,null);   
		console.log('Connected to MongoDB\n');

		db.collection('restaurant').findOne(criteria, function(err, result){
			assert.equal(err, null);
			console.log(result);
		
			if (result.owner != req.session.username) {
				res.send('You have no right to remove the restaurant.');
			}  else {
				db.collection('restaurant').remove(criteria, function(err) {
					assert.equal(err, null);
					res.send('You have removed your restaurant successfully. <a href="/">Back to Home</a>');
				});
			}
		
		});
	});

});


function findRestaurant(res, criteria, username) {
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err,null);   
		console.log('Connected to MongoDB\n');
		db.collection('restaurant').find(criteria).toArray(function(err, result) {  //convert db data into array  
			assert.equal(err,null); 
			db.close();
			if (result.length == 0) {    
				res.writeHead(500, {"Content-Type": "text/plain"});
				res.end('Not Found!');
			}  else {
				res.status(200);
				res.render('index.ejs', {restaurant: result, username:username});
			}			
		});
	});	
}


function add_helper(db, criteria, callback) {
	db.collection('helpers').insertOne(criteria, function(err, result) {
		assert.equal(err, null);
		console.log('New helper was added!');
		callback(result);
	});
}


function read_helper(db, criteria, callback) {
	db.collection('helpers').find(criteria).toArray(function(err, result) {
		assert.equal(err, null);
		callback(result);
	});
}

