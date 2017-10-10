import './style.css'
// import * as d3 from 'd3'
// import 'd3-queue'
// import * as d3Legend from 'd3-svg-legend'
// import * as topojson from 'topojson'
// import {dimple} from 'dimple'
// import barChart from '../charts/bar-chart.js'

// TODO: better state management
// TODO: get dimple & webpack working correctly
// TODO: county lineshapes transition to circles
// TODO: map tooltip follow mouse
// TODO: map zooming
// TODO: net flow in-out
// TODO: state flow: in, out, delta
// TODO: total number of counties
// TODO: change chart colors on im/em-igrate direction change
// TODO: dimple doesn't seem to handle elements in selection.exit() properly
//     - throws `Error: <rect> attribute x: Expected length, "NaN".` on redraw
// TODO: use miso for data grouping? http://misoproject.com/dataset/
//     -re-munge data to contain column 'direction' = in||out

let fipsCounty = '06075'
let year = '1415'
let direction = document.querySelector('#direction').value

let colorSwatches = {
  in: ['#f7fcf5', '#e5f5e0', '#c7e9c0', '#a1d99b', '#74c476', '#41ab5d', '#238b45', '#006d2c', '#00441b'],
  out: ['#fff5f0', '#fee0d2', '#fcbba1', '#fc9272', '#fb6a4a', '#ef3b2c', '#cb181d', '#a50f15', '#67000d']
}

colorSwatches.chart = {
  in: new dimple.color(colorSwatches.in[6]),
  out: new dimple.color(colorSwatches.out[6])
}

let path = '../data'
let dataPath = `${path}/${fipsCounty}/${fipsCounty}combined.csv`
let chartPath = `${path}/chartData.json`
let shapesPath = `${path}/${fipsCounty}/${fipsCounty}shapes.topojson`
let statesPath = `${path}/geo/states.topojson`
let fipsPath = `${path}/fipscodes.csv`

d3.queue()
  .defer(d3.csv, dataPath, function (row) {
    let meanAgi = +row.agi / +row.n1
    return Object.assign(row, {meanAgi: meanAgi})
  })
  .defer(d3.json, chartPath)
  .defer(d3.json, statesPath)
  .defer(d3.json, shapesPath)
  .defer(d3.csv, fipsPath, function (row) {
    return Object.assign(row, {id: row.statefp.concat(row.countyfp)})
  })
  .await(initialDraw)

function initialDraw (error, data, chartData, us, counties, fips) {
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

  /**
   * nestedCountyData nests data from d3.csvParse(00000combined.csv) by:
   *   -direction: ['in', 'out']
   *     -year: ['0405', ..., '1415']
   *        -array of
   *          -data: {agi,id,n1,n2,y1_countyfips,y1_statefips,y2_countyfips,y2_statefips,year}
   */
  let nestedCountyData = d3.nest()
      .key(inOrOut)
      .key(function (d) { return d.year })
      .object(data)

  /* *** set color scale *** */
  let color = d3.scaleQuantile()
    .range(colorSwatches[direction])
    .domain(domainVals(nestedCountyData, direction, year, 'n1'))

  /* *** populate year selector *** */
  let years = Object.keys(nestedCountyData[direction]).sort()
  let yearSelector = document.getElementById('year-selector')
  yearSelector.max = years.length - 1
  yearSelector.value = years.length - 1
  document.getElementById('selected-year').innerHTML = fullYear(years[years.length - 1])

  /* *** populate state selector *** */
  let states = Object.keys(chartData.charts.linechart[direction])
  let stateSelector = d3.select('#stateyear')
  stateSelector.selectAll('.stateoptions')
    .data(states).enter().append('option')
      .attr('value', (d) => d)
      .text((d) => d)

  /* *** start map drawing *** */
  let mapSvg = d3.select('#map svg')
  let path = d3.geoPath()
  let info = d3.select('#info')

  /* *** draw legend *** */
  mapSvg.append('g')
    .attr('class', 'legendQuant')
    .attr('transform', 'translate(830,300)')
  let legend = d3.legendColor()
    .labelFormat(d3.format(',d'))
    .title('')
    .titleWidth(100)
    .cells(7)
    .scale(color)
  mapSvg.select('.legendQuant')
    .call(legend)

  /* *** draw counties *** */
  let countymapel = mapSvg.append('g')
        .attr('class', 'counties')
  countymapel.selectAll('path')
      .data(topojson.feature(counties, counties.objects.counties).features)
      .enter().append('path')
        .attr('stroke', '#fff')
        .attr('stroke-width', 0.5)
        .attr('fill', function (d) {
          let num = getVal(d.properties.geoid, year, direction)
          return num === null ? '#fff' : color(num)
        })
        .attr('id', function (d) { return d.geoid })
        .attr('d', path)
        .on('mouseover', ttOver)
        .on('mouseout', ttOut)

  /* *** draw states *** */
  mapSvg.append('path')
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
    let val = nestedCountyData[direction][year].find(el => el.id === geoid)
    return val === undefined ? null : val[stat]
  }

  /* *** tooltip handler functions *** */
  function ttOver (d) {
    let stat = document.getElementById('stat').value
    d3.select(this).classed('highlight', true)
    info.html(`<strong>${d.properties.name}, ${d.properties.state}</strong>: <span>${getVal(d.properties.geoid, year, direction, stat)}</span>`)
  }
  function ttOut (d) {
    d3.select(this).classed('highlight', false)
    info.html('')
  }
  /* *** end map drawing *** */

  /* *** start draw the counties barchart *** */
  let topCountyElement = dimple.newSvg('#rank-county', 960, 400)
  var topCountyChart = new dimple.chart(topCountyElement, chartData.counties.n1[direction][year])
  topCountyChart.setMargins(50, 30, 30, 150)
  topCountyChart.addCategoryAxis('x', 'name').title = 'County'
  let topCountyChartY = topCountyChart.addMeasureAxis('y', 'value')
  topCountyChartY.title = statFullName['n1']
  // topCountyChart.defaultColors = [colorSwatches.chart[direction]]
  topCountyChart.addSeries(null, dimple.plot.bar)
  topCountyChart.draw()
  /* *** end draw the counties barchart *** */

  /* *** start draw the out of state counties barchart *** */
  let topCountyOutOfStateElement = dimple.newSvg('#rank-county-outofstate', 960, 400)
  var topCountyOutOfStateChart = new dimple.chart(topCountyOutOfStateElement, chartData.counties.outOfState.n1[direction][year])
  topCountyOutOfStateChart.setMargins(50, 30, 30, 150)
  topCountyOutOfStateChart.addCategoryAxis('x', 'name').title = 'County'
  let topCountyOutOfStateChartY = topCountyOutOfStateChart.addMeasureAxis('y', 'value')
  topCountyOutOfStateChartY.title = statFullName['n1']
  // topCountyOutOfStateChart.defaultColors = [colorSwatches.chart[direction]]
  topCountyOutOfStateChart.addSeries(null, dimple.plot.bar)
  topCountyOutOfStateChart.draw()
  /* *** end draw the counties barchart *** */

  /* *** start draw the states barchart *** */
  let topStateElement = dimple.newSvg('#rank-state', 960, 400)
  var topStateChart = new dimple.chart(topStateElement, chartData.states.n1[direction][year].filter(function (d) {
    return d.fips !== '06'
  }))
  topStateChart.setMargins(50, 30, 30, 150)
  topStateChart.addCategoryAxis('x', 'name').title = 'State'
  // let topStateChartY = topStateChart.addLogAxis('y', 'value')
  let topStateChartY = topStateChart.addMeasureAxis('y', 'value')
  topStateChartY.title = statFullName['n1']
  // topStateChart.defaultColors = [colorSwatches.chart[direction]]
  topStateChart.addSeries(null, dimple.plot.bar)
  topStateChart.draw()
  /* *** end draw the states barchart *** */

  /* *** start draw the linechart *** */
  let annualData = chartData.charts.linechart[direction].CA.map(function (d) {
    return {year: d.year, value: d[document.getElementById('stat').value]}
  })
  let annualElement = dimple.newSvg('#annual', 960, 400)
  var annualChart = new dimple.chart(annualElement, annualData)
  annualChart.setMargins(70, 0, 50, 40)
  annualChart.addCategoryAxis('x', 'year').title = 'Year'
  let annualChartY = annualChart.addAxis('y', 'value')
  annualChartY.title = statFullName['n1']
  annualChart.addSeries(null, dimple.plot.line)
  // annualChart.defaultColors = [colorSwatches.chart[direction]]
  annualChart.draw()
  /* *** end draw the linechart *** */

  /* *** begin page interaction handlers *** */
  stateSelector.on('change', function () {
    let stat = document.getElementById('stat').value
    annualChart.data = chartData.charts.linechart[direction][this.value].map(function (d) {
      return {year: d.year, value: d[stat]}
    })
    annualChart.draw()
  })
  yearSelector.addEventListener('change', function () {
    document.getElementById('selected-year').innerHTML = fullYear(years[this.value])
    changeInput(years[this.value], null, null)
  })
  document.getElementById('direction').addEventListener('change', function () {
    changeInput(null, this.value, null)
  })
  document.getElementById('stat').addEventListener('change', function () {
    changeInput(null, null, this.value)
  })

  function changeInput (year, direction, stat) {
    let nostateupdate = false
    if (year) { nostateupdate = true }
    year = year || years[yearSelector.value]
    direction = direction || document.querySelector('#direction').value
    stat = stat || document.querySelector('#stat').value
    let state = document.querySelector('#stateyear').value

    color
      .domain(domainVals(nestedCountyData, direction, year, stat))
      .range(colorSwatches[direction])

    countymapel.selectAll('path')
      .attr('fill', function (d) {
        let num = getVal(d.properties.geoid, year, direction, stat)
        return color(num)
      })

    mapSvg.select('.legendCells').remove() // update doesn't seem to call a color change on the legend
    legend.scale(color)
    mapSvg.select('.legendQuant')
      .call(legend)

    // topCountyChart.defaultColors = [colorSwatches.chart[direction]] // use colorScale instead of defaultColors?
    topCountyChart.data = chartData.counties[stat][direction][year]
    topCountyChartY.title = statFullName[stat]
    topCountyChart.draw()

    topStateChart.data = chartData.states[stat][direction][year].filter(function (d) {
      return d.fips !== '06'
    })
    // topStateChart.defaultColors = [colorSwatches.chart[direction]]
    topStateChartY.title = statFullName[stat]
    topStateChart.draw()

    topCountyOutOfStateChart.data = chartData.counties.outOfState[stat][direction][year]
    // topCountyOutOfStateChart.defaultColors = [colorSwatches.chart[direction]]
    topCountyOutOfStateChartY.title = statFullName[stat]
    topCountyOutOfStateChart.draw()

    if (!nostateupdate) {
      annualChart.data = chartData.charts.linechart[direction][state].map(function (d) {
        return {year: d.year, value: d[stat]}
      })
      annualChartY.title = statFullName[stat]
      // annualChart.defaultColors = [colorSwatches.chart[direction]]
      annualChart.draw()
    }
  }
  /* *** end page interaction handlers *** */
} /* *** end initialDraw *** */

/*******************************************************************************
        data munge helper functions
*******************************************************************************/
/** @function domainVals
 * @param {object} data - nestedCountyData
 * @param {string} direction - 'in'||'out'
 * @param {string} year - one of ['0405', ..., '1415']
 * @param {string} stat - one of ['n1', 'n2', 'agi', 'meanAgi']
 * @returns {array} array of stat values for the data in that direction & year
 */
function domainVals (data, direction, year, stat) {
  return data[direction][year].map(d => (d.y1_statefips < 58 && d.id !== fipsCounty && d[stat] !== '-1') ? +d[stat] : null)
}

/** @function inOrOut
 * @param { object } d - d3.csvParse'd row of data from `000000combined.csv` file
 * @returns { string } 'in' or 'out', meaning 'immigration into' or
 * 'emigration out of' the county of interest
 */
function inOrOut (d) {
  return d.id === `${d.y1_statefips}${d.y1_countyfips}` ? 'in' : 'out'
}

/** @function fullYear
 * @param { string } d - ex: '0405'
 * @returns { string } - ex: '2004-2005'
 * @description formats 2digit/2years string into 4digit/2years with hyphen
 */
function fullYear (d) {
  let res = /(\d{2})(\d{2})/.exec(d)
  res[1] = res[1] > 79 ? `19${res[1]}` : `20${res[1]}`
  res[2] = res[2] > 79 ? `19${res[2]}` : `20${res[2]}`
  return `${res[1]}-${res[2]}`
}

let statFullName = {
  n1: 'Number of Returns',
  n2: 'Number of Exemptions',
  agi: 'Total Adjusted Gross Income',
  meanAgi: 'Mean Adjusted Gross Income'
}
