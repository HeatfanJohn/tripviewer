function showLoading() {
  $('.loading').fadeIn();
}


function hideLoading() {
  $('.loading').fadeOut('fast');
}


function showAlert(msg, type) {
  $('#alert').html(msg).removeClass().addClass('alert alert-' + (type || 'info')).fadeIn();
}


function hideAlert() {
  $('#alert').fadeOut();
}


function formatDuration(s) {
  var duration = moment.duration(s, 'seconds');
  var hours = duration.asHours() >= 1 ? Math.floor(duration.asHours()) + ' h ' : '';
  var minutes = duration.minutes() + ' min';
  return hours + minutes;
}


function formatDurationMinutes(s) {
  return moment.duration(s, 'seconds').asMinutes().toFixed();
}


function formatDurationHours(s) {
  return moment.duration(s, 'seconds').asHours().toFixed();
}


function formatSpeeding(s) {
  if (!s || s < 30) {
    return '<i class="glyphicon glyphicon-ok"></i>';
  } else if (s / 60 > 60) {
    return moment.duration(s, 'seconds').asHours().toFixed(1);
  }

  return formatDurationMinutes(s);
}


function getSpeedingClass(s) {
  if (!s || s < 30) {
    return 'noSpeeding';
  } else if (s / 60 > 60) {
    return 'someSpeedingHours';
  }

  return 'someSpeedingMinutes';
}


function mToMi(distanceM) {
  return distanceM / 1609.34;
}


function lToUsgal(volumeL) {
  return volumeL * 0.264172;
}


function kmplToMpg(kmpl) {
  return kmpl * 2.35214583;
}


function formatDistance(distance) {
  if (Math.round(distance) >= 100) {
    return distance.toFixed(0);
  }

  return (distance || 0).toFixed(1);
}


function formatFuelCost(fuelCost) {
  return (fuelCost || 0).toFixed(2);
}


function formatFuelVolume(fuelVolume) {
  return (fuelVolume || 0).toFixed(1);
}


function formatMPG(kmpl) {
  var mpg = kmplToMpg(kmpl);
  return mpg ? mpg.toFixed(1) : '';
}


function cleanAddress(address) {
  if (!address) {
    address = {};
  }

  address.cleaned = address && address.name ? address.name.replace(/\d+, USA/gi, '') : '';
  address.multiline = formatAddressMultiline(address.cleaned);

  return address;
}


function formatAddressMultiline(cleaned) {
  var lines = cleaned.split(', ');

  if (lines.length > 2) {
    var first = lines.shift();
    cleaned = first + '<br>' + lines.join(', ');
  }
  return cleaned;
}


function formatDate(time, timezone) {
  try {
    return moment(time).tz(timezone).format('MMM D, YYYY');
  } catch (e) {
    return moment(time).format('MMM D, YYYY');
  }
}


function formatTime(time, timezone) {
  try {
    return moment(time).tz(timezone).format('h:mm A');
  } catch (e) {
    return moment(time).format('h:mm A');
  }
}


function formatDayOfWeek(time, timezone) {
  try {
    return moment(time).tz(timezone).format('dddd');
  } catch (e) {
    return moment(time).format('dddd');
  }
}


function formatTripCount(tripCount) {
  if (tripCount === 1) {
    return tripCount + ' Trip';
  }

  return (tripCount || 0) + ' Trips';
}


function isScrolledIntoView(elem) {
  var docViewTop = $(window).scrollTop();
  var docViewBottom = docViewTop + $(window).height();

  var elemTop = $(elem).offset().top;
  var elemBottom = elemTop + $(elem).height();

  return elemTop <= docViewBottom && elemBottom >= docViewTop;
}


function drawMaps() {
  $('.map').not('.leaflet-container').each(function(idx, map) {
    if (isScrolledIntoView(map)) {
      var trip = $(map).parents('.trip').data('trip');
      drawMap(trip);
    }
  });
}


function drawMap(trip) {
  // Setup mapbox
  L.mapbox.accessToken = mapboxAccessToken;

  var styleId = 'automatic.h5kpm228';
  var mapId = 'map' + trip.id;
  var map = L.mapbox.map(mapId, styleId);
  var start = [trip.start_location.lat, trip.start_location.lon];
  var end = [trip.end_location.lat, trip.end_location.lon];
  var lineStyle = {color: '#08b1d5', opacity: 0.9};
  var iconStyle = {
    iconSize: [25, 41],
    iconAnchor: [12, 40],
    popupAnchor: [0, -41],
    shadowUrl: '/images/marker-shadow.png',
    shadowSize: [41, 41],
    shadowAnchor: [12, 40]
  };
  var aIcon = L.icon(_.extend(iconStyle, {iconUrl: '/images/marker-a.png'}));
  var bIcon = L.icon(_.extend(iconStyle, {iconUrl: '/images/marker-b.png'}));
  var startPopupContent = trip.start_address.multiline + '<br>' + trip.started_at_date + '<br>' + trip.started_at_time;
  var endPopupContent = trip.end_address.multiline + '<br>' + trip.ended_at_date + '<br>' + trip.ended_at_time;
  var line;

  if (trip.path) {
    line = L.polyline(polyline.decode(trip.path), lineStyle);
  } else {
    line = L.polyline([start, end], lineStyle);
  }

  line.addTo(map);

  map.fitBounds(line.getBounds(), {padding: [10, 10]});

  L.marker(start, {title: 'Start Location', icon: aIcon})
    .bindPopup(startPopupContent)
    .addTo(map);

  L.marker(end, {title: 'End Location', icon: bIcon})
    .bindPopup(endPopupContent)
    .addTo(map);
}


function summarizeData(d) {
  var summary = {
    distance_m: d3.sum(d, function(d) { return +d.distance_m; }),
    duration_s: d3.sum(d, function(d) { return +d.duration_s; }),
    trip_count: d.length,
    fuel_volume_usgal: d3.sum(d, function(d) { return +d.fuel_volume_usgal; }),
    fuel_cost_usd: d3.sum(d, function(d) { return +d.fuel_cost_usd; })
  };
  summary.average_mpg = mToMi(summary.distance_m) / summary.fuel_volume_usgal;

  return summary;
}
