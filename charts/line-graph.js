import * as d3 from 'd3'
import rebind from './rebind.js'
// TODO: add axis title methods

export default function lineGraph () {
  let margin = {top: 10, right: 10, bottom: 30, left: 50}
  let width = 960
  let height = 500

  let xProp = 'x'
  let yProp = 'y'

  let x = d3.scaleLinear()
  let y = d3.scaleLinear()
  let xAxis = d3.axisBottom().scale(x)
  let yAxis = d3.axisLeft().scale(y)

  let xAxisLabel = ''
  let yAxisLabel = ''

  let color = '#2a74bd'

  let linepath = d3.line()
      .x(function (d) { return x(d[xProp]) })
      .y(function (d) { return y(d[yProp]) })

  function chart (selection) {
    selection.each(function (data) {
      /* data is expected to be an array of objects like: {x:num, y:num, id:str} where id is optional */
      // if (false) {
      if (typeof data[0][xProp] !== 'number') {
        x = d3.scaleBand()
        x.domain(data.map(function (d) { return d[xProp] }))
        xAxis.scale(x).tickSize(0)
        x.range([0, width - margin.left - margin.right])
      } else {
        // Update the x-scale.
        x.domain(d3.extent(data, function (d) { return d[xProp] }))
        x.range([0, width - margin.left - margin.right])
      }

      // Update the y-scale.
      y.domain(d3.extent(data, function (d) { return d[yProp] }))
       .range([height - margin.top - margin.bottom, 0])

      // Select the svg element, if it exists.
      let svg = d3.select(this).selectAll('svg').data([data])

      let gEnter = svg.enter().append('svg')
          .attr('width', width)
          .attr('height', height)
        .append('g')
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
        .merge(svg)

      gEnter.append('g').attr('class', 'x axis')
      gEnter.append('g').attr('class', 'y axis')
      gEnter.append('path').datum(data).attr('class', 'line')

      // Update the line.
      gEnter.select('.line')
          .attr('d', linepath)
          .attr('stroke', color)
          .attr('transform', 'translate(' + 45 + ',0)') // TODO: translate along x axis if using scaleBand

      // Update the x-axis.
      gEnter.select('.x.axis')
          .attr('transform', 'translate(0,' + y.range()[0] + ')')
          .call(xAxis)
      svg.selectAll('.xlabel').remove()
      svg.append('text')
          .attr('transform', 'translate(' + (width - margin.right) + ',' + (height - 3) + ')')
          .attr('class', 'axis label xlabel')
          .style('text-anchor', 'end')
          .text(xAxisLabel)

      // Update the y-axis.
      gEnter.select('.y.axis')
          .attr('transform', 'translate(' + x.range()[0] + ',0)')
          .call(yAxis)
      svg.selectAll('.ylabel').remove()
      svg.append('text')
          .attr('transform', 'translate(' + (margin.left + 10) + ',' + (margin.top) + ')rotate(-90)')
          .attr('class', 'axis label ylabel')
          .style('text-anchor', 'end')
          .text(yAxisLabel)
    })
  }

  chart.margin = function (_) {
    if (!arguments.length) return margin
    for (let prop in _) {
      margin[prop] = _[prop]
    }
    return chart
  }

  chart.width = function (_) {
    if (!arguments.length) return width
    width = _
    return chart
  }

  chart.height = function (_) {
    if (!arguments.length) return height
    height = _
    return chart
  }

  chart.color = function (_) {
    if (!arguments.length) return color
    color = _
    return chart
  }

  chart.xScale = function (_) {
    if (!arguments.length) return x
    x = _
    return chart
  }
  chart.yScale = function (_) {
    if (!arguments.length) return y
    y = _
    return chart
  }

  chart.xProp = function (_) {
    if (!arguments.length) return xProp
    xProp = _
    return chart
  }
  chart.yProp = function (_) {
    if (!arguments.length) return yProp
    yProp = _
    return chart
  }

  chart.xAxisLabel = function (_) {
    if (!arguments.length) return xAxisLabel
    xAxisLabel = _
    return chart
  }

  chart.yAxisLabel = function (_) {
    if (!arguments.length) return yAxisLabel
    yAxisLabel = _
    return chart
  }

  // Expose the axis' tickFormat method.
  rebind(chart, xAxis, 'tickFormat')
  rebind(chart, yAxis, 'tickFormat')

  return chart
}
