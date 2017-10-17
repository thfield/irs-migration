import './style.css'
import * as d3 from 'd3'
import 'd3-queue'
import * as d3Legend from 'd3-svg-legend'
import * as topojson from 'topojson'
import * as munge from './munge.js'
// import {dimple} from 'dimple'
import barChart from '../charts/bar-chart.js'
import lineGraph from '../charts/line-graph.js'

// TODO: better state management
// TODO: get dimple & webpack working correctly
// TODO: county lineshapes transition to circles
// TODO: net flow in-out
// TODO: state flow: in, out, delta
// TODO: change chart colors on im/em-igrate direction change
// TODO: dimple doesn't seem to handle elements in selection.exit() properly
//     - barchars throw `Error: <rect> attribute x: Expected length, "NaN".` on redraw
//     - linechart throws `Uncaught DOMException: Failed to execute 'querySelectorAll' on 'Element'`
// TODO: use miso for data grouping? http://misoproject.com/dataset/
//     -re-munge data to contain column 'direction' = in||out

let fipsCounty = '06075'
let year = '1415'
let direction = document.querySelector('#direction').value

let colorSwatches = {
  in: ['#f7fcf5', '#e5f5e0', '#c7e9c0', '#a1d99b', '#74c476', '#41ab5d', '#238b45', '#006d2c', '#00441b'],
  out: ['#fff5f0', '#fee0d2', '#fcbba1', '#fc9272', '#fb6a4a', '#ef3b2c', '#cb181d', '#a50f15', '#67000d']
}

// colorSwatches.chart = {
//   in: new dimple.color(colorSwatches.in[6]),
//   out: new dimple.color(colorSwatches.out[6])
// }

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

  /**
   * nestedCountyData nests data from d3.csvParse(00000combined.csv) by:
   *   -direction: ['in', 'out']
   *     -year: ['0405', ..., '1415']
   *        -array of
   *          -data: {agi,id,n1,n2,y1_countyfips,y1_statefips,y2_countyfips,y2_statefips,year}
   */
  let nestedCountyData = d3.nest()
      .key(munge.inOrOut)
      .key(function (d) { return d.year })
      .entries(data)

  /**
   * nestedStateData nests data from d3.csvParse(00000combined.csv) by:
   *    -direction: ['in','out']
   *      -year: ['0405', ..., '1415']
   *        -statefips: ['01', ..., '58']
   *          -data: {n1,n2,agi}
   */
  let nestedStateData = d3.nest()
      .key(munge.inOrOut)
      .key(function (d) { return d.year })
      .key(function (d) {
        let direc = munge.inOrOut(d)
        return d[munge.targetFips(direc)[0]]
      })
      .rollup(function (leaves) {
        return leaves.reduce(function (acc, cur) {
          // don't count 'states' added by irs aggregation
          if (cur.y1_statefips > 58 || cur.y2_statefips > 58) { return acc }
          // don't count non-migrators (where year1residence === year2residence)
          if (cur.y1_statefips === cur.y2_statefips && cur.y1_countyfips === cur.y2_countyfips) { return acc }

          let n1 = cur.n1 === null ? acc.n1 : acc.n1 + Number.parseInt(cur.n1)
          let n2 = cur.n2 === null ? acc.n2 : acc.n2 + Number.parseInt(cur.n2)
          let agi = cur.agi === null ? acc.agi : acc.agi + Number.parseInt(cur.agi)

          return {n1: n1, n2: n2, agi: agi}
        }, {n1: null, n2: null, agi: null})
      })
      .entries(data)

  /**
   * nestedStateDataByYear nests data from d3.csvParse(00000combined.csv) by:
   *    -direction: ['in','out']
   *      -statefips: ['01', ..., '58']
   *        -year: ['0405', ..., '1415']
   *          -data: {n1,n2,agi}
   */
  let nestedStateDataByYear = d3.nest()
      .key(munge.inOrOut)
      .key(function (d) {
        let direc = munge.inOrOut(d)
        return d[munge.targetFips(direc)[0]]
      })
      .key(function (d) { return d.year })
      .rollup(function (leaves) {
        return leaves.reduce(function (acc, cur) {
          // don't count 'states' added by irs aggregation
          if (cur.y1_statefips > 58 || cur.y2_statefips > 58) { return acc }
          // don't count non-migrators (where year1residence === year2residence)
          if (cur.y1_statefips === cur.y2_statefips && cur.y1_countyfips === cur.y2_countyfips) { return acc }

          let n1 = cur.n1 === null ? acc.n1 : acc.n1 + Number.parseInt(cur.n1)
          let n2 = cur.n2 === null ? acc.n2 : acc.n2 + Number.parseInt(cur.n2)
          let agi = cur.agi === null ? acc.agi : acc.agi + Number.parseInt(cur.agi)

          return {n1: n1, n2: n2, agi: agi}
        }, {n1: null, n2: null, agi: null})
      })
      .entries(data)

  /* *** set color scale *** */
  let color = d3.scaleQuantile()
    .range(colorSwatches[direction])
    .domain(munge.domainVals(nestedCountyData, direction, year, 'n1', fipsCounty))

  /* *** populate year selector *** */
  let years = nestedCountyData[0].values.map(d => d.key).sort()
  let yearSelector = document.getElementById('year-selector')
  yearSelector.max = years.length - 1
  yearSelector.value = years.length - 1
  document.getElementById('selected-year').innerHTML = munge.fullYear(years[years.length - 1])

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
        .attr('stroke', '#fff')
        // .attr('stroke-width', 0.5)
        .attr('fill', function (d) {
          let num = getVal(d.properties.geoid, year, direction)
          return num === null ? '#fff' : color(num)
        })
        .attr('id', function (d) { return d.geoid })
        .attr('d', path)
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
  function ttOver (d) {
    d3.select(this).classed('highlight', true)
  }
  function ttMove (d) {
    let year = years[document.getElementById('year-selector').value]
    let direction = document.getElementById('direction').value
    let stat = document.getElementById('stat').value
    let val = getVal(d.properties.geoid, year, direction, stat)
    tooltip
        .style('left', d3.event.pageX - 50 + 'px')
        .style('top', d3.event.pageY - 70 + 'px')
        .style('display', 'inline-block')
        .html(`<strong>${d.properties.name}, ${d.properties.state}</strong>: <span>${d3.format(',d')(val)}</span>`)
  }
  function ttOut (d) {
    tooltip.style('display', 'none')
    d3.select(this).classed('highlight', false)
  }

  /* *** zooming functions *** */
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

  function reset () {
    active.classed('active', false)
    active = d3.select(null)
    mapSvg.transition()
        .duration(750)
        .call(zoom.transform, d3.zoomIdentity) // updated for d3 v4
  }

  function zoomed () {
    mapEls.style('stroke-width', 1.5 / d3.event.transform.k + 'px')
    mapEls.attr('transform', d3.event.transform)
  }

  function stopped () {
    if (d3.event.defaultPrevented) d3.event.stopPropagation()
  }
  /* *** end map drawing *** */

  /* *** start draw the counties barchart *** */
  let topCountyElement = d3.select('#rank-county')
  let topCountyChart = barChart()
    .margin({left: 70, top: 30, right: 30, bottom: 150})
    .width(960)
    .height(400)
    .xProp('name')
    .yProp('value')
    .colorScale(color)
    .yAxisLabel(statFullName['n1'])
  topCountyElement
    .datum(munge.dataTopNCounties(munge.getDirectionYearValues(nestedCountyData, direction, year), 'n1', fipsMap, 15))
    .call(topCountyChart)
  /* *** end draw the counties barchart *** */

  /* *** start draw the out of state counties barchart *** */
  let topCountyOutOfStateElement = d3.select('#rank-county-outofstate')
  let topCountyOutOfStateChart = barChart()
    .margin({left: 70, top: 30, right: 30, bottom: 150})
    .width(960)
    .height(400)
    .xProp('name')
    .yProp('value')
    .colorScale(color)
    .yAxisLabel(statFullName['n1'])
  topCountyOutOfStateElement
    .datum(munge.dataTopNCounties(munge.getDirectionYearValues(nestedCountyData, direction, year), 'n1', fipsMap, 15, null, true))
    .call(topCountyOutOfStateChart)
  /* *** end draw the counties barchart *** */

  /* *** start draw the states barchart *** */
  let topStateElement = d3.select('#rank-state')
  let topStateChart = barChart()
    .margin({left: 70, top: 30, right: 30, bottom: 50})
    .width(960)
    .height(300)
    .xProp('name')
    .yProp('value')
    .colorScale(color)
    .yAxisLabel(statFullName['n1'])
  topStateElement
    .datum(munge.dataTopNStates(munge.getDirectionYearValues(nestedStateData, direction, year), 'n1', fipsMap, 15, '06'))
    .call(topStateChart)
  /* *** end draw the states barchart *** */

  /* *** start draw the linechart *** */
  let annualData = munge.getDirectionYearValues(nestedStateDataByYear, direction, '06').map(function (d) {
    return {year: d.key, value: d.value.n1}
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
  // stateSelector.on('change', function () {
  //   let stat = document.getElementById('stat').value
  //   annualChart.data = chartData.charts.linechart[direction][this.value].map(function (d) {
  //     return {year: d.year, value: d[stat]}
  //   })
  //   annualChart.draw()
  // })
  yearSelector.addEventListener('change', function () {
    document.getElementById('selected-year').innerHTML = munge.fullYear(years[this.value])
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
    // if (year) { nostateupdate = true }
    year = year || years[yearSelector.value]
    direction = direction || document.querySelector('#direction').value
    stat = stat || document.querySelector('#stat').value
    let state = document.querySelector('#stateyear').value

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

    countymapel.selectAll('path')
      .attr('fill', function (d) {
        let num = getVal(d.properties.geoid, year, direction, stat)
        return num === null ? '#fff' : color(num)
      })

    mapSvg.select('.legendCells').remove() // update doesn't seem to call a color change on the legend
    legend.scale(color)
    mapSvg.select('.legendQuant')
      .call(legend)

    let addlProp = stat === 'meanAgi' ? function (d) {
      d.meanAgi = +d.agi / +d.n1
      return d
    } : null

    topCountyChart.colorScale(color).yAxisLabel(statFullName[stat])
    topCountyOutOfStateChart.colorScale(color).yAxisLabel(statFullName[stat])
    topStateChart.colorScale(color).yAxisLabel(statFullName[stat])

    topCountyElement
        .datum(munge.dataTopNCounties(munge.getDirectionYearValues(nestedCountyData, direction, year), stat, fipsMap, 15, addlProp))
        .call(topCountyChart)
    topCountyOutOfStateElement
        .datum(munge.dataTopNCounties(munge.getDirectionYearValues(nestedCountyData, direction, year), stat, fipsMap, 15, addlProp, true))
        .call(topCountyOutOfStateChart)
    topStateElement
        .datum(munge.dataTopNStates(munge.getDirectionYearValues(nestedStateData, direction, year), stat, fipsMap, 15, '06', addlProp))
        .call(topStateChart)

    if (!nostateupdate) {
      // TODO: addlProp for state data
      // TODO: years as number to years as category
      let annualData = munge.getDirectionYearValues(nestedStateDataByYear, direction, state).map(function (d) {
        return {year: d.key, value: d.value[stat]}
      })
      annualChart
        .color(color.range()[5])
      annualElement
        .datum(annualData)
        .call(annualChart)
    }
  }
  /* *** end page interaction handlers *** */
} /* *** end initialDraw *** */

let statFullName = {
  n1: 'Number of Returns',
  n2: 'Number of Exemptions',
  agi: 'Total Adjusted Gross Income',
  meanAgi: 'Mean Adjusted Gross Income'
}
