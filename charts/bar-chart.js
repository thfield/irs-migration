import * as d3 from 'd3'
import rebind from './rebind.js'

export default function barChart() {
  let margin = {top: 10, right: 10, bottom: 30, left: 50},
      width = 960,
      height = 500

  let x = d3.scaleBand()
            .range([0, width])
            .padding(0.1)
  let y = d3.scaleLinear()
            .range([height, 0])

  let xAxis = d3.axisBottom().scale(x)
  let yAxis = d3.axisLeft().scale(y)

  var xAxisLabel = ''
  var yAxisLabel = ''

  let defaultColor = '#2a74bd'

  function chart(selection) {
    selection.each(function(data) {
      // expecting data to look like {x:string, y:number, color:string}

      // Update the x-scale.
      x   .domain( data.map(d => d.x) )
          .range([0, width - margin.left - margin.right])

      // Update the y-scale.
      y   .domain( [0, d3.max(data, d => d.y )] )
          .range([height - margin.top - margin.bottom, 0])

      // Select the svg element, if it exists.
      var svg = d3.select(this).selectAll("svg").data([data]);

      // Otherwise, create the skeletal chart.
      var gEnter = svg.enter().append("svg")
          .attr("width", width)
          .attr("height", height)
        .append("g")
        .merge(svg)


      gEnter.append("g").attr("class", "x axis");
      gEnter.append("g").attr("class", "y axis");
      gEnter.append("g").attr("class", "bars");

      // Update the inner dimensions.
      gEnter
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      // Update the bars
      let t = d3.transition().duration(1000).ease(d3.easePoly)

      var bars = gEnter.select(".bars").selectAll(".bar").data(data);
      bars.enter().append("rect").attr('class', 'bar')
      .merge(bars)
          .attr("x", function(d) { return x(d.x) })
          .attr("width", x.bandwidth())
          .attr("y", function(d) { return y(0) })
          .attr("height", function(d) { return height - margin.top - margin.bottom - y(0) })
          .attr("fill", function(d){ return d.color || defaultColor })
        .transition(t)
          .attr("y", function(d) { return y(d.y) })
          .attr("height", function(d) { return height - margin.top - margin.bottom - y(d.y) })


      bars.exit().transition(t)
          .attr("y", function(d) { debugger;return y(0) })
          .attr("height", function(d) { return height - margin.top - margin.bottom - y(0) })
          .remove()




      // Update the x-axis.
      gEnter.select(".x.axis")
          .attr("transform", "translate(0," + y.range()[0] + ")")
          .call(xAxis)
        .selectAll("text")
          .attr("y", 0)
          .attr("x", 9)
          .attr("dy", ".35em")
          .attr("transform", "rotate(90)")
          .style("text-anchor", "start");
      svg.selectAll('.xlabel').remove()
      svg.append('text')
          .attr("transform", "translate(" + (width - margin.right) + "," + (height - 3) + ")")
          .attr('class', 'axis label xlabel')
          .style("text-anchor", "end")
          .text(xAxisLabel)

      // Update the y-axis.
      gEnter.select(".y.axis")
          .attr("transform", "translate(" + x.range()[0] + ",0)")
          .call(yAxis);
      svg.selectAll('.ylabel').remove()
      svg.append('text')
          .attr("transform", "translate(" + (margin.left + 10) + "," + (margin.top) + ")rotate(-90)")
          .attr('class', 'axis label ylabel')
          .style("text-anchor", "end")
          .text(yAxisLabel)
    })

  }

  chart.margin = function(_) {
    if (!arguments.length) return margin;
    for (let prop in _) {
      margin[prop] = _[prop];
    }
    return chart;
  };

  chart.width = function(_) {
    if (!arguments.length) return width;
    width = _;
    return chart;
  };

  chart.height = function(_) {
    if (!arguments.length) return height;
    height = _;
    return chart;
  };

  chart.colorRange = function(_) {
    if (!arguments.length) return color.range();
    color.range(_);
    return chart;
  };

  chart.colorDomain = function(_) {
    if (!arguments.length) return color.domain();
    color.domain(_);
    return chart;
  };

  chart.colorScale = function(_) {
    if (!arguments.length) return {domain: color.domain(), range: color.range()};
    color = _;
    return chart;
  };

  chart.xScale = function(_) {
    if (!arguments.length) return x;
    return chart;
  };
  chart.yScale = function(_) {
    if (!arguments.length) return y;
    return chart;
  };

  chart.xAxisLabel = function(_) {
    if (!arguments.length) return xAxisLabel;
    xAxisLabel = _;
    return chart;
  };

  chart.yAxisLabel = function(_) {
    if (!arguments.length) return yAxisLabel;
    yAxisLabel = _;
    return chart;
  };

  // Expose the axis' tickFormat method.
  rebind(chart, xAxis, "tickFormat", );
  rebind(chart, yAxis, "tickFormat");

  return chart;
}