var express = require('express');
var http = require('http');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var bodyParser = require('body-parser');
var nconf = require('nconf');
var session = require('express-session');

nconf.env().argv();
nconf.file('./config.json');

var routes = require('./routes');
var api = require('./routes/api');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({ secret: nconf.get('SESSION_SECRET'), resave: true, saveUninitialized: true }));
app.use(express.static(path.join(__dirname, 'public')));

if (app.get('env') !== 'development') {
	app.all('*', routes.force_https);
} else {
	app.all('*', routes.check_dev_token);
}

app.get('/', routes.index);
app.get('/trips', routes.authenticate, routes.trips);
app.get('/trips/:id', routes.authenticate, routes.trip);
app.get('/vehicles', routes.authenticate, routes.vehicles);

app.get('/authorize/', routes.authorize);
app.get('/logout/', routes.logout);
app.get('/redirect/', routes.redirect);

app.get('/api/trips/', routes.authenticate, api.trips);
app.get('/api/trips/:id', routes.authenticate, api.trip);
app.get('/api/vehicles/', routes.authenticate, api.vehicles);
app.get('/download/trips.json', routes.authenticate, api.downloadTripsJSON);
app.get('/download/trips.csv', routes.authenticate, api.downloadTripsCSV);

// error handlers

// catch 404 errors
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  res.status(404);
  if(req.xhr) {
    res.send({
      message: err.message,
      error: {}
    });
  } else {
    res.render('error', {
      message: err.message,
      description: 'Page not found',
      error: {}
    });
  }
});

// catch 401 Unauthorized errors
app.use(function(err, req, res, next) {
  if(err.status !== 401) return next(err);
  res.status(401);
  if(req.xhr) {
    res.send({
      message: err.message,
      error: err
    });
  } else {
    res.render('error', {
      message: err.message,
      description: 'You need to log in to see this page.',
      error: err
    });
  }
});


// log all other errors
app.use(function(err, req, res, next) {
  console.error(err.stack || err);
  next(err);
});

// development 500 error handler
// will print stacktrace
if(app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(500);
    if(req.xhr) {
      res.send({
        message: err.message,
        error: err
      });
    } else {
      res.render('error', {
        message: err.message,
        error: err
      });
    }
  });
}


// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(500);
  if(req.xhr) {
    res.send({
      message: err.message,
      error: {}
    });
  } else {
    res.render('error', {
      message: err.message,
      description: 'Server error',
      error: {}
    });
  }
});

module.exports = app;
