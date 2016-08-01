_.templateSettings = {
  interpolate: /\{\{(.+?)\}\}/g
};

var trips;
var tripTemplate = _.template($('#tripTile').html());
var tripTableTemplate = _.template($('#tripTable').html());
var tripTableHeader = _.template($('#tripTableHeader').html());

// Fetch trips
fetchTrips(renderTrips);


// Postpone drawing maps until we need them
$(window).scroll(drawMaps);


$('#refresh').click(function() {
  clearCache();
  deleteData();
  fetchTrips(renderTrips);
});


$('.display-type a').click(function() {
  sessionStorage.setItem('viewType', $(this).data('type'));
  renderTrips();
  return false;
});


$('#trips').on('change', '#selectall', function() {
  if ($(this).is(':checked')) {
    selectAll();
  } else {
    selectNone();
  }
});


$('#trips').on('change', '.trip.table .select-trip', function() {
  if ($('.trip.table .select-trip').length === $('.trip.table .select-trip:checked').length) {
    selectAll();
  } else {
    selectSome();
  }
});


$('#trips').on('change', '.business-tag', function() {
  var tripId = $(this).parents('.trip').data('trip_id');
  if ($(this).is(':checked')) {
    tagTrip(tripId, 'business');
  } else {
    untagTrip(tripId, 'business');
  }
});


$('#csv, #json').click(function() {
  var exportType = this.id;
  var viewType = sessionStorage.getItem('viewType');
  var href = '/download/trips.' + exportType;
  if (viewType === 'table') {
    var tripIds = $('.trip.table .select-trip:checked').map(function() {
      return $(this).parents('.trip').data('trip_id');
    }).get();

    href += '?trip_ids=' + tripIds.join(',');
  }
  $(this).attr('href', href);
});


function deleteData() {
  $('#trips').empty();
}


function selectAll() {
  $('#trips .trip .select-trip').each(function(idx, checkbox) {
    $(checkbox).prop('checked', true);
  });
  $('#selectall').prop('checked', true);
  $('#export span').text('Export All');
}


function selectSome() {
  $('#selectall').prop('checked', false);
  $('#export span').text('Export Selected');
}


function selectNone() {
  $('#selectall').prop('checked', false);
  $('#export span').text('Export Selected');
  $('#trips .trip .select-trip').each(function(idx, checkbox) {
    $(checkbox).prop('checked', false);
  });
}


function renderTrips() {
  var viewType = sessionStorage.getItem('viewType') || 'tile';

  $('.display-type [data-type="' + viewType + '"]')
    .addClass('active')
    .siblings().removeClass('active');

  $('#trips')
    .empty()
    .removeClass()
    .addClass(viewType);

  if (viewType === 'tile') {
    trips.forEach(function(trip) {
      $('#trips').append($(tripTemplate(trip)).data('trip', trip));
    });
    selectAll();
  } else if (viewType === 'table') {
    $('#trips').append(tripTableHeader());

    trips.forEach(function(trip) {
      $('#trips').append(tripTableTemplate(trip));
    });
  }
  drawMaps();
  hideLoading();
}
