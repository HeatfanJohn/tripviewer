var trips;
var weekly;

fetchTrips(processTrips);


$('.graph-buttons button').click(function() {
  var type = $(this).data('graph-type');
  $(this).addClass('active').siblings().removeClass('active');
  drawGraph(prepData(type));
});


$('#refresh').click(function() {
  clearCache();
  deleteCharts();
  fetchTrips(processTrips);
});


function deleteCharts() {
  $('#graphs .graph').empty();
  $('#overall li span').empty();
}


function getEmpty() {
  return {distance_m: 0, duration_s: 0, trip_count: 0, fuel_volume_usgal: 0, fuel_cost_usd: 0};
}


function processTrips(trips) {
  var summaryListTemplate = _.template($('#summaryList').html());

  weekly = d3.nest()
    .key(function(d) { return moment(d.started_at).format('YYYY w'); })
    .rollup(summarizeData)
    .entries(trips);

  weekly = weekly.reverse();

  var totals = d3.nest()
    .rollup(summarizeData)
    .entries(trips);

  $('#overall .panel-body').html(summaryListTemplate(totals));
  drawGraph(prepData('distance'));
}


function prepData(type) {
  var graphData = {};
  var formatter;
  if (type === 'distance') {
    formatter = function(d) {
      return parseFloat(formatDistance(mToMi(d.values.distance_m)));
    };
    graphData.yAxisLabel = 'Distance (mi)';
    graphData.unitFomatter = function(d) { return d.value + ' miles'; };
  } else if (type === 'duration_s') {
    formatter = function(d) {
      return formatDurationHours(d.values.duration_s);
    };
    graphData.yAxisLabel = 'Duration (hours)';
    graphData.unitFomatter = function(d) { return d.value + ' hours'; };
  } else if (type === 'trip_count') {
    formatter = function(d) {
      return d.values.trip_count;
    };
    graphData.yAxisLabel = 'Trip Count';
    graphData.unitFomatter = function(d) { return d.value + ' trips'; };
  } else if (type === 'fuel_cost_usd') {
    formatter = function(d) {
      return d.values.fuel_cost_usd;
    };
    graphData.yAxisLabel = 'Fuel Cost (USD)';
    graphData.unitFomatter = function(d) { return '$' + formatFuelCost(d.value); };
  } else if (type === 'fuel_volume_usgal') {
    formatter = function(d) {
      return d.values.fuel_volume_usgal;
    };
    graphData.yAxisLabel = 'Fuel Volume (gal)';
    graphData.unitFomatter = function(d) { return formatFuelVolume(d.value) + ' gallons'; };
  }

  graphData.data = weekly.map(function(d) {
    return {
      value: formatter(d),
      key: moment(d.key, 'YYYY w').valueOf()
    };
  });

  return graphData;
}


function drawGraph(graphData) {
  $('#graphs .graph').empty();

  var margin = {top: 20, right: 40, bottom: 30, left: 50};
  var width = 600 - margin.left - margin.right;
  var height = 222 - margin.top - margin.bottom;
  var bisectDate = d3.bisector(function(d) { return d.key; }).left;

  var x = d3.time.scale()
    .domain([_.first(graphData.data).key, _.last(graphData.data).key])
    .range([0, width]);

  var y = d3.scale.linear()
    .range([height, 0])
    .domain([0, d3.max(_.pluck(graphData.data, 'value'))]);

  var xAxis = d3.svg.axis()
    .scale(x)
    .orient('bottom')
    .ticks(d3.time.month)
    .tickFormat(d3.time.format('%b'));

  var yAxis = d3.svg.axis()
    .scale(y)
    .orient('left')
    .ticks(8);

  var line = d3.svg.line()
    // .interpolate('cardinal')
    .x(function(d) { return x(d.key); })
    .y(function(d) { return y(d.value); });

  var svg = d3.select('#graphs .graph').append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  svg.append('g')
    .attr('class', 'x axis')
    .attr('transform', 'translate(0,' + height + ')')
    .call(xAxis);

  svg.append('g')
    .attr('class', 'y axis')
    .call(yAxis)
    .append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', 6)
    .attr('dy', '-3.2em')
    .style('text-anchor', 'end')
    .text(graphData.yAxisLabel);

  svg.append('path')
    .datum(graphData.data)
    .attr('class', 'line')
    .attr('d', line);

  var focus = svg.append('g')
    .attr('class', 'focus')
    .style('display', 'none');

  focus.append('circle')
    .attr('r', 4.5);

  focus.append('text')
    .attr('class', 'value')
    .attr('x', 9)
    .attr('dy', '.35em');

  focus.append('text')
    .attr('class', 'key')
    .attr('x', 9)
    .attr('dy', '1.3em');

  svg.append('rect')
    .attr('class', 'overlay')
    .attr('width', width)
    .attr('height', height)
    .on('mouseover', function() { focus.style('display', null); })
    .on('mouseout', function() { focus.style('display', 'none'); })
    .on('mousemove', mousemove);

  function mousemove() {
    var x0 = x.invert(d3.mouse(this)[0]);
    var i = bisectDate(graphData.data, x0);
    var d0 = graphData.data[i - 1];
    var d1 = graphData.data[i];

    var d = !d0 || x0 - d0.key > d1.key - x0 ? d1 : d0;
    focus.attr('transform', 'translate(' + x(d.key) + ',' + y(d.value) + ')');
    focus.select('text.value').html(graphData.unitFomatter(d));
    focus.select('text.key').html(moment(d.key).format('MMM D, YYYY'));
  }
}
