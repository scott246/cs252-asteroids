/*eslint-env node*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------

// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');
var favicon = require('serve-favicon');
// create a new express server
var app = express();
app.use(favicon(__dirname + '/public/images/favicon.ico'));
// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();



var mysql = require('mysql');
var db = null;
var passport = require('passport');
var flash = require('connect-flash');

var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session      = require('express-session');

/***** Setting up MySQL database *****/
var connection = null;
if (process.env.VCAP_SERVICES) {
   var services = JSON.parse(process.env.VCAP_SERVICES);
   for (var svcName in services) {
        if (svcName.match(/^cleardb/)) {
            var mysqlCreds = services[svcName][0]['credentials'];
            connection = mysql.createPool({
                connectionLimit: 100,
                host: mysqlCreds.hostname,
                port: mysqlCreds.port,
                user: mysqlCreds.username,
                password: mysqlCreds.password,
                database: mysqlCreds.name
            });
        }
    }
}

app.use(express.static(__dirname + '/public'));

//Setting up passport
require('./config/passport')(passport, connection);


app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.engine('.ejs', require('ejs').__express);
app.engine('.html', require('ejs').renderFile);

app.set('views', __dirname + '/public');
app.set('view engine', 'ejs');

app.use(session({ secret: 'igotasecret' })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session



require('./app/routes.js')(app,passport, connection);
// app.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email'] }));


// start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function() {

	// print a message when the server starts listening
  console.log("We startin maginc on: " + appEnv.port);

});

