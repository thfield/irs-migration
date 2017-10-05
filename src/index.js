import './style.css'
// import * as d3 from 'd3'
// import 'd3-queue'
// import * as d3Legend from 'd3-svg-legend'
// import * as topojson from 'topojson'
// import {dimple} from 'dimple'
// import barChart from '../charts/bar-chart.js'

let fipsCounty = '06075'
let year = '1415'
// let years = ['0405', '0506', '0607', '0708', '0809', '0910', '1011', '1112', '1213', '1314', '1415']
let direction = document.querySelector('#direction').value

let colorSwatches = {
  in: ['#f7fcf5', '#e5f5e0', '#c7e9c0', '#a1d99b', '#74c476', '#41ab5d', '#238b45', '#006d2c', '#00441b'],
  out: ['#fff5f0', '#fee0d2', '#fcbba1', '#fc9272', '#fb6a4a', '#ef3b2c', '#cb181d', '#a50f15', '#67000d']
}

let path = '../data'
let dataPath = `${path}/${fipsCounty}/${fipsCounty}combined.csv`
let chartPath = `${path}/chartData.json`
let shapesPath = `${path}/${fipsCounty}/${fipsCounty}shapes.topojson`
let statesPath = `${path}/geo/states.topojson`
let fipsPath = `${path}/fipscodes.csv`

d3.queue()
  .defer(d3.csv, dataPath)
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

  /* *** begin color scale setting *** */
  let n1Vals = nestedCountyData[direction][year].map(d => {
    return (d.y1_statefips < 58 && d.id !== fipsCounty && d.n1 !== '-1')
    ? +d.n1
    : undefined
  })

  let color = d3.scaleQuantile()
    .range(colorSwatches[direction])
    .domain(n1Vals)
  /* *** end color scale setting *** */

  /* *** populate year selector dropdown *** */
  d3.select('#year').selectAll('option').data(Object.keys(nestedCountyData[direction]).sort())
    .enter().append('option')
    .attr('value', function (d) { return d })
    .attr('selected', function (d) { return d === '1415' })
    .text(fullYear)

  /* *** start map drawing *** */
  let mapSvg = d3.select('#map svg')
  let path = d3.geoPath()
  let info = d3.select('#info')

  /* *** draw legend *** */
  mapSvg.append('g')
    .attr('class', 'legendQuant')
    .attr('transform', 'translate(830,300)')
  var legend = d3.legendColor()
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
   * @returns {?number}
   * @description Returns either the value for the record with id=geoid or null
   */
  function getVal (geoid, year, direction) {
    let val = nestedCountyData[direction][year].find(el => el.id === geoid)
    return val === undefined ? null : val.n1
  }

  /* *** tooltip handler functions *** */
  function ttOver (d) {
    d3.select(this).classed('highlight', true)
    info.html(`<strong>${d.properties.name}, ${d.properties.state}</strong>: <span>${getVal(d.properties.geoid, year, direction)}</span>`)
  }
  function ttOut (d) {
    d3.select(this).classed('highlight', false)
    info.html('')
  }
  /* *** end map drawing *** */

  /* *** start draw the barchart *** */
  let topCountyData = chartData.counties.n1.[direction][year]
  let topCountyElement = dimple.newSvg('#rank', 960, 400)
  var topCountyChart = new dimple.chart(topCountyElement, topCountyData)
  topCountyChart.setMargins(30, 30, 30, 150)
  topCountyChart.addCategoryAxis('x', 'name')
  topCountyChart.addMeasureAxis('y', 'value')
  topCountyChart.addSeries(null, dimple.plot.bar)
  topCountyChart.draw()
  /* *** end draw the barchart *** */

  /* *** start draw the linechart *** */
  let annualData = chartData.charts.linechart.in
  let annualElement = dimple.newSvg('#annual', 960, 400)
  var annualChart = new dimple.chart(annualElement, annualData)
  annualChart.setMargins(30, 30, 30, 40)
  annualChart.addCategoryAxis('x', 'year')
  annualChart.addLogAxis('y', 'value')
  annualChart.addSeries('name', dimple.plot.line)
  annualChart.addLegend(10, 20, 700, 40, 'right')
  annualChart.draw()
  /* *** end draw the linechart *** */

  /* *** begin page interaction handlers *** */
  // document.querySelector('#year').onchange = function(e){
  //   year = e.target.value
  //   direction = document.querySelector('#direction').value
  //   n1Vals = nestedCountyData[direction][year].map(d => (d.y1_statefips < 58  && d.id !== fipsCounty && d.n1 != '-1') ? +d.n1 : undefined)
  //
  //   color
  //       .domain( n1Vals )
  //       .range(colorSwatches[direction])
  //
  //   countymapel.selectAll('path')
  //         .attr('fill', function(d){
  //           let num = getVal(d.properties.geoid,year,direction)
  //           return color(num)
  //         })
  //
  //   // mapSvg.select('.legendQuant').remove() // update doesn't seem to call a color change on the legend
  //   legend.scale(color)
  //   mapSvg.select('.legendQuant')
  //     .call(legend)
  //
  //   topTenData = findTopN(nestedCountyData[direction][year])
  //   topTenChart.data = topTenData
  //   topTenChart.draw(250,true)
  // }
  //
  // document.querySelector('#direction').onchange = function(e){
  //   year = document.querySelector('#year').value
  //   direction = e.target.value
  //   n1Vals = nestedCountyData[direction][year].map(d => (d.y1_statefips < 58  && d.id !== fipsCounty && d.n1 != '-1') ? +d.n1 : undefined)
  //
  //   color
  //       .domain( d3.extent(n1Vals) )
  //       .range(colorArray[direction])
  //
  //   countymapel.selectAll('path')
  //     .attr('fill', function(d){
  //       let num = getVal(d.properties.geoid,year,direction)
  //       return color(num)
  //     })
  //   /* *** draw the legend *** */
  //   mapSvg.append('g')
  //     .attr('class', 'legendQuant')
  //     .attr('transform', 'translate(830,300)')
  //
  //   mapSvg.select('.legendQuant').remove() // update doesn't seem to call a color change on the legend
  //   legend.scale(color)
  //   mapSvg.select('.legendQuant')
  //     .call(legend)
  //
  //   topTenData = findTopN(nestedCountyData[direction][year])
  //   topTenChart.colorSchema(colorSwatches[direction])
  //   topTenElement.datum(topTenData).call(topTenChart)
  // }
  /* *** end page interaction handlers *** */
}

/*******************************************************************************
        data munge helper functions
*******************************************************************************/

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
