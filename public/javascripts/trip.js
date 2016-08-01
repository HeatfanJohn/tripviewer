_.templateSettings = {
  interpolate: /\{\{(.+?)\}\}/g
};

var tripTemplate = _.template($('#singleTrip').html());

if (tripId) {
  fetchTrip(tripId, renderTrip);
}


function renderTrip(trip) {
  $('#trip').append(tripTemplate(trip));
  drawMap(trip);
}


$('#trip').on('change', '.business-tag input', function() {
  if ($(this).is(':checked')) {
    tagTrip(tripId, 'business');
  } else {
    untagTrip(tripId, 'business');
  }
});
