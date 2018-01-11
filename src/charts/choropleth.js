import * as d3 from 'd3'
import * as topojson from 'topojson-client'

export default function choroplethChart () {
  let data = [] // data is an array of k-v pairs looking like: { ${datakey}: foo, val: bar }
  let topoData // topojson
  let topoFiltered = {} // filtered clone of topoData used to draw/update
  let basemap // second topojson to draw as basemap
  let basemapClassName // classname for basemap path

  let updateData // function that redraws after data is updateData
  let basemapDraw // function that redraws map with basemap data

  let margin = {top: 0, right: 0, bottom: 0, left: 0}
  let width = 960
  let height = 500

  let geokey // property name that uniquely identifies the topopjson object
  let geoname // topojson object property key for pretty printing mouseover tooltip
  let datakey // property name that uniquely identifies the data object
  let topoObjectName // property name of topojson object to be drawn
  let topoObjectClassName // classname to appply to drawn path from topojson

  let color// = d3.scaleLinear()
        // .range(['#eee', '#333'])

  /* tooltip requires the class styles from style.css and that a div#tooltip exist on the page */
  let tooltip = d3.select('#tooltip') // TODO: generate this div inside chart constructor,
  let path = d3.geoPath()
  let active = d3.select(null)

  /** @function ttOver
   * handler for map interaction on mouseover event, attached to path lineshapes
   */
  function ttOver (d) {
    d3.select(this).classed('highlight', true)
  }
  /** @function ttOut
   * handler for map interaction on mouseout event, attached to path lineshapes
   */
  function ttOut (d) {
    d3.select(this).classed('highlight', false)
    tooltip.style('display', 'none')
  }
  /** @function ttMove
   * handler for map interaction on mousemove event, attached to path lineshapes
   */
  function ttMove (d) {
    let title = geoname || geokey
    let htmlstring = `<strong>${d.properties[title]}</strong>: <span>${d3.format(',d')(d.properties.val)}</span>`
    tooltip
        .style('left', d3.event.pageX - 50 + 'px')
        .style('top', d3.event.pageY + 20 + 'px')
        .style('display', 'inline-block')
        .html(htmlstring)
  }

  function chart (selection) {
    selection.each(function () {
      // Select the svg element, if it exists.
      var svg = d3.select(this).selectAll('svg').data([data])

      // Otherwise, create the skeletal chart.
      let thesvg = svg.enter().append('svg')
          .attr('width', width)
          .attr('height', height)
      var gEnter = thesvg
        .append('g')

      /* zooming functions */
      let zoom = d3.zoom()
        .scaleExtent([1, 8])
        .on('zoom', function () {
          gEnter.style('stroke-width', 1.5 / d3.event.transform.k + 'px')
          gEnter.attr('transform', d3.event.transform)
        })

      thesvg.on('click', stopped, true)
        .call(zoom)

      /** @function clicked
       * handler function for clicking on county lineshape:
       * zooms in on county on initial click,
       * resets zoom when clicked on same county
       */
      function clicked (d) {
        if (active.node() === this) return reset()
        active.classed('active', false)
        active = d3.select(this).classed('active', true)

        let width = thesvg.attr('width')
        let height = thesvg.attr('height')
        let bounds = path.bounds(d)
        let dx = bounds[1][0] - bounds[0][0]
        let dy = bounds[1][1] - bounds[0][1]
        let x = (bounds[0][0] + bounds[1][0]) / 2
        let y = (bounds[0][1] + bounds[1][1]) / 2
        let scale = Math.max(1, Math.min(8, 0.9 / Math.max(dx / width, dy / height)))
        let translate = [width / 2 - scale * x, height / 2 - scale * y]

        thesvg.transition()
          .duration(750)
          .call(zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale))
      }

      /** @function reset
       * handler function for resetting zoom, called by clicked()
       */
      function reset () {
        active.classed('active', false)
        active = d3.select(null)
        thesvg.transition()
            .duration(750)
            .call(zoom.transform, d3.zoomIdentity)
      }

      /** @function stopped
       * stops zooming on mouse click
       */
      function stopped () {
        if (d3.event.defaultPrevented) d3.event.stopPropagation()
      }

      /* end zooming functions */

      gEnter.append('g').attr('class', topoObjectClassName)

      // Update the inner dimensions.
      gEnter.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

      updateData = function () {
        // set the color scales
        // let extent = d3.extent(data, d => d.val)
        // color.domain(extent)

        // filter topoData by presence in data
        topoFiltered.objects[topoObjectName].geometries.length = 0
        data.forEach(function (e) {
          let dat = topoData.objects[topoObjectName].geometries.find(function (g) { return e[datakey] === g.properties[geokey] })
          if (dat) {
            dat.properties.val = e.val
            topoFiltered.objects[topoObjectName].geometries.push(dat)
          }
        })

        // Select topoobjects, use key function: https://bost.ocks.org/mike/constancy/
        let topoObject = gEnter.select(`.${topoObjectClassName}`)
          .selectAll('path')
            .data(topojson.feature(topoFiltered, topoFiltered.objects[topoObjectName]).features, function (k) {
              return k.properties[geokey]
            })

        topoObject.enter().append('path')
          .attr('d', path)
          .attr('stroke', '#fff')
          .attr('id', function (d) { return d.geoid })
          .on('mouseover', ttOver)
          .on('mouseout', ttOut)
          .on('mousemove', ttMove)
          .on('click', clicked)
        .merge(topoObject)
          .attr('fill', function (d) {
            return d.properties.val ? color(d.properties.val) : '#fff'
          })
        topoObject.exit().remove()
      }

      basemapDraw = function () {
        gEnter.append('g').attr('class', 'basemap')
            .append('path')
              .attr('stroke-width', 0.5)
              .attr('stroke', '#000')
              .attr('fill', 'none')
              .attr('class', basemapClassName)
              .attr('d', path(basemap))
      }

      basemapDraw()
      updateData()
    })
  }

  chart.data = function (_) {
    if (!arguments.length) return data
    data = _
    if (typeof updateData === 'function') updateData()
    return chart
  }

  chart.topoData = function (_) {
    if (!arguments.length) return topoData
    topoData = _
    topoFiltered = JSON.parse(JSON.stringify(_)) // deep clone
    return chart
  }

  chart.basemap = function (_) {
    if (!arguments.length) return basemap
    basemap = _
    if (typeof basemapDraw === 'function') basemapDraw()
    return chart
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

  chart.colorScale = function (_) {
    if (!arguments.length) return [color.domain(), color.range()]
    color = _
    return chart
  }

  chart.colorDomain = function (_) {
    if (!arguments.length) return color.domain()
    color.domain(_)
    return chart
  }

  chart.colorRange = function (_) {
    if (!arguments.length) return color.range()
    color.range(_)
    return chart
  }

  chart.basemapClassName = function (_) {
    if (!arguments.length) return basemapClassName
    basemapClassName = _
    return chart
  }

  chart.geoname = function (_) {
    if (!arguments.length) return geoname
    geoname = _
    return chart
  }

  chart.geokey = function (_) {
    if (!arguments.length) return geokey
    geokey = _
    return chart
  }

  chart.datakey = function (_) {
    if (!arguments.length) return datakey
    datakey = _
    return chart
  }

  chart.topoObjectName = function (_) {
    if (!arguments.length) return topoObjectName
    topoObjectName = _
    return chart
  }

  chart.topoObjectClassName = function (_) {
    if (!arguments.length) return topoObjectClassName
    topoObjectClassName = _
    return chart
  }

  return chart
}
