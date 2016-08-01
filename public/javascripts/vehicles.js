_.templateSettings = {
  interpolate: /\{\{(.+?)\}\}/g
};

var vehicles;
var vehicleTemplate = _.template($('#singleVehicle').html());


fetchVehicles(renderVehicles);


$('#refresh').click(function() {
  clearCache();
  deleteData();
  fetchVehicles(renderVehicles);
});


function deleteData() {
  $('#vehicles').empty();
}


function renderVehicles(results) {
  vehicles = results;
  $('#vehicles').empty();

  fetchTrips(tripsByVehicle);
}


function tripsByVehicle(trips) {
  var totals = d3.nest()
    .key(function(d) { return d.vehicle.url; })
    .rollup(summarizeData)
    .entries(trips);

  vehicles.forEach(function(vehicle) {
    vehicle.color = vehicle.color || '#999999';

    var total = _.find(totals, function(item) { return item.key === vehicle.url; }) || {values: {}};

    _.extend(vehicle, {
      distance_mi: formatDistance(mToMi(total.values.distance_m)),
      duration: formatDurationMinutes(total.values.duration_s),
      fuel_cost_usd: formatFuelCost(total.values.fuel_cost_usd),
      fuel_volume_usgal: formatFuelVolume(total.values.fuel_volume_usgal),
      trip_count: formatTripCount(total.values.trip_count)
    });

    $(vehicleTemplate(vehicle))
      .data('vehicle', vehicle)
      .appendTo('#vehicles');
  });
}
