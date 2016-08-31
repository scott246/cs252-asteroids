// config/passport.js
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

// load the auth variables

var mysql = require('mysql');
var util = require('util');
// var bcrypt = require('bcrypt-nodejs');



// USE THIS TO GRAB A POOLED CONNECTION!!
// connection.getConnection(function(err, connection) {
//     if(err) {
//         console.log("Pool connection failed");
//         return;
//     }
//     console.log("Connection Established!");
//     // connection.query( 'SELECT something FROM sometable', function(err, rows) {
//     // And done with the connection.

//         var newUser  = {
//             id: "908731450987902745",
//             token: "asjdbfoj2034589uflsnv8984",
//             email: "jasldkfjl@laskjdf",
//             name: "laksdjf asdf"
//         }

//         // save the user
//             connection.query('INSERT INTO users SET ?', newUser, function(err,res){
//                 if(err) {
//                     console.log("Couldnt insert");
//                 } else {
//                     console.log("Sucessfully added new user");
//                 }
//             });               

//     connection.release();
//     // Don't use the connection here, it has been returned to the pool.
// });




module.exports = function(passport, connection) {

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        connection.getConnection(function(err, connection) {
            if(err) {
                console.log("Pool connection failed");
                return;
            }
            console.log("Connection Established!");
            console.log("ID: " + id);
            connection.query("SELECT * FROM users WHERE id = ?",id, function(err, user) {
                if(err){
                    console.log("Couldn't find id in table");
                    connection.release();
                    done(err);
                }

                connection.release();
                console.log(user);
                console.log(user.id);
                console.log(user.name);
                done(err,user);
            }); 
        }); 
    });
    
    passport.use(new GoogleStrategy({

        clientID        : "426462183752-eofpnakcd63h0kdbmplmnplvko70lg3o.apps.googleusercontent.com",
        clientSecret    : "n_ndlc6996-YXwE9FEyB4StW",
        callbackURL     : "http://void.mybluemix.net/auth/google/callback",

    },
    function(accesstoken, refreshToken, profile, done) {

        // make the code asynchronous
        process.nextTick(function() {
            connection.getConnection(function(err, connection) {
                if(err) {
                    console.log("Pool connection failed");
                    return;
                }

                // // try to find the user based on their google id
                connection.query("SELECT * FROM users WHERE id = ?",profile.id, function(err, user) {
                    console.log(user);
                    console.log(user.length);
                    if (err)
                        console.log("Error in grabbing from DB");
                    if (user.length != 0 && !err) {
                        // if a user is found, log them in
                        console.log("Found User");
                        connection.release();
                        return done(null, user[0]);
                    } else {
                        // if the user isnt in our database, create a new user
                        var newUser  = new Object();
                        newUser.id = profile.id;
                        newUser.name = profile.displayName;
                        newUser.email = profile.emails[0].value;
                        newUser.highscore = "0";

                        console.log(profile.id);
                        console.log(profile.displayName);
                        console.log(profile.emails[0].value);

                        // save the user
                            connection.query('INSERT INTO users SET ?', newUser, function(err,res){
                                if(err) {
                                    console.log("Couldnt insert");
                                } else {
                                    console.log("Sucessfully added new user");
                                }
                                
                            }); 
                        connection.release();
                        return done(null, newUser);
                    }
                });
                
            });
        });

    }));

};
