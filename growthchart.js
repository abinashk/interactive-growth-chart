//set the margins
var margin = {top: 20, right: 150, bottom: 50, left: 50},
    width = $("#graphic").parent().width() - margin.left - margin.right,
    height = $("#graphic").parent().width() * 0.5 - margin.top - margin.bottom;


// number formatting
var numType = d3.format(".2f");
var currencyType = d3.format("$,.2f");

String.prototype.capitalizeFirstLetter = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

//get months in data
var getDataKeys = function(d) {
    return d3.keys(d).filter(function(key) { return (key !== "goal"); });
};

//color function pulls from array of colors stored in color.js
var color = d3.scale.category10();

//define the approx. number of x scale ticks
var xscaleticks = 4;

//return goal amount by today
var goalByToday = function(d){
    return numType( data.goal * parseDate(d.date).getDate() /
      new Date(parseDate(d.date).getYear(), parseDate(d.date).getMonth(), 0).getDate());
};

var getXAxisTickVaues = function(){
    return [1, 7, 14, 21, 28];
};

//some date util functions and variables
var parseDate = d3.time.format("%Y-%m-%d").parse;
var formatDate = d3.time.format("%b %d, '%y");
var getCurrentMonthMaxDay = function(){
    var today = new Date();
    var lastDayOfMonth = new Date(today.getFullYear(), today.getMonth()+1, 0).getDate();
    return lastDayOfMonth;
};

var monthNames = [
                    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
                 ];

var lastDayOfCurrentMonth = function() {
    var today = new Date();
    var lastDayOfMonth = new Date(today.getFullYear(), today.getMonth()+1, 0);
    return lastDayOfMonth.toISOString().substring(0, 10);
};

var firstDayOfCurrentMonth = function() {
    var today = new Date();
    var firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    // console.log(firstDayOfMonth.toISOString().substring(0, 10));
    return firstDayOfMonth.toISOString().substring(0, 10);
};


//create an SVG
var svg = d3.select("#graphic").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .style("position", "relative");

// #TODO refactor into functional divisions
function redraw() {
    //get color codes set for each monthly series
    color.domain(d3.keys(data).filter(function(key) { return (key !== "goal"); }));

    var linedata = color.domain().map(function(name) {
        return { name: name, values: data[name] };
    });


    //make an empty variable to stash the last values into to sort the legend
    var lastvalues=[];

    //x and y scales
    var x = d3.scale.linear()
        .domain([
          d3.min(linedata, function(c) {
            return d3.min(c.values, function(v) {
              return parseDate(v.date).getDate();
            });
          }),
          d3.max(linedata, function(c) {
            return d3.max(c.values, function(v) {
              return parseDate(v.date).getDate();
            });
          })
        ])
        .range([0, width]);

    var y = d3.scale.linear()
        .domain([
          d3.min(linedata, function(c) {
            return d3.min(c.values, function(v) {
              return v.value;
            });
          }),
          d3.max(linedata, function(c) {
            return d3.max(c.values, function(v) {
              return v.value;
            });
          })
        ])
        .range([height, 0]);

    //draw lines
    var line = d3.svg.line()
        .x(function(d) {
          return x(parseDate(d.date).getDate());
        })
        .y(function(d) {
          return y(d.value);
        });


    //create and draw the x axis
    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .tickSize(0-height)
        .tickValues(getXAxisTickVaues())
        .outerTickSize(0);


    svg.append("svg:g")
        .attr("class", "x axis");

    //create and draw the y axis
    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .tickSize(0-width)
        .tickFormat(d3.format("s"));

    svg.append("svg:g")
        .attr("class", "y axis");

    //bind the data
    var thegraph = svg.selectAll(".thegraph")
        .data(linedata);

    //append a g tag for each line and give it a unique ID based on the column name of the data
    var thegraphEnter=thegraph.enter().append("g")
        .attr("class", "thegraph")
        .attr('id',function(d){
          return d.name+"-line";
        })
        .style("stroke-width",2.5);


    //append the line to the graph
    thegraphEnter.append("path")
        .attr("class", "line")
        .style("stroke", function(d) {
          return color(d.name);
        })
        .attr("d", function(d) {
          return line(d.values[0]);
        })
        .transition()
        // .duration(2000)
        .attrTween('d',function (d){
            var interpolate = d3.scale.quantile()
                .domain([0,1])
                .range(d3.range(1, d.values.length+1));
            return function(t){
                return line(d.values.slice(0, interpolate(t)));
            };
        });

    //append the legend to the graph #TODO: change its design to what's in the requirement
    var legend = svg.selectAll('.legend')
        .data(linedata);

    //create a scale to pass the legend items through
    var legendscale = d3.scale.ordinal()
                              .domain(lastvalues)
                              .range([0,30,60,90,120,150,180,210]);

    var legendEnter = legend.enter()
                            .append('g')
                            .attr('class', 'legend')
                            .attr('id',function(d){ return d.name; })
                            .on('click', function (d) {
                                if($(this).css("opacity") == 1){
                                    d3.select(document.getElementById(this.id +"-line"))
                                        .transition()
                                        .style("opacity",0)
                                        .style("display",'none');

                                    d3.select(this)
                                        .attr('fakeclass', 'fakelegend')
                                        .style ("opacity", 0.2);
                                }
                                else {
                                    d3.select(document.getElementById(this.id +"-line"))
                                        .style("display", "block")
                                        .style("opacity",1);
                                    d3.select(this)
                                        .attr('fakeclass','legend')
                                        .style ("opacity", 1);}
                            });

    //add the circles to the created legend container
    legendEnter.append('circle')
        .attr('cx', width +20)
        .attr('cy', function(d){
          return legendscale(d.values[d.values.length-1].value);
        })
        .attr('r', 7)
        .style('fill', function(d) {
            return color(d.name);
        });

    //add the legend text
    legendEnter.append('text')
        .attr('x', width+35)
        .attr('y', function(d){
          return legendscale(d.values[d.values.length-1].value);
        })
        .text(function(d){
          return d.name.split("_")[0].capitalizeFirstLetter();
        });

    //set variable for updating the graph
    var thegraphUpdate = d3.transition(thegraph);

    //for legend items
    var legendUpdate=d3.transition(legend);

    legendUpdate.select("circle")
        .attr('cy', function(d, i){
          return legendscale(d.values[d.values.length-1].value);
        });

    legendUpdate.select("text")
        .attr('y',  function (d) {
          return legendscale(d.values[d.values.length-1].value);
        });


     //update the axes
    svg.select(".y.axis")
        .call(yAxis);

    svg.select(".x.axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    var focus = svg.append("g")
            .style("display", "none")
            .style("position", "relative")
            .style("z-index", 9999);

    wrapper = focus.append("g")
        .attr("class", "wrapper");

    //vertical line for tracking mouse hover
    focus.append("line")
        .attr("class", "x")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", 0)
        .attr("y2", height)
        .attr("stroke-width", 0.5)
        .attr("stroke", "grey");

    tiptext = wrapper.append('foreignObject')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', 100)
                .attr('height', 150)
                .append("xhtml:body");

    $.ajax({
        url : "tooltip.html",
        dataType: 'text',
        success : function(result){
            tiptext.html(result);
        }
    });


    //append the rectangle to capture mouse
    svg.append("rect")
        .attr("width", width)
        .attr("height", height)
        .style("fill", "none")
        .style("pointer-events", "all")
        .on("mouseover", function() {
          focus.style("display", null);
        })
        .on("mouseout", function() {
          focus.style("display", "none");
        })
        .on("mousemove", mousemove);

    //handle mouse movement over the graph event
    function mousemove() {
        var x0 = x.invert(d3.mouse(this)[0]);
        var y0 = y.invert(d3.mouse(this)[1]);
        var width0 = x.invert(focus.select("g.wrapper").attr("width"));
        if (width0 > x0){
            width0 = -1;
        }

        d3.select("#tooltipTitle")
          .html((currencyType(data.goal_growth[1].value * Math.round(x0) /
            Math.round(x.invert(width))))
          );
        keys = getDataKeys(data);
        keys.forEach(function (value, i) {
            var x = data[value][Math.round(x0)];
            if (typeof x != 'undefined'){
                dateObj = parseDate(x.date);
                dateStr = monthNames[dateObj.getMonth()];
                d3.select("#tooltipMetricName" + (i+1))
                  .html(dateStr);
                d3.select("#tooltipMetricValue"+ (i+1))
                  .html(currencyType(x.value));
            }
        });

        focus.select("g.wrapper")
            .attr("transform",
                  "translate(" + x(Math.round(x0)) + "," + y(y0) + ")");

        focus.select("line.x")
            .attr("transform",
                  "translate(" + x(Math.round(x0)) + ")");

        d3.select("#current-total-growth")
          .html(currencyType(data.goal_growth[1].value * Math.round(x0) /
            Math.round(x.invert(width))));
    }

//end of the redraw function
}


//import the data
d3.json("growth_chart_data.json", function(error, json) {
    if (error) return console.warn(error);
    data = json;
    data.goal_growth = [
                          { "value":0, "date":firstDayOfCurrentMonth()},
                          { "value":data.goal, "date":lastDayOfCurrentMonth()}
                        ];
    redraw();
});
