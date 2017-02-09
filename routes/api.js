const request = require('request');
const _ = require('underscore');
const async = require('async');
const nconf = require('nconf');
const helpers = require('../libs/helpers');

require('express-csv');

function filterAndSendTrips(trips, tripIds, cb) {
  // If requesting only specific trips, just get those
  let filteredTrips = trips;
  if (tripIds) {
    filteredTrips = helpers.filterTrips(filteredTrips, tripIds.split(','));
  }

  // Sort trips by date
  filteredTrips = helpers.sortByDate(filteredTrips);

  cb(null, filteredTrips);
}


function downloadVehicles(req, cb) {
  request.get({
    uri: `${nconf.get('API_URL')}/vehicle/`,
    headers: {Authorization: `bearer ${req.user.accessToken}`},
    json: true
  }, (err, r, body) => {
    cb(err, body.results);
  });
}


function downloadAllTrips(req, cb) {
  var uri = `${nconf.get('API_URL')}/trip/`;
  const tripIds = req.query.trip_ids;
  let trips = [];
  async.until(function(){ return !uri; }, function(cb) {
    request.get({
      uri: uri,
      headers: {Authorization: 'bearer ' + req.user.accessToken},
      json: true,
      qs: { limit: 250 }
    }, function(err, r, body) {

      if(err || body.error) {
        cb(new Error(err || body.error));
        return;
      }

      trips = trips.concat(body.results);
      uri = body['_metadata'] ? body['_metadata'].next : undefined;

      cb(err, body.results);
    });
  }, function(err, results) {
    if (err) return cb(err);
//    trips = trips.concat(results); // This line duplicates the results of the last page returned
    filterAndSendTrips(trips, tripIds, cb);
  });
};

exports.trips = (req, res, next) => {
  async.parallel([
      (cb) => {
      downloadAllTrips(req, cb);
},
  (cb) => {
    downloadVehicles(req, cb);
  }
], (err, data) => {
    if (err) return next(err);
    return res.json(helpers.mergeTripsAndVehicles(data[0], data[1]));
  });
};


exports.trip = (req, res, next) => {
  request.get({
    uri: `${nconf.get('API_URL')}/trip/${req.params.id}`,
    headers: {Authorization: `bearer ${req.user.accessToken}`},
    json: true
  }, (err, r, body) => {
    if (err) return next(err);
    return res.json(body);
  });
};


exports.tagTrip = (req, res, next) => {
  if (!req.body.tag) {
    return next(new Error('No tag provided'));
  }
  return request.post({
    uri: `${nconf.get('API_URL')}/trip/${req.params.id}/tag/`,
    headers: {Authorization: `bearer ${req.user.accessToken}`},
    form: {
      tag: req.body.tag
    }
  }, (err, r, body) => {
    if (err) return next(err);
    return res.send(body);
  });
};


exports.untagTrip = (req, res, next) => {
  request.del({
    uri: `${nconf.get('API_URL')}/trip/${req.params.id}/tag/${req.params.tag}/`,
    headers: {Authorization: `bearer ${req.user.accessToken}`}
  }, (err) => {
    if (err) return next(err);
    return res.send();
  });
};


exports.vehicles = (req, res, next) => {
  downloadVehicles(req, (err, vehicles) => {
    if (err) return next(err);
    return res.json(vehicles);
  });
};


exports.downloadTripsCSV = (req, res, next) => {
  async.parallel([
    (cb) => { downloadAllTrips(req, cb); },
    (cb) => { downloadVehicles(req, cb); }
  ], (err, data) => {
    if (err) return next(err);
    const trips = helpers.mergeTripsAndVehicles(data[0], data[1]);
    const tripsAsArray = trips.map(helpers.tripToArray);

    tripsAsArray.unshift(helpers.fieldNames());
    res.setHeader('Content-disposition', 'attachment; filename=trips.csv');
    return res.csv(tripsAsArray);
  });
};
