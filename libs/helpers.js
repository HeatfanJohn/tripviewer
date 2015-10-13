var _ = require('underscore'),
    moment = require('moment-timezone');


exports.filterTrips = function(trips, trip_ids) {
  return _.filter(trips, function(trip) {
    return trip_ids.indexOf(trip.id) != -1;
  });
};


exports.sortByDate = function(trips) {
  return _.sortBy(trips, function(trip) {
    return -moment(trip.started_at).valueOf();
  });
};


exports.mergeTripsAndVehicles = function(trips, vehicles) {
  var vehicleObj = _.object(_.pluck(vehicles, 'url'), vehicles);

  return trips.map(function(trip) {
    trip.vehicle = vehicleObj[trip.vehicle];
    return trip;
  });
};


exports.fieldNames = function() {
  return [
    'Vehicle',
    'Start Location Name',
    'Start Location Lat',
    'Start Location Lon',
    'Start Location Accuracy (meters)',
    'Start Time',
    'End Location Name',
    'End Location Lat',
    'End Location Lon',
    'End Location Accuracy (meters)',
    'End Time',
    'Path',
    'Distance (mi)',
    'Duration (seconds)',
    'Hard Accelerations',
    'Hard Brakes',
    'Duration Over 80 mph (secs)',
    'Duration Over 75 mph (secs)',
    'Duration Over 70 mph (secs)',
    'Fuel Cost (USD)',
    'Fuel Volume (l)',
    'Average MPG',
    'Tags'
  ];
};


exports.tripToArray = function(t) {
  return [
    formatVehicle(t.vehicle),
    (t.start_address) ? t.start_address.name : '',
    t.start_location.lat,
    t.start_location.lon,
    t.start_location.accuracy_m,
    t.started_at,
    (t.end_address) ? t.end_address.name : '',
    t.end_location.lat,
    t.end_location.lon,
    t.end_location.accuracy_m,
    t.ended_at,
    t.path,
    m_to_mi(t.distance_m),
    t.duration_s,
    t.hard_accels,
    t.hard_brakes,
    t.duration_over_80_s,
    t.duration_over_75_s,
    t.duration_over_70_s,
    formatFuelCost(t.fuel_cost_usd),
    t.fuel_volume_l,
    t.average_mpg,
    t.tags.join(',')
  ];
};


function formatVehicle(v) {
  if(!v) {
    return '';
  } else {
    return [(v.year || ''), (v.make || ''), (v.model || '')].join(' ');
  }
}


function m_to_mi(distance) {
  //convert from m to mi
  return (distance / 1609.34).toFixed(2);
}


function formatFuelCost(fuelCost) {
  return fuelCost ? '$' + fuelCost.toFixed(2) : '';
}
