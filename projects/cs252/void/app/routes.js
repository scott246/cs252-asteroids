// app/routes.js
var mysql = require('mysql');
var util = require('util');

module.exports = function(app, passport, connection) {

    // Home page
    app.get('/', function(req, res) {
        res.render('views/login.ejs'); // load the index.ejs file
    });
    app.get('/index.html', function(req, res) {
        res.render('views/login.ejs'); // load the index.ejs file
    });

    // process the login form
    // app.post('/login', do all our passport stuff here);


    // we will use route middleware to verify this (the isLoggedIn function)
    app.get('/profile', isLoggedIn, function(req, res) {
        connection.getConnection(function(err, connection) {
                if(err) {
                    console.log("Pool connection failed");
                    return;
                }

                // // try to find the user based on their google id
                connection.query("SELECT name, highscore FROM users ORDER BY LENGTH(highscore) DESC, highscore DESC", function(err, scores) {
                    console.log("SCORES: "+ scores);
                    console.log(scores.length);

                    connection.release();
                    res.render('views/profile.ejs', {user : req.user, scores: scores});
                });
                
            });
                
    });


    app.get('/game', isLoggedIn, function(req, res){
        res.render('game.ejs', {user : req.user});
    });

    app.post('/update_score', function(req, res){
        var score = {};
        console.log('body: ' + JSON.stringify(req.body));
        connection.getConnection(function(err, connection) {
            if(err) {
                console.log("Pool connection failed");
                return;
            }
            var newUser  = new Object();
            newUser.id = req.body.id;
            newUser.score = req.body.score;
            // save the user
            connection.query('UPDATE users SET highscore = ? WHERE id = ? and highscore < ?', [newUser.score, newUser.id, newUser.score], function(err,res){
                if(err) {
                    console.log("Couldnt add.");
                } else {
                    console.log("Sucessfully updated score");
                }
                connection.release();
            }); 
        });

        res.send(req.body);
    });

    app.get('/how_to_play', function(req, res) {
        res.render('views/how_to_play.ejs');
    });

    // logout call
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

    app.get('/favicon.ico', function(req,res){
        res.render('favicon.ico');
    });

    app.get('/auth/google', 
        // passport.authenticate('google', { scope : ['https://www.googleapis.com/auth/plus.login'] }),
        passport.authenticate('google', { scope : ['profile', 'email'] }));

        // function(req,res){
        //     //Not called, goes to google
        // });

    // the callback after google has authenticated the user
    app.get('/auth/google/callback',
            passport.authenticate('google', {
                    successRedirect : '/profile',
                    failureRedirect : '/'
            }));
};


// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated()){
        return next();
    }

    // if they aren't redirect them to the home page
    res.redirect('/');
};