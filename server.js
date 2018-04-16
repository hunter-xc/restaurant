var http = require('http');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
//var ExifImage = require('exif').ExifImage;
var ObjectId = require('mongodb').ObjectID;
var mongourl = 'mongodb://user2:password@ds137054.mlab.com:37054/my_database';
var fileUpload = require('express-fileupload');
var express = require('express');
//var session = require('cookie-session');
var  session = require('express-session');
var bodyParser = require('body-parser');
var JSZip = require('jszip');
var zip = new JSZip();

var app = express();


app.listen(process.env.PORT || 8099);


app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(express.static(__dirname +  '/public'));
app.use(fileUpload());

app.use(session({secret: 'ssshhhhh'}));

/*
var users = new Array(
	{name: 'demo', password: 'password'},
	{name: 'user1', password: 'password'},
	{name: 'user2', password: 'password'}
);
*/

/*
app.use(session({
  name: 'session',
  keys: ['ouhk', 'comps381f']
}));
*/


app.get("/", function(req,res) {
	res.status(200);
	if (req.session.username) {
		MongoClient.connect(mongourl, function(err, db) {
			assert.equal(err,null); 
			read_userdata(db, {'username': req.session.username}, function(result) {
				db.close();
				res.render('index.ejs', {result: result});
			});
		});
	}
		
	else 
		res.render('login.ejs');
});



app.post("/login", function(req, res) {  
	// attribute name inside login.ejs should be the same as database, or it can not match
	console.log(req.body);

	
	var criteria = {};
	criteria['username'] = req.body.username;
	criteria['password'] = req.body.password;

	
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err,null);   
		console.log('Connected to MongoDB\n');
	
		db.collection('users').find(criteria).toArray(function(err, result) {  
			assert.equal(err,null); 
			db.close();
			if (result.length == 0)  
				res.send("Invalid username or password");
			else {
				req.session.username = req.body.username;
				res.redirect('/');
			}
			res.end();	
		});
	});	
	

});

app.get('/logout', function(req, res) {
	req.session.username = null;
	res.redirect('/');
});

/*
app.get('/register', function(req, res) {
	res.render('register.ejs');
})
*/

app.post('/register', function(req, res) {
	var criteria = {};
	criteria['username'] = req.body.username;
	criteria['password'] = req.body.password;
	criteria['email'] = req.body.email;
	criteria['bridegroom'] = req.body.bridegroom;
	criteria['bride'] = req.body.bride;
	criteria['budget'] = req.body.budget;
	criteria['big_day'] = req.body.big_day;
	criteria['table_person_count'] = 10;
	
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err,null);   
		console.log('Connected to MongoDB\n');
	
		db.collection('users').insertOne(criteria, function(err, result) {  
			assert.equal(err,null); 
			db.close();
		
			res.redirect('/');

		});
	});	
})

app.get('/demo/album/family', function(req, res) {
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err, null);
		read_photo(db, {'userid': 'demo'}, function(result) {
				db.close();
				
				var img = zip.folder('images');
				
				zip.file("hello.txt", "Hello World\n");
				
				//res.send(data: result[0].mimetype;base64, result[0].image);
				//img.file('test.jpg', result[0].image, {base64: true});
				
				zip.generateAsync({type:"blob"}).then(function(content) {
					// see FileSaver.js
					saveAs(content, "example.zip");
				});
		});			
	});		
});



app.get('/read_profile', function(req, res) {
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err, null);
		read_userdata(db, {'username': req.session.username}, function(result) {
			db.close();
			res.render('read_profile.ejs', {result:result});				
		});	
	});	
});




app.post('/edit_profile' ,function(req, res) {
	var criteria = {};
	criteria['bridegroom'] = req.body.bridegroom;
	criteria['bride'] = req.body.bride;
	criteria['budget'] = req.body.budget;
	criteria['big_day'] = req.body.big_day;
	criteria['location'] = req.body.location;
	criteria['num_of_table'] = req.body.num_of_table;

	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err, null);
		edit_profile(db, {'_id': ObjectId(req.body._id)}, criteria, function(result) {
			db.close();
		});	
	});
	res.redirect('/read_profile');	

});

app.post('/edit_password' ,function(req, res) {
	var criteria = {};
	criteria['password'] = req.body.new_password;

	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err, null);
		edit_profile(db, {'_id': ObjectId(req.body._id)}, criteria, function(result) {
			db.close();
		});	
	});
	res.redirect('/read_profile');	

});




/*
app.get('/add_helper', function(req, res) {
	res.render('add_helper.ejs');
});
*/

app.post('/add_helper', function(req, res) {
	var criteria = {};
	criteria['name'] = req.body.name;
	criteria['duty'] = req.body.duty;
	criteria['phone'] = req.body.phone;
	criteria['email'] = req.body.email;
	criteria['time'] = req.body.time;
	criteria['remark'] = req.body.remark;
	criteria['userid'] = req.session.username;
	
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err, null);
		console.log('Connecte db successfully');
		add_helper(db, criteria, function(result) {
			db.close();
			res.redirect('/read_helper');
		});
	});
});

app.get('/read_helper', function(req, res) {
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err, null);
		read_helper(db, {'userid': req.session.username}, function(result) {
			read_userdata(db, {'username': req.session.username}, function(userdata) {
				db.close();
				res.render('read_helper.ejs', {result:result, userdata: userdata});
			});
		});
	});
});

app.post('/edit_helper' ,function(req, res) {
	var criteria = {};
	criteria['name'] = req.body.name;
	criteria['duty'] = req.body.duty;
	criteria['phone'] = req.body.phone;
	criteria['email'] = req.body.email;
	criteria['relation'] = req.body.relation;
	criteria['time'] = req.body.time;
	criteria['remark'] = req.body.remark;

	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err, null);
		edit_helper(db, {'_id': ObjectId(req.body._id)}, criteria, function(result) {
			db.close();
		});	
	});
	res.redirect('/read_helper');	

});

app.get('/delete_helper', function(req, res) {
	var criteria = {};
	criteria['_id'] = ObjectId(req.query._id);
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err,null);   
		console.log('Connected to MongoDB\n');
		delete_helper(db, criteria, function(result) {
			db.close();
		});
	});
	res.redirect('/read_helper');
});

/*
app.get('/add_guest', function(req, res) {
	res.render('add_guest.ejs');
});
*/

app.post('/add_guest', function(req, res) {
	var criteria = {};
	criteria['name'] = req.body.name;
	criteria['phone'] = req.body.phone;
	criteria['email'] = req.body.email;
	criteria['relation'] = req.body.relation;
	if (req.body.invited) 
		criteria['invited'] = req.body.invited;
	else 
		criteria['invited'] = "off";
	if (req.body.attend) 
		criteria['attend'] = req.body.attend;
	else 
		criteria['attend'] = "off";
	criteria['userid'] = req.session.username;
	
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err, null);
		add_guest(db, criteria, function(result) {
			db.close();
			res.redirect('/read_guest');
		});
	});
});

app.get('/read_guest', function(req, res) {
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err, null);
		read_guest(db, {'userid': req.session.username}, function(result) {
			read_userdata(db, {'username': req.session.username}, function(userdata) {
				db.close();
				res.render('read_guest.ejs', {result:result, userdata: userdata});
			});
		});
	});
});

app.post('/edit_guest' ,function(req, res) {
	var criteria = {};
	criteria['name'] = req.body.name;
	criteria['phone'] = req.body.phone;
	criteria['email'] = req.body.email;
	criteria['relation'] = req.body.relation;
	if (req.body.invited) 
		criteria['invited'] = req.body.invited;
	else 
		criteria['invited'] = "off";
	if (req.body.attend) 
		criteria['attend'] = req.body.attend;
	else 
		criteria['attend'] = "off";	

	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err, null);
		edit_guest(db, {'_id': ObjectId(req.body._id)}, criteria, function(result) {
			db.close();
		});	
	});
	res.redirect('/read_guest');	

});

app.get('/delete_guest', function(req, res) {
	var criteria = {};
	criteria['_id'] = ObjectId(req.query._id);
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err,null);   
		console.log('Connected to MongoDB\n');
		delete_guest(db, criteria, function(result) {
			db.close();
		});
	});
	res.redirect('/read_guest');
});

/*
app.get('/add_schedule', function(req, res) {
	res.render('add_schedule.ejs');
});
*/

app.post('/add_schedule', function(req, res) {
	var criteria = {};
	criteria['start_date'] = req.body.start_date;
	criteria['end_date'] = req.body.end_date;
	criteria['event_name'] = req.body.event_name;
	/*
	if (req.body.done) 
		criteria['done'] = req.body.done;
	else 
		criteria['done'] = "off";
	*/
	criteria['userid'] = req.session.username;
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err, null);
		add_schedule(db, criteria, function(result) {
			db.close();
			res.redirect('/read_schedule');
		});
	});
});

app.post('/edit_schedule' ,function(req, res) {
	var criteria = {};
	criteria['start_date'] = req.body.start_date_edit;
	criteria['end_date'] = req.body.end_date_edit;
	criteria['event_name'] = req.body.event_name_edit;
	criteria['userid'] = req.session.username;

	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err, null);
		edit_schedule(db, {'_id': ObjectId(req.body._id)}, criteria, function(result) {
			db.close();
		});	
	});
	res.redirect('/read_schedule');	

});

/*
app.get('/read_schedule', function(req, res) {
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err, null);
		read_schedule(db, {'userid': req.session.username}, function(result) {
			read_userdata(db, {'username': req.session.username}, function(userdata) {
				db.close();
				res.render('read_schedule.ejs', {result:result, userdata: userdata});
			});
		});		
	});
});
*/

app.get('/read_schedule', function(req, res) {
	
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err, null);
		read_schedule(db, {'userid': req.session.username}, function(result) {
			read_userdata(db, {'username': req.session.username}, function(userdata) {
				db.close();
				res.render('read_schedule.ejs', {result:result, userdata: userdata});
			});
		});		
	});
	
});

app.post('/delete_schedule', function(req, res) {
	var criteria = {};
	criteria['_id'] = ObjectId(req.body._id_delete);
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err,null);   
		console.log('Connected to MongoDB\n');
		delete_schedule(db, criteria, function(result) {
			db.close();
		});
	});
	res.redirect('/read_schedule');
});

/*
app.get('/add_rundown', function(req, res) {
	res.render('add_rundown.ejs');
});
*/

app.post('/add_rundown', function(req, res) {
	var criteria = {};
	criteria['time'] = req.body.time;
	criteria['event_name'] = req.body.event_name;
	criteria['handler'] = req.body.handler;
	criteria['remark'] = req.body.remark;
	criteria['userid'] = req.session.username;
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err, null);
		add_rundown(db, criteria, function(result) {
			db.close();
			res.redirect('/read_rundown');
		});
	});
});



app.get('/delete_rundown', function(req, res) {
	var criteria = {};
	criteria['_id'] = ObjectId(req.query._id);
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err,null);   
		console.log('Connected to MongoDB\n');
		delete_rundown(db, criteria, function(result) {
			db.close();
		});
	});
	res.redirect('/read_rundown');
});

app.post('/edit_rundown' ,function(req, res) {
	var criteria = {};
	criteria['time'] = req.body.time;
	criteria['event_name'] = req.body.event_name;
	criteria['handler'] = req.body.handler;
	criteria['remark'] = req.body.remark;

	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err, null);
		edit_rundown(db, {'_id': ObjectId(req.body._id)}, criteria, function(result) {
			db.close();
		});	
	});
	res.redirect('/read_rundown');	

});


app.get('/read_rundown', function(req, res) {
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err, null);
		read_rundown(db, {'userid': req.session.username}, function(result) {
			read_userdata(db, {'username': req.session.username}, function(userdata) {
				db.close();
				res.render('read_rundown.ejs', {result:result, userdata: userdata});
			});
		});		
	});
});

/*
app.get('/add_budget', function(req, res) {
	res.render('add_budget.ejs');
});
*/

app.post('/add_budget', function(req, res) {
	var criteria = {};
	criteria['category'] = req.body.category;
	criteria['item'] = req.body.item;
	criteria['estimate_cost'] = req.body.estimate_cost;
	criteria['actual_cost'] = req.body.actual_cost;
	criteria['paid'] = req.body.paid;
	criteria['unpaid'] = req.body.unpaid;
	criteria['userid'] = req.session.username;
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err, null);
		add_budget(db, criteria, function(result) {
			db.close();
		});		
	});
	res.redirect('/read_budget');
	
});


app.get('/read_budget', function(req, res) {
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err, null);
		read_budget(db, {'userid': req.session.username}, function(result) {
			read_userdata(db, {'username': req.session.username}, function(userdata) {
				db.close();
				res.render('read_budget.ejs', {result:result, userdata: userdata});				
			});
		});		
	});	
});

app.post('/edit_budget' ,function(req, res) {
	var criteria = {};
	criteria['category'] = req.body.category;
	criteria['item'] = req.body.item;
	criteria['estimate_cost'] = req.body.estimate_cost;
	criteria['actual_cost'] = req.body.actual_cost;
	criteria['paid'] = req.body.paid;
	criteria['unpaid'] = req.body.unpaid;
	
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err, null);
		edit_budget(db, {'_id': ObjectId(req.body._id)}, criteria, function(result) {
			db.close();
		});	
	});
	res.redirect('/read_budget');	

});

app.get('/delete_budget', function(req, res) {
	var criteria = {};
	criteria['_id'] = ObjectId(req.query._id);
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err,null);   
		console.log('Connected to MongoDB\n');

		delete_budget(db, criteria, function(result) {
			db.close();
		});
	});
	res.redirect('/read_budget');
});

/*
app.get('/add_seatingplan', function(req, res) {
	res.render('add_seatingplan.ejs');
});
*/

app.post('/add_seatingplan', function(req, res) {
	var criteria = {};
	criteria['table'] = req.body.table;
	//criteria['seat'] = req.body.seat;
	criteria['guest'] = req.body.guest;
	if (req.body.groom_guest) 
		criteria['groom_guest'] = req.body.groom_guest;
	else 
		criteria['groom_guest'] = "off";	
	if (req.body.bride_guest) 
		criteria['bride_guest'] = req.body.bride_guest;
	else 
		criteria['bride_guest'] = "off";	
	criteria['remark'] = req.body.remark;	
	criteria['userid'] = req.session.username;
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err, null);
		add_seatingplan(db, criteria, function(result) {
			db.close();
			res.redirect('/read_seatingplan');
		});	
	});
});

app.post('/edit_seatingplan' ,function(req, res) {
	var criteria = {};
	criteria['table'] = req.body.table;
	//criteria['seat'] = req.body.seat;
	criteria['guest'] = req.body.guest;
	if (req.body.groom_guest) 
		criteria['groom_guest'] = req.body.groom_guest;
	else 
		criteria['groom_guest'] = "off";	
	if (req.body.bride_guest) 
		criteria['bride_guest'] = req.body.bride_guest;
	else 
		criteria['bride_guest'] = "off";	
	criteria['remark'] = req.body.remark;

	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err, null);
		edit_seatingplan(db, {'_id': ObjectId(req.body._id)}, criteria, function(result) {
			db.close();
		});	
	});
	res.redirect('/read_seatingplan');	
});

app.get('/delete_seatingplan', function(req, res) {
	var criteria = {};
	criteria['_id'] = ObjectId(req.query._id);
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err,null);   
		console.log('Connected to MongoDB\n');

		delete_seatingplan(db, criteria, function(result) {
			db.close();
		});
	});
	res.redirect('/read_seatingplan');
});

app.get('/read_seatingplan', function(req, res) {
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err, null);
		read_seatingplan(db, {'userid': req.session.username}, function(result) {
			read_userdata(db, {'username': req.session.username}, function(userdata) {
				db.close();
				res.render('read_seatingplan.ejs', {result:result, userdata: userdata});
			});
		});			
	});
});


app.post('/edit_people_count' ,function(req, res) {
	var criteria = {};
	criteria['table_person_count'] = req.body.table_person_count;

	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err, null);
		edit_profile(db, {'_id': ObjectId(req.body._id)}, criteria, function(result) {
			db.close();
		});	
	});
	res.redirect('/read_seatingplan');	

});


app.post('/add_photo', function(req, res) {
	var new_r = {};
	var image = {};
	var exif = {};
	new_r['name'] = req.body.name;
	//new_r['category'] = req.body.category;
	//new_r['date'] = req.body.date;
	new_r['userid'] = req.session.username;
	
	if (req.files.photo) {
		var mimetype = req.files.photo.mimetype;	
		new_r['mimetype'] = mimetype;			
		//image file should put together with folder, or set path for fs.read() 
		new_r['image'] = new Buffer(req.files.photo.data).toString('base64');				
	}	

	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err,null);   
		console.log('Connected to MongoDB\n');
		
		db.collection('photos').insertOne(new_r, function(err, result) {
			assert.equal(err, null);
			console.log('add new photo successfully');
			console.log(JSON.stringify(result));
			db.close();
			res.redirect('/read_photo');
		});
	});
});

app.get('/read_photo', function(req, res) {
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err, null);
		read_photo(db, {'userid': req.session.username}, function(result) {
			read_userdata(db, {'username': req.session.username}, function(userdata) {
				db.close();
				res.render('read_photo.ejs', {result:result, userdata: userdata});
			});
		});			
	});	
});


app.get('/add_vendor', function(req, res) {
	res.render('add_vendor.ejs');
});

app.post('/add_vendor', function(req, res) {
	var new_r = {};
	var image = {};
	var exif = {};
	new_r['name'] = req.body.name;
	new_r['address'] = req.body.address;
	new_r['phone'] = req.body.phone;
	new_r['price'] = req.body.price;
	new_r['type'] = req.body.type;
	new_r['table_number'] = req.body.table_number;
	new_r['rating'] = req.body.rating;	
	
	if (req.files.photo) {
		var mimetype = req.files.photo.mimetype;	
		new_r['mimetype'] = mimetype;			
		//image file should put together with folder, or set path for fs.read() 
		new_r['image'] = new Buffer(req.files.photo.data).toString('base64');				
	}	

	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err,null);   
		console.log('Connected to MongoDB\n');
		db.collection('vendors').insertOne(new_r, function(err, result) {
			assert.equal(err, null);
			console.log('add new vendor successfully');
			console.log(JSON.stringify(result));
			db.close();
			res.status(200);
			res.send('new vendor has been added!');
			res.end();
		});
	});
});

app.get('/read_vendor', function(req, res) {
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err, null);
		read_vendor(db, {}, function(result) {
			read_userdata(db, {'username': req.session.username}, function(userdata) {
				db.close();
				res.render('read_vendor.ejs', {result:result, userdata: userdata});
			});
		});			
	});	
});



app.get('/read_checklist', function(req, res) {
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err, null);
		read_checklist(db, {'userid': req.session.username}, function(result) {
			read_userdata(db, {'username': req.session.username}, function(userdata) {
				db.close();
				res.render('read_checklist.ejs', {result:result, userdata: userdata});	
			});
		});		
	});	
});

app.post('/add_checklist', function(req, res) {
	var criteria = {};
	criteria['item'] = req.body.item;
	criteria['handler'] = req.body.handler;
	criteria['done'] = "off";
	criteria['userid'] = req.session.username;
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err, null);
		add_checklist(db, criteria, function(result) {
			db.close();
		});		
	});
	res.redirect('/read_checklist');	
});

app.post('/edit_checklist' ,function(req, res) {
	var criteria = {};
	criteria['item'] = req.body.item;
	criteria['handler'] = req.body.handler;
	if (req.body.done) 
		criteria['done'] = req.body.done;
	else 
		criteria['done'] = "off";

	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err, null);
		edit_checklist(db, {'_id': ObjectId(req.body._id)}, criteria, function(result) {
			db.close();
		});	
	});
	res.redirect('/read_checklist');	

});

app.get('/delete_checklist', function(req, res) {
	var criteria = {};
	criteria['_id'] = ObjectId(req.query._id);
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err,null);   
		console.log('Connected to MongoDB\n');

		delete_checklist(db, criteria, function(result) {
			db.close();
		});
	});
	res.redirect('/read_checklist');
});


app.get('/read', function(req, res) {
	if (!req.session.authenticated)
		res.render('login.ejs');
	else {
		username = req.session.username;
		findRestaurant(res, {}, username);
	}		
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
	db.collection('helpers').find(criteria).sort({'duty':1}).toArray(function(err, result) {
		assert.equal(err, null);
		callback(result);
	});
}

function edit_helper(db, r, criteria, callback) {
	db.collection('helpers').update(r, {$set: criteria}, function(err, result) {
		assert.equal(err, null);
		callback(result);
	});
};

function delete_helper(db, criteria, callback) {
	db.collection('helpers').remove(criteria, function(err, result) {
		assert.equal(err, null);
		callback(result);
	});
}


function add_guest(db, criteria, callback) {
	db.collection('guests').insertOne(criteria, function(err, result) {
		assert.equal(err, null);
		console.log('New guest was added!');
		callback(result);
	});
}


function read_guest(db, criteria, callback) {
	db.collection('guests').find(criteria).sort({'name': 1}).toArray(function(err, result) {
		assert.equal(err, null);
		callback(result);
	});
}

function edit_guest(db, r, criteria, callback) {
	db.collection('guests').update(r, {$set: criteria}, function(err, result) {
		assert.equal(err, null);
		callback(result);
	});
};

function delete_guest(db, criteria, callback) {
	db.collection('guests').remove(criteria, function(err, result) {
		assert.equal(err, null);
		callback(result);
	});
}

function add_schedule(db, criteria, callback) {
	db.collection('schedules').insertOne(criteria, function(err, result) {
		assert.equal(err, null);
		console.log('New event was added into schedule!');
		callback(result);
	});
}

function delete_schedule(db, criteria, callback) {
	db.collection('schedules').remove(criteria, function(err, result) {
		assert.equal(err, null);
		callback(result);
	});
}

function edit_schedule(db, r, criteria, callback) {
	db.collection('schedules').update(r, {$set: criteria}, function(err, result) {
		assert.equal(err, null);
		callback(result);
	});
};

function read_schedule(db, criteria, callback) {
	db.collection('schedules').find(criteria).sort({'event_name':1}).toArray(function(err, result) {
		assert.equal(err, null);
		callback(result);
	});
}

function add_rundown(db, criteria, callback) {
	db.collection('rundown').insertOne(criteria, function(err, result) {
		assert.equal(err, null);
		console.log('New event was added into rundown!');
		callback(result);
	});
}

function read_rundown(db, criteria, callback) {
	db.collection('rundown').find(criteria).sort({'time':1}).toArray(function(err, result) {
		assert.equal(err, null);
		callback(result);
	});
}

function edit_rundown(db, r, criteria, callback) {
	db.collection('rundown').update(r, {$set: criteria}, function(err, result) {
		assert.equal(err, null);
		callback(result);
	});
};

function delete_rundown(db, criteria, callback) {
	db.collection('rundown').remove(criteria, function(err, result) {
		assert.equal(err, null);
		callback(result);
	});
}

function add_budget(db, criteria, callback) {
	db.collection('budget').insertOne(criteria, function(err, result) {
		assert.equal(err, null);
		callback(result);
	});
}

function read_budget(db, criteria, callback) {
	db.collection('budget').find(criteria).sort({'category': 1}).toArray(function(err, result) {
		assert.equal(err, null);
		callback(result);
	});
}

function edit_budget(db, r, criteria, callback) {
	db.collection('budget').update(r, {$set: criteria}, function(err, result) {
		assert.equal(err, null);
		callback(result);
	});
};

function delete_budget(db, criteria, callback) {
	db.collection('budget').remove(criteria, function(err, result) {
		assert.equal(err, null);
		callback(result);
	});
}

function add_seatingplan(db, criteria, callback) {
	db.collection('seatingplan').insertOne(criteria, function(err, result) {
		assert.equal(err, null);
		console.log('New guest was added into seating plan!');
		callback(result);
	});
}

function read_seatingplan(db, criteria, callback) {
	db.collection('seatingplan').find(criteria).sort({'table': 1}).toArray(function(err, result) {
		assert.equal(err, null);
		callback(result);
	});
}

function edit_seatingplan(db, r, criteria, callback) {
	db.collection('seatingplan').update(r, {$set: criteria}, function(err, result) {
		assert.equal(err, null);
		callback(result);
	});
};

function delete_seatingplan(db, criteria, callback) {
	db.collection('seatingplan').remove(criteria, function(err, result) {
		assert.equal(err, null);
		callback(result);
	});
}

function read_photo(db, criteria, callback) {
	db.collection('photos').find(criteria).toArray(function(err, result) {
		assert.equal(err, null);
		callback(result);
	});
}

function read_vendor(db, criteria, callback) {
	db.collection('vendors').find(criteria).sort({'type': 1}).toArray(function(err, result) {
		assert.equal(err, null);
		callback(result);
	});
}

function read_userdata(db, criteria, callback) {
	db.collection('users').find(criteria).toArray(function(err, result) {
		assert.equal(err, null);
		callback(result);
	});
}

function add_checklist(db, criteria, callback) {
	db.collection('checklist').insertOne(criteria, function(err, result) {
		assert.equal(err, null);
		callback(result);
	});
}

function read_checklist(db, criteria, callback) {
	db.collection('checklist').find(criteria).sort({'item': 1}).toArray(function(err, result) {
		assert.equal(err, null);
		callback(result);
	});
}

function edit_checklist(db, r, criteria, callback) {
	db.collection('checklist').update(r, {$set: criteria}, function(err, result) {
		assert.equal(err, null);
		callback(result);
	});
};

function delete_checklist(db, criteria, callback) {
	db.collection('checklist').remove(criteria, function(err, result) {
		assert.equal(err, null);
		callback(result);
	});
}

function read_profile(db, criteria, callback) {
	db.collection('users').find(criteria, function(err, result) {
		assert.equal(err, null);
		callback(result);
	});
}

function edit_profile(db, r, criteria, callback) {
	db.collection('users').update(r, {$set: criteria}, function(err, result) {
		assert.equal(err, null);
		callback(result);
	});
};



