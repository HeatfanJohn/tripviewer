const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const bodyParser = require('body-parser');
const nconf = require('nconf');
const session = require('express-session');
const passport = require('passport');
const AutomaticStrategy = require('passport-automatic').Strategy;

nconf.env().argv();
nconf.file('./config.json');

nconf.set('API_URL', 'https://api.automatic.com');

const routes = require('./routes');
const api = require('./routes/api');

const app = express();


// Use the AutomaticStrategy within Passport
passport.use(new AutomaticStrategy({
  clientID: nconf.get('AUTOMATIC_CLIENT_ID'),
  clientSecret: nconf.get('AUTOMATIC_CLIENT_SECRET'),
  scope: ['scope:trip', 'scope:location', 'scope:vehicle:profile', 'scope:vehicle:events', 'scope:behavior']
},
  (accessToken, refreshToken, profile, done) => {
    profile.accessToken = accessToken;
    return done(null, profile);
  }
));


passport.serializeUser((user, done) => {
  done(null, user);
});


passport.deserializeUser((obj, done) => {
  done(null, obj);
});


// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(favicon(`${__dirname}/public/favicon.ico`));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
  secret: nconf.get('SESSION_SECRET'),
  resave: true,
  saveUninitialized: true,
  cookie: {maxAge: 31536000000}
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));

if (app.get('env') !== 'development') {
  app.all('*', routes.force_https);
} else {
  app.all('*', routes.check_dev_token);
}

app.get('/', routes.ensureAuthenticated, routes.index);
app.get('/login', routes.login);
app.get('/trips', routes.ensureAuthenticated, routes.trips);
app.get('/trips/:id', routes.ensureAuthenticated, routes.trip);
app.get('/vehicles', routes.ensureAuthenticated, routes.vehicles);

app.get('/authorize/', passport.authenticate('automatic'));
app.get('/logout/', routes.logout);
app.get('/redirect/', passport.authenticate('automatic', {failureRedirect: '/'}), routes.redirect);

app.get('/api/trips/', routes.ensureAuthenticated, api.trips);
app.get('/api/trips/:id', routes.ensureAuthenticated, api.trip);
app.get('/api/vehicles/', routes.ensureAuthenticated, api.vehicles);
app.post('/api/trips/:id/tag', routes.ensureAuthenticated, api.tagTrip);
app.delete('/api/trips/:id/tag/:tag', routes.ensureAuthenticated, api.untagTrip);

app.get('/download/trips.csv', routes.ensureAuthenticated, api.downloadTripsCSV);
app.get('/download/trips.json', routes.ensureAuthenticated, api.trips);

// error handlers
require('./libs/errors')(app);

module.exports = app;
