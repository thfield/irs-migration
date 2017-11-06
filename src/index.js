import './style.css'
import * as d3 from 'd3'
import 'd3-queue'
import * as d3Legend from 'd3-svg-legend'
import * as topojson from 'topojson'
import * as munge from './munge.js'
import barChart from '../charts/bar-chart.js'
import lineGraph from '../charts/line-graph.js'
import * as mapping from './mapping.js'
import {fullYear} from '../munge/utils/helpers.js'
import * as nesting from './nesting.js'

// TODO: tree-shake d3 dependencies
// TODO: better state management
// TODO: county lineshapes transition to circles
// TODO: net flow in-out
// TODO: state flow: in, out, delta
// TODO: use miso for data grouping? http://misoproject.com/dataset/
//     -re-munge data to contain column 'direction' = in||out

let fipsCounty = '06075'
let year = '1415'
let direction = 'in'

let colorSwatches = {
  in: ['#f7fcf5', '#e5f5e0', '#c7e9c0', '#a1d99b', '#74c476', '#41ab5d', '#238b45', '#006d2c', '#00441b'],
  out: ['#fff5f0', '#fee0d2', '#fcbba1', '#fc9272', '#fb6a4a', '#ef3b2c', '#cb181d', '#a50f15', '#67000d']
}

let statFullName = {
  n1: 'Number of Returns',
  n2: 'Number of Exemptions',
  agi: 'Total Adjusted Gross Income',
  meanAgi: 'Mean Adjusted Gross Income'
}

// switch path to build prod version
let path = '../data'
// let path = '.'
let dataPath = `${path}/${fipsCounty}/${fipsCounty}combined.csv`
let shapesPath = `${path}/${fipsCounty}/${fipsCounty}shapes.topojson`
let statesPath = `${path}/geo/states.topojson`
let fipsPath = `${path}/fipscodes.csv`

d3.queue()
  .defer(d3.csv, dataPath, function (row) {
    let meanAgi = +row.agi / +row.n1
    return Object.assign(row, {meanAgi: meanAgi})
  })
  .defer(d3.json, statesPath)
  .defer(d3.json, shapesPath)
  .defer(d3.csv, fipsPath, function (row) {
    return Object.assign(row, {id: row.statefp.concat(row.countyfp)})
  })
  .await(initialDraw)

function initialDraw (error, data, us, counties, fips) {
  if (error) { throw error }
  /**
    * fipsMap has mapping of:
    *  - state fips to state abbrev:
    *     {'06': 'CA'}
    *  - state+county fips to county data from d3.csvParse(fipscodes.csv):
    *      { '06075': {
    *          id: '06075',
    *          state: 'CA',
    *          statefp: '06',
    *          countyfp: '075',
    *          name: 'San Francisco County',
    *          type: 'H1
    *        }
    *      }
    */
  let fipsMap = new Map()
  fips.forEach(function (row) {
    fipsMap.set(row.id, row)
    fipsMap.set(row.statefp, row.state)
  })

  let nestedCountyData = nesting.county(data)
  let nestedStateData = nesting.state(data)
  let nestedStateDataByYear = nesting.stateByYear(data)

  /* *** set color scale *** */
  let color = d3.scaleQuantile()
    .range(colorSwatches[direction])
    .domain(munge.domainVals(nestedCountyData, direction, year, 'n1', fipsCounty))
  let radii = d3.scaleQuantile()
    .range([0, 2, 4, 6, 8, 10, 12, 15, 20, 25])
    .domain(color.domain())

  let directionSelector = document.querySelector('#direction')
  let statSelector = document.querySelector('#stat')
  let selectedYear = document.getElementById('selected-year')
  /* *** populate year selector *** */
  let years = nestedCountyData[0].values.map(d => d.key).sort()
  let yearSelector = document.getElementById('year-selector')
  yearSelector.max = years.length - 1
  yearSelector.value = years.length - 1
  selectedYear.innerHTML = munge.fullYear(years[years.length - 1])

  // /* *** populate state selector *** */
  let states = nestedStateDataByYear[0].values.map(d => d.key).filter(d => d < 58)
  let stateSelector = d3.select('#stateyear')
  stateSelector.selectAll('.stateoptions')
    .data(states).enter().append('option')
      .attr('value', (d) => d)
      .text((d) => fipsMap.get(d))

  /* *** populate statistic info *** */
  let inflow = getTotalReturns('in', year)
  let outflow = getTotalReturns('out', year)
  let nCounties = getNumCounties(direction, year)
  d3.select('#destination-counties')
    .text(nCounties)
  d3.select('#number-returns')
    .text(d3.format(',d')(inflow))
  d3.select('#net-flow')
    .text(d3.format(',d')(inflow - outflow))

  function getTotalReturns (direction, year) {
    return munge.getDirectionYearValues(nestedCountyData, direction, year).find(function (county) {
      return county.id === '96000'
    }).n1
  }

  function getNumCounties (direction, year) {
    return munge.getDirectionYearValues(nestedCountyData, direction, year).length
  }

  /* *** start map drawing *** */
  let mapSvg = d3.select('#map svg')
  let path = d3.geoPath()
  let tooltip = d3.select('#tooltip')

  let active = d3.select(null)
  let zoom = d3.zoom()
    .scaleExtent([1, 8])
    .on('zoom', zoomed)
  mapSvg
    .on('click', stopped, true)
    .call(zoom) // delete this line to disable free zooming
  let mapEls = mapSvg.append('g')
  let legendEl = mapSvg.append('g')
  /* *** draw legend *** */
  legendEl
    .attr('class', 'legendQuant')
    .attr('transform', 'translate(830,300)')
  let legend = d3Legend.legendColor()
    .labelFormat(d3.format(',d'))
    .title('')
    .titleWidth(100)
    .cells(7)
    .scale(color)
  mapSvg.select('.legendQuant')
    .call(legend)

  /* *** draw counties *** */
  let countymapel = mapEls.append('g')
        .attr('class', 'counties')
  countymapel.selectAll('path')
      .data(topojson.feature(counties, counties.objects.counties).features)
      .enter().append('path')
        .attr('d', path)
        .attr('stroke', '#fff')
        .attr('fill', function (d) {
          let num = getVal(d.properties.geoid, year, direction)
          return num === null ? '#fff' : color(num)
        })
        .attr('id', function (d) { return d.geoid })
        .attr('class', 'county')
        .on('mouseover', ttOver)
        .on('mousemove', ttMove)
        .on('mouseout', ttOut)
        .on('click', clicked)

  /* *** draw states *** */
  mapEls.append('path')
      .attr('stroke-width', 0.5)
      .attr('d', path(topojson.mesh(us, us.objects.states)))

  /** @function getVal
   * @param {string} geoid - id = `${statefips}${countyfips}`
   * @param {string} year - one of ['0405', ..., '1415']
   * @param {string} direction - 'in'||'out'
   * @param {string} stat - one of ['n1', 'n2', 'agi']
   * @returns {?number}
   * @description Returns either the value for the record with id=geoid or null
   */
  function getVal (geoid, year, direction, stat = 'n1') {
    let val = munge.getDirectionYearValues(nestedCountyData, direction, year)
      .find(el => el.id === geoid)
    return val === undefined ? null : val[stat]
  }

  /* *** tooltip handler functions *** */

  /** @function ttOver
   * handler for map interaction on mouseover event, attached to county lineshapes
   */
  function ttOver (d) {
    d3.select(this).classed('highlight', true)
  }

  /** @function ttMove
   * handler for map interaction on mousemove event, attached to county lineshapes
   */
  function ttMove (d) {
    let year = years[yearSelector.value]
    let yr = fullYear(year)
    let direction = directionSelector.value
    let stat = statSelector.value
    let val = getVal(d.properties.geoid, year, direction, stat)
    let pop = getVal(d.properties.geoid, year, direction, 'pop')
    tooltip
        .style('left', d3.event.pageX - 50 + 'px')
        .style('top', d3.event.pageY - 70 + 'px')
        .style('display', 'inline-block')
        .html(`<strong>${d.properties.name}, ${d.properties.state}</strong>: <span>${d3.format(',d')(val)}</span><br>Population in ${yr}: ${d3.format(',d')(pop)}`)
  }

  /** @function ttOut
   * handler for map interaction on mouseout event, attached to county lineshapes
   */
  function ttOut (d) {
    tooltip.style('display', 'none')
    d3.select(this).classed('highlight', false)
  }

  /* *** zooming functions *** */

  /** @function clicked
   * handler function for clicking on county lineshape:
   * zooms in on county on initial click,
   * resets zoom when clicked on same county
   */
  function clicked (d) {
    if (active.node() === this) return reset()
    active.classed('active', false)
    active = d3.select(this).classed('active', true)

    let width = mapSvg.attr('width')
    let height = mapSvg.attr('height')
    let bounds = path.bounds(d)
    let dx = bounds[1][0] - bounds[0][0]
    let dy = bounds[1][1] - bounds[0][1]
    let x = (bounds[0][0] + bounds[1][0]) / 2
    let y = (bounds[0][1] + bounds[1][1]) / 2
    let scale = Math.max(1, Math.min(8, 0.9 / Math.max(dx / width, dy / height)))
    let translate = [width / 2 - scale * x, height / 2 - scale * y]

    mapSvg.transition()
      .duration(750)
      .call(zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale))
  }

  /** @function reset
   * handler function for resetting zoom, called by clicked()
   */
  function reset () {
    active.classed('active', false)
    active = d3.select(null)
    mapSvg.transition()
        .duration(750)
        .call(zoom.transform, d3.zoomIdentity) // updated for d3 v4
  }

  /** @function zoomed
 * handler function for mouse scrollwheel zooming
 */
  function zoomed () {
    mapEls.style('stroke-width', 1.5 / d3.event.transform.k + 'px')
    mapEls.attr('transform', d3.event.transform)
  }

  /** @function stopped
   * stops zooming on mouse click
   */
  function stopped () {
    if (d3.event.defaultPrevented) d3.event.stopPropagation()
  }
  /* *** end map drawing *** */

  /* *** start draw the counties barchart *** */
  let topCountyData = munge.dataTopNCounties(munge.getDirectionYearValues(nestedCountyData, direction, year), 'n1', fipsMap, 15)
  let topCountyElement = d3.select('#rank-county')
  let topCountyChart = barChart()
    .margin({left: 70, top: 30, right: 30, bottom: 150})
    .width(960)
    .height(400)
    .xProp('name')
    .yProp('value')
    .colorScale(color)
    .yAxisLabel('Number of Returns')
  topCountyElement
    .datum(topCountyData)
    .call(topCountyChart)
  /* *** end draw the counties barchart *** */

  let topCountyPopAvgString = calcAvgCountyPop(topCountyData)
  let topCountyPopAvgEl = d3.select('#avg-pop-county')
  topCountyPopAvgEl.text(topCountyPopAvgString)

  /* *** start draw the out of state counties barchart *** */
  let topCountyOutOfStateData = munge.dataTopNCounties(munge.getDirectionYearValues(nestedCountyData, direction, year), 'n1', fipsMap, 15, null, true)
  let topCountyOutOfStateElement = d3.select('#rank-county-outofstate')
  let topCountyOutOfStateChart = barChart()
    .margin({left: 70, top: 30, right: 30, bottom: 150})
    .width(960)
    .height(400)
    .xProp('name')
    .yProp('value')
    .colorScale(color)
    .yAxisLabel(statFullName.n1)
  topCountyOutOfStateElement
    .datum(topCountyOutOfStateData)
    .call(topCountyOutOfStateChart)
  /* *** end draw the counties barchart *** */

  let topCountyOutOfStatePopAvgString = calcAvgCountyPop(topCountyOutOfStateData)
  let topCountyOutOfStatePopAvgEl = d3.select('#avg-pop-county-out-of-state')
  topCountyOutOfStatePopAvgEl.text(topCountyOutOfStatePopAvgString)

  /* *** start draw the states barchart *** */
  let topStateData = munge.dataTopNStates(munge.getDirectionYearValues(nestedStateData, direction, year), 'n1', fipsMap, 15, '06')
  let topStateElement = d3.select('#rank-state')
  let topStateChart = barChart()
    .margin({left: 70, top: 30, right: 30, bottom: 50})
    .width(960)
    .height(300)
    .xProp('name')
    .yProp('value')
    .colorScale(color)
    .yAxisLabel(statFullName.n1)
  topStateElement
    .datum(topStateData)
    .call(topStateChart)
  /* *** end draw the states barchart *** */

  /* *** start draw the linechart *** */
  let annualData = munge.getDirectionYearValues(nestedStateDataByYear, direction, '06')
    .map(function (d) {
      return {short: d.key, year: munge.fullYear(d.key), value: d.value.n1}
    })
    .sort(function (a, b) {
      return a.short - b.short
    })
  let annualElement = d3.select('#annual')
  let annualChart = lineGraph()
    .margin({left: 70, top: 30, right: 30, bottom: 50})
    .width(960)
    .height(400)
    .xProp('year')
    .yProp('value')
    .color(color.range()[5])
  annualElement
    .datum(annualData)
    .call(annualChart)
  /* *** end draw the linechart *** */

  /* *** begin page interaction handlers *** */

  /* change paths on map to circles */
  document.getElementById('drawCircles').addEventListener('change', function () {
    let stat = statSelector.value
    let year = years[yearSelector.value]
    let direction = directionSelector.value
    countymapel.selectAll('path.county')
      .attr('d', function (d, i) {
        let param = getVal(d.properties.geoid, year, direction, stat)
        return mapping.circle(d.properties.center, radii(param))
      })
      .attr('opacity', 0.8)
  })

  /* change circles on map to paths */
  document.getElementById('drawShape').addEventListener('change', function () {
    countymapel.selectAll('path.county')
      .attr('d', path)
      .attr('opacity', 1)
  })

  stateSelector.on('change', function () {
    updateAnnualChart()
  })
  yearSelector.addEventListener('change', function () {
    selectedYear.innerHTML = munge.fullYear(years[this.value])
    changeInput(true)
  })
  directionSelector.addEventListener('change', function () {
    changeInput()
  })
  statSelector.addEventListener('change', function () {
    changeInput()
  })

  /** @function changeInput
   * handle a change in any of the imput controls
   * @param {boolean} yearUpdate - is what's being updated the year?
   */
  function changeInput (yearUpdate = false) {
    let year = years[yearSelector.value]
    let direction = directionSelector.value
    let stat = statSelector.value

    let inflow = getTotalReturns('in', year)
    let outflow = getTotalReturns('out', year)
    d3.select('#number-returns')
      .text(d3.format(',d')(direction === 'in' ? inflow : outflow))
    d3.select('#net-flow')
      .text(d3.format(',d')(inflow - outflow))
    d3.select('#destination-counties')
      .text(getNumCounties(direction, year))

    color
      .domain(munge.domainVals(nestedCountyData, direction, year, stat, fipsCounty))
      .range(colorSwatches[direction])
    radii.domain(color.domain())

    if (document.getElementById('drawCircles').checked) {
      countymapel.selectAll('path')
        .attr('fill', function (d) {
          let num = getVal(d.properties.geoid, year, direction, stat)
          return num === null ? '#fff' : color(num)
        })
        .attr('d', function (d, i) {
          let param = getVal(d.properties.geoid, year, direction, stat)
          return mapping.circle(d.properties.center, radii(param))
        })
    } else {
      countymapel.selectAll('path')
        .attr('fill', function (d) {
          let num = getVal(d.properties.geoid, year, direction, stat)
          return num === null ? '#fff' : color(num)
        })
    }

    mapSvg.select('.legendCells').remove() // update doesn't seem to call a color change on the legend
    legend.scale(color)
    mapSvg.select('.legendQuant')
      .call(legend)

    topCountyChart.colorScale(color).yAxisLabel(statFullName[stat])
    topCountyOutOfStateChart.colorScale(color).yAxisLabel(statFullName[stat])
    topStateChart.colorScale(color).yAxisLabel(statFullName[stat])

    let topCountyData = munge.dataTopNCounties(munge.getDirectionYearValues(nestedCountyData, direction, year), stat, fipsMap, 15, null)
    topCountyElement
        .datum(topCountyData)
        .call(topCountyChart)
    let topCountyPopAvgString = calcAvgCountyPop(topCountyData)
    topCountyPopAvgEl.text(topCountyPopAvgString)

    let topCountyOutOfStateData = munge.dataTopNCounties(munge.getDirectionYearValues(nestedCountyData, direction, year), stat, fipsMap, 15, null, true)
    topCountyOutOfStateElement
        .datum(topCountyOutOfStateData)
        .call(topCountyOutOfStateChart)
    let topCountyOutOfStatePopAvgString = calcAvgCountyPop(topCountyOutOfStateData)
    topCountyOutOfStatePopAvgEl.text(topCountyOutOfStatePopAvgString)

    let topStateData = munge.dataTopNStates(munge.getDirectionYearValues(nestedStateData, direction, year), stat, fipsMap, 15, '06')
    topStateElement
        .datum(topStateData)
        .call(topStateChart)

    if (!yearUpdate) {
      updateAnnualChart(year, direction, stat)
    }
  } /* *** end changeInput() *** */

  /** @function updateAnnualChart
   * update the annual line chart using settings read from the page
   */
  function updateAnnualChart (year, direction, stat) {
    year = year || years[yearSelector.value]
    direction = direction || directionSelector.value
    stat = stat || statSelector.value

    let state = document.querySelector('#stateyear').value
    let annualData = munge.getDirectionYearValues(nestedStateDataByYear, direction, state)
      .map(function (d) {
        return {short: d.key, year: munge.fullYear(d.key), value: d.value[stat]}
      })
      .sort(function (a, b) {
        return a.short - b.short
      })
    annualChart
      .color(color.range()[5])
    annualElement
      .datum(annualData)
      .call(annualChart)
  }

  function calcAvgCountyPop (inputData) {
    let result = inputData.reduce((acc, cur) => { return acc + +cur.pop }, 0)
    result = result / inputData.length
    return `Average population of the top counties: ${d3.format(',d')(result)}`
  }

  /* *** end page interaction handlers *** */
} /* *** end initialDraw *** */
