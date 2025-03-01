/*
CSC3916 HW2
File: Server.js
Description: Web API scaffolding for Movie API
 */

var express = require('express');
var http = require('http');
var bodyParser = require('body-parser');
var passport = require('passport');
var authController = require('./auth');
var authJwtController = require('./auth_jwt');
db = require('./db')(); //hack
var jwt = require('jsonwebtoken');
var cors = require('cors');

var app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());

var router = express.Router();

// Middleware to reject unsupported HTTP methods
app.use((req, res, next) => {
    console.log('Request came in')
    const allowedMethods = ['GET', 'PUT', 'POST', 'DELETE'];
    if (!allowedMethods.includes(req.method)) {
        console.log("unallowed http method")
      return res.status(405).send('Method Not Allowed');
    }
    next();

    // Reject !POST to /signup
    if (req.path == '/signup' && req.method != 'POST') {
            console.log("unallowed method for signup")
            return res.status(405).send('Method Not Supported for /signup');
    }

    // Reject !POST to /signin
    if (req.path == '/signin' && req.method != 'POST') {
        console.log("unallowed method for signin")
        return res.status(405).send('Method Not Supported for /signin');
    }

    // Reject base path
    if (req.path == '/') {
        console.log("unallowed method for root")
        return res.status(405).send('Root path not supported');
    }

  });

function getJSONObjectForMovieRequirement(req) {
    var json = {
        headers: "No headers",
        key: process.env.UNIQUE_KEY,
        body: "No body"
    };

    if (req.body != null) {
        json.body = req.body;
    }

    if (req.headers != null) {
        json.headers = req.headers;
    }

    return json;
}

router.post('/signup', (req, res) => {
    if (!req.body.username || !req.body.password) {
        console.log("no username or password for signup")
        res.json({success: false, msg: 'Please include both username and password to signup.'})
    } else {
        var newUser = {
            username: req.body.username,
            password: req.body.password
        };

        db.save(newUser); //no duplicate checking
        var reqInfo = getJSONObjectForMovieRequirement(req);
        console.log("new user created from signup")
        res.json({success: true, msg: 'Successfully created new user.', ...reqInfo})
    }
});

router.post('/signin', (req, res) => {
    var user = db.findOne(req.body.username);

    if (!user) {
        console.log("signin failed - user not found")
        res.status(401).send({success: false, msg: 'Authentication failed. User not found.'});
    } else {
        if (req.body.password == user.password) {
            var userToken = { id: user.id, username: user.username };
            var token = jwt.sign(userToken, process.env.SECRET_KEY);
            reqInfo = getJSONObjectForMovieRequirement(req);
            console.log("signin successful")
            res.json ({success: true, token: 'JWT ' + token, ...reqInfo});
        }
        else {
            console.log("signin failed - password incorrect")
            res.status(401).send({success: false, msg: 'Authentication failed.'});
        }
    }
});

router.route('/movies')
    .get((req, res) => {
        // Implementation here
        console.log("GET movies")
        resObj = { status: 200, message: "GET movies", ...getJSONObjectForMovieRequirement(req)};
        res.json(resObj);
    })
    .post((req, res) => {
        console.log("POST movies")
        // Implementation here
        resObj = { status: 200, message: "movie saved", ...getJSONObjectForMovieRequirement(req)};
        res.json(resObj);
    })
    .put(authJwtController.isAuthenticated, (req, res) => {
        // HTTP PUT Method
        // Requires JWT authentication.
        console.log("PUT movies")
        // Returns a JSON object with status, message, headers, query, and env.
        var o = getJSONObjectForMovieRequirement(req);
        o.status = 200;
        o.message = "movie updated";
        res.json(o);
    })
    .delete(authController.isAuthenticated, (req, res) => {
        // HTTP DELETE Method
        // Requires Basic authentication.
        // Returns a JSON object with status, message, headers, query, and env.
        console.log("DELETE movies")
        var o = getJSONObjectForMovieRequirement(req);
        o.status = 200;
        o.message = "movie deleted";
        res.json(o);
    })
    .all((req, res) => {
        // Any other HTTP Method
        // Returns a message stating that the HTTP method is unsupported.
        console.log("Unsupported HTTP Method for /movies")
        res.status(405).send({ message: 'HTTP method not supported.' });
    });


router.route('/testcollection')
    .delete(authController.isAuthenticated, (req, res) => {
        console.log(req.body);
        res = res.status(200);
        if (req.get('Content-Type')) {
            res = res.type(req.get('Content-Type'));
        }
        var o = getJSONObjectForMovieRequirement(req);
        res.json(o);
    }
    )
    .put(authJwtController.isAuthenticated, (req, res) => {
        console.log(req.body);
        res = res.status(200);
        if (req.get('Content-Type')) {
            res = res.type(req.get('Content-Type'));
        }
        var o = getJSONObjectForMovieRequirement(req);
        res.json(o);
    }
    );
    
app.use('/', router);
app.listen(process.env.PORT || 8080);
module.exports = app; // for testing only


