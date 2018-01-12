import * as d3 from 'd3'
import 'd3-queue'
import * as d3Legend from 'd3-svg-legend'
import * as topojson from 'topojson'
import * as munge from './munge.js'
import barChart from './charts/bar-chart.js'
import lineGraph from './charts/line-graph.js'
import choroplethChart from './charts/choropleth.js'
import * as mapping from './mapping.js'
import {fullYear} from '../munge/utils/helpers.js'
import * as nesting from './nesting.js'
import statesTopoJson from './states.topo.json'

// TODO: choose county to show historical migration - sinks/sources
// TODO: tree-shake d3 dependencies
// TODO: better state management
// TODO: county lineshapes transition to circles
// TODO: net flow in-out annually
// TODO: state flow: in, out, delta
// TODO: use miso for data grouping? http://misoproject.com/dataset/
//     -re-munge data to contain column 'direction' = in||out

// TODO: display name of county in sidebar

let fipsCounty = document.URL.match(/\d{5}$/)[0]
let fipsState = fipsCounty.slice(0, 2)
let countyName
let stateName
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

let migrationsPath = `/api/migration/${fipsCounty}`
let shapesPath = `/api/topojson/${fipsCounty}`
let fipsPath = '/api/allcounties'

d3.queue()
  .defer(d3.csv, migrationsPath, function (row) {
    let meanAgi = +row.agi / +row.n1
    return Object.assign(row, {meanAgi: meanAgi})
  })
  .defer(d3.json, shapesPath)
  .defer(d3.json, fipsPath)
  .await(initialDraw)

let pageEls = {
  nodes: {
    directionSelector: document.querySelector('#direction'),
    statisticSelector: document.querySelector('#stat'),
    yearSelector: document.querySelector('#year-selector'),
    yearReadout: document.querySelector('#year-readout'),
    drawCircles: document.querySelector('#drawCircles'),
    drawShape: document.querySelector('#drawShape'),
    countyNameEls: document.querySelectorAll('.county-name'),
    stateNameEls: document.querySelectorAll('.state-name')
  },
  d3s: {
    stateSelector: d3.select('#stateyear'),
    destinationCounties: d3.select('#destination-counties'),
    numberReturns: d3.select('#number-returns'),
    netFlow: d3.select('#net-flow'),
    choropleth: d3.select('#map'),
    mapSvg: d3.select('#map svg'),
    topCountyElement: d3.select('#rank-county'),
    topCountyOutOfStateElement: d3.select('#rank-county-outofstate'),
    topStateElement: d3.select('#rank-state'),
    annualElement: d3.select('#annual'),
    topCountyPopAvgEl: d3.select('#avg-pop-county'),
    topCountyOutOfStatePopAvgEl: d3.select('#avg-pop-county-out-of-state')
  }
}

function initialDraw (error, migrationData, countyTopo, fips) {
  if (error) { throw error }
  /**
    * fipsMap has mapping of:
    *  - state fips to state abbrev:
    *     {'06': 'CA'}
    *  - state+county fips to county data from d3.csvParse(fipscodes.csv):
    *      { '06075': {
    *          fips: '06075',
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
    fipsMap.set(row.fips, row)
    fipsMap.set(row.statefp, row.state)
  })
  countyName = fipsMap.get(fipsCounty).name
  stateName = fipsMap.get(fipsCounty).state
  let nested = {
    CountyData: nesting.county(migrationData),
    StateData: nesting.state(migrationData),
    StateDataByYear: nesting.stateByYear(migrationData)
  }

  /* *** set color scale *** */
  let color = d3.scaleQuantile()
    .range(colorSwatches[direction])
    .domain(munge.domainVals(nested.CountyData, direction, year, 'n1', fipsCounty))
  let radii = d3.scaleQuantile()
    .range([0, 2, 4, 6, 8, 10, 12, 15, 20, 25])
    .domain(color.domain())

  /* *** populate year selector *** */
  let years = nested.CountyData[0].values.map(d => d.key).sort()

  pageEls.nodes.yearSelector.max = years.length - 1
  pageEls.nodes.yearSelector.value = years.length - 1
  pageEls.nodes.yearReadout.innerHTML = munge.fullYear(years[years.length - 1])
  pageEls.nodes.countyNameEls.forEach(function (el) {
    el.innerHTML = countyName
  })
  pageEls.nodes.stateNameEls.forEach(function (el) {
    el.innerHTML = stateName
  })

  /* *** populate state selector *** */
  let states = nested.StateDataByYear[0].values.map(d => d.key).filter(d => d < 58)

  pageEls.d3s.stateSelector.selectAll('.stateoptions')
    .data(states).enter().append('option')
      .attr('value', (d) => d)
      .text((d) => fipsMap.get(d))

  /* *** populate statistic info *** */
  let inflow = getTotalReturns('in', year)
  // let outflow = getTotalReturns('out', year)
  let nCounties = getNumCounties(direction, year)

  // pageEls.d3s.destinationCounties.text(nCounties)
  // pageEls.d3s.numberReturns.text(d3.format(',d')(inflow))
  // pageEls.d3s.netFlow.text(d3.format(',d')(inflow - outflow))

  function getTotalReturns (direction, year) {
    return munge.nestedFind(nested.CountyData, direction, year).find(function (county) {
      return county.id === '96000'
    }).n1
  }

  function getNumCounties (direction, year) {
    return munge.nestedFind(nested.CountyData, direction, year).length
  }

  /* *** start map drawing *** */
  let choropleth = choroplethChart()

  choropleth
    .colorScale(color)
    .geokey('geoid')
    .geoname('name')
    .datakey('id')
    .topoObjectName('counties')
    .topoObjectClassName('counties')
    .basemapClassName('states')
    .topoData(countyTopo)
    .basemap(topojson.mesh(statesTopoJson, statesTopoJson.objects.states))

  let choroplethData = munge.choroplethData(munge.nestedFind(nested.CountyData, direction, year), 'n1')

  choropleth.data(choroplethData)

  pageEls.d3s.choropleth.call(choropleth)

  /* *** end map drawing *** */

  // /* *** start draw the counties barchart *** */
  let topCountyData = munge.dataTopNCounties(munge.nestedFind(nested.CountyData, direction, year), 'n1', fipsMap, 15, null, false, fipsCounty)

  let topCountyChart = barChart()
    .margin({left: 70, top: 30, right: 30, bottom: 150})
    .width(960)
    .height(400)
    .xProp('name')
    .yProp('value')
    .colorScale(color)
    .yAxisLabel('Number of Returns')
  pageEls.d3s.topCountyElement
    .datum(topCountyData)
    .call(topCountyChart)
  /* *** end draw the counties barchart *** */

  let topCountyPopAvgString = calcAvgCountyPop(topCountyData)

  pageEls.d3s.topCountyPopAvgEl.text(topCountyPopAvgString)

  /* *** start draw the out of state counties barchart *** */
  let topCountyOutOfStateData = munge.dataTopNCounties(munge.nestedFind(nested.CountyData, direction, year), 'n1', fipsMap, 15, null, true, fipsCounty)

  let topCountyOutOfStateChart = barChart()
    .margin({left: 70, top: 30, right: 30, bottom: 150})
    .width(960)
    .height(400)
    .xProp('name')
    .yProp('value')
    .colorScale(color)
    .yAxisLabel(statFullName.n1)
  pageEls.d3s.topCountyOutOfStateElement
    .datum(topCountyOutOfStateData)
    .call(topCountyOutOfStateChart)
  /* *** end draw the counties barchart *** */

  let topCountyOutOfStatePopAvgString = calcAvgCountyPop(topCountyOutOfStateData)

  pageEls.d3s.topCountyOutOfStatePopAvgEl.text(topCountyOutOfStatePopAvgString)

  /* *** start draw the states barchart *** */
  let topStateData = munge.dataTopNStates(munge.nestedFind(nested.StateData, direction, year), 'n1', fipsMap, 15, fipsState)

  let topStateChart = barChart()
    .margin({left: 70, top: 30, right: 30, bottom: 50})
    .width(960)
    .height(300)
    .xProp('name')
    .yProp('value')
    .colorScale(color)
    .yAxisLabel(statFullName.n1)
  pageEls.d3s.topStateElement
    .datum(topStateData)
    .call(topStateChart)
  /* *** end draw the states barchart *** */

  /* *** start draw the linechart *** */
  let annualData = munge.nestedFind(nested.StateDataByYear, direction, fipsState)
    .map(function (d) {
      return {short: d.key, year: munge.fullYear(d.key), value: d.value.n1}
    })
    .sort(function (a, b) {
      return a.short - b.short
    })

  let annualChart = lineGraph()
    .margin({left: 70, top: 30, right: 30, bottom: 50})
    .width(960)
    .height(400)
    .xProp('year')
    .yProp('value')
    .color(color.range()[5])
  pageEls.d3s.annualElement
    .datum(annualData)
    .call(annualChart)
  /* *** end draw the linechart *** */

  /* *** begin page interaction handlers *** */

  // /* change paths on map to circles */
  // pageEls.nodes.drawCircles.addEventListener('change', function () {
  //   let stat = pageEls.nodes.statisticSelector.value
  //   let year = years[pageEls.nodes.yearSelector.value]
  //   let direction = pageEls.nodes.directionSelector.value
  //   countymapel.selectAll('path.county')
  //     .attr('d', function (d, i) {
  //       let param = getVal(d.properties.geoid, year, direction, stat)
  //       return mapping.circle(d.properties.center, radii(param))
  //     })
  //     .attr('opacity', 0.8)
  // })
  //
  // /* change circles on map to paths */
  // pageEls.nodes.drawShape.addEventListener('change', function () {
  //   countymapel.selectAll('path.county')
  //     .attr('d', path)
  //     .attr('opacity', 1)
  // })

  pageEls.d3s.stateSelector.on('change', function () {
    updateAnnualChart()
  })
  pageEls.nodes.yearSelector.addEventListener('change', function () {
    pageEls.nodes.yearReadout.innerHTML = munge.fullYear(years[this.value])
    changeInput(true)
  })
  pageEls.nodes.directionSelector.addEventListener('change', function () {
    changeInput()
  })
  pageEls.nodes.statisticSelector.addEventListener('change', function () {
    changeInput()
  })

  /** @function changeInput
   * handle a change in any of the imput controls
   * @param {boolean} yearUpdate - is what's being updated the year?
   */
  function changeInput (yearUpdate = false) {
    let year = years[pageEls.nodes.yearSelector.value]
    let direction = pageEls.nodes.directionSelector.value
    let stat = pageEls.nodes.statisticSelector.value

    // let inflow = getTotalReturns('in', year)
    // let outflow = getTotalReturns('out', year)
    // pageEls.d3s.numberReturns.text(d3.format(',d')(direction === 'in' ? inflow : outflow))
    // pageEls.d3s.netFlow.text(d3.format(',d')(inflow - outflow))
    // pageEls.d3s.destinationCounties.text(getNumCounties(direction, year))

    // TODO: handle case where there is no data (ie, no migrations occurred)
    color
      .domain(munge.domainVals(nested.CountyData, direction, year, stat, fipsCounty))
      .range(colorSwatches[direction])
    radii.domain(color.domain())

    // if (pageEls.nodes.drawCircles.checked) {
    if (false) {
      // countymapel.selectAll('path')
      //   .attr('fill', function (d) {
      //     let num = getVal(d.properties.geoid, year, direction, stat)
      //     return num === null ? '#fff' : color(num)
      //   })
      //   .attr('d', function (d, i) {
      //     let param = getVal(d.properties.geoid, year, direction, stat)
      //     return mapping.circle(d.properties.center, radii(param))
      //   })
    } else {
      let choroplethData = munge.choroplethData(munge.nestedFind(nested.CountyData, direction, year), stat)
      choropleth.colorScale(color).data(choroplethData)
      // pageEls.d3s.choropleth.call(choropleth)
    }

    // pageEls.d3s.mapSvg.select('.legendCells').remove() // update doesn't seem to call a color change on the legend
    // legend.scale(color)
    // pageEls.d3s.mapSvg.select('.legendQuant')
    //   .call(legend)

    // topCountyChart.colorScale(color).yAxisLabel(statFullName[stat])
    // topCountyOutOfStateChart.colorScale(color).yAxisLabel(statFullName[stat])
    // topStateChart.colorScale(color).yAxisLabel(statFullName[stat])
    //
    // let topCountyData = munge.dataTopNCounties(munge.nestedFind(nested.CountyData, direction, year), stat, fipsMap, 15, null)
    // pageEls.d3s.topCountyElement
    //     .datum(topCountyData)
    //     .call(topCountyChart)
    // let topCountyPopAvgString = calcAvgCountyPop(topCountyData)
    // pageEls.d3s.topCountyPopAvgEl.text(topCountyPopAvgString)
    //
    // let topCountyOutOfStateData = munge.dataTopNCounties(munge.nestedFind(nested.CountyData, direction, year), stat, fipsMap, 15, null, true)
    // pageEls.d3s.topCountyOutOfStateElement
    //     .datum(topCountyOutOfStateData)
    //     .call(topCountyOutOfStateChart)
    // let topCountyOutOfStatePopAvgString = calcAvgCountyPop(topCountyOutOfStateData)
    // pageEls.d3s.topCountyOutOfStatePopAvgEl.text(topCountyOutOfStatePopAvgString)
    //
    // let topStateData = munge.dataTopNStates(munge.nestedFind(nested.StateData, direction, year), stat, fipsMap, 15, '06')
    // pageEls.d3s.topStateElement
    //     .datum(topStateData)
    //     .call(topStateChart)
    //
    // if (!yearUpdate) {
    //   updateAnnualChart(year, direction, stat)
    // }
  } /* *** end changeInput() *** */

  /** @function updateAnnualChart
   * update the annual line chart using settings read from the page
   */
  function updateAnnualChart (year, direction, stat) {
    year = year || years[pageEls.nodes.yearSelector.value]
    direction = direction || pageEls.nodes.directionSelector.value
    stat = stat || pageEls.nodes.statisticSelector.value

    let state = pageEls.d3s.stateSelector.property('value')
    let annualData = munge.nestedFind(nested.StateDataByYear, direction, state)
      .map(function (d) {
        return {short: d.key, year: munge.fullYear(d.key), value: d.value[stat]}
      })
      .sort(function (a, b) {
        return a.short - b.short
      })
    annualChart
      .color(color.range()[5])
    pageEls.d3s.annualElement
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
