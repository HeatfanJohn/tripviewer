const nconf = require('nconf');


exports.index = (req, res, next) => {
  res.render('index', {loggedIn: true, menu: 'summary'});
};


exports.login = (req, res, next) => {
  res.render('login');
};


exports.redirect = (req, res, next) => {
  res.redirect('/');
};


exports.ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }

  if (req.xhr) {
    const error = new Error('Not logged in');
    res.status(401);
    return next(error);
  }
  return res.redirect('/login');
};


exports.logout = (req, res, next) => {
  req.logout();
  res.redirect('/');
};


exports.trips = (req, res, next) => {
  res.render('trips', {loggedIn: true, menu: 'trips', mapboxAccessToken: nconf.get('MAPBOX_ACCESS_TOKEN')});
};


exports.trip = (req, res, next) => {
  res.render('trip', {trip_id: req.params.id, loggedIn: true, menu: 'trips', mapboxAccessToken: nconf.get('MAPBOX_ACCESS_TOKEN')});
};


exports.vehicles = (req, res, next) => {
  res.render('vehicles', {loggedIn: true, menu: 'vehicles'});
};


exports.force_https = (req, res, next) => {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    res.redirect(`https://${req.headers.host}${req.path}`);
  } else {
    next();
  }
};


exports.check_dev_token = (req, res, next) => {
  if (process.env.TOKEN) {
    req.login({accessToken: process.env.TOKEN}, next);
  } else {
    next();
  }
};
