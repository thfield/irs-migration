import './style.css'
// import * as d3 from 'd3'
// import 'd3-queue'
// import * as d3_legend from 'd3-svg-legend'
// import * as topojson from 'topojson'
// import barChart from '../charts/bar-chart.js'


let fipsCounty = '06075'
let year = '1415'
let years = ['0405', '0506', '0607', '0708', '0809', '0910', '1011', '1112', '1213', '1314', '1415']
let direction = document.querySelector('#direction').value

let colorArray = {
  in: ["#fff","#00441b"],
  out: ["#fff",'#67000d']
}
let colorSwatches = {
  in: ["#f7fcf5","#e5f5e0","#c7e9c0","#a1d99b","#74c476","#41ab5d","#238b45","#006d2c","#00441b"],
  out: ['#fff5f0','#fee0d2','#fcbba1','#fc9272','#fb6a4a','#ef3b2c','#cb181d','#a50f15','#67000d']
}
let path = '../data'
let dataPath = `${path}/${fipsCounty}/${fipsCounty}combined.csv`
let shapesPath = `${path}/${fipsCounty}/${fipsCounty}shapes.topojson`
let statesPath = `${path}/geo/states.topojson`
let fipsPath = `${path}/fipscodes.csv`

d3.queue()
  .defer(d3.csv, dataPath)
  .defer(d3.json, statesPath)
  .defer(d3.json, shapesPath)
  .defer(d3.csv, fipsPath, function(row){
    return object.assign(row, {id: row.statefp.concat(row.countyfp)})
  })
  .await(initialDraw)

function initialDraw(error, data, us, counties, fips){
  if (error) {throw error}
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
  fips.forEach(function(row){
    fipsMap.set(row.id, row)
    fipsMap.set(row.statefp, row.state)
  })

  /**
   * nestedData nests data from d3.csvParse(00000combined.csv) by:
   *   -year: ['0405', ..., '1415']
   *     -direction: ['in', 'out']
   *        -array of
   *          -data: {agi,id,n1,n2,y1_countyfips,y1_statefips,y2_countyfips,y2_statefips,year}
   */
  let nestedData = d3.nest()
      .key(function(d) { return d.year; })
      .key(inOrOut)
      .sortValues(function(a,b){
        return Number.parseInt(b.n1)-Number.parseInt(a.n1)
      })
      .object(data)

  /**
   * stateTotalByYear nests data from d3.csvParse(00000combined.csv) by:
   *    -direction: ['in','out']
   *      -statefips: ['01', ..., '58']
   *        -year: ['0405', ..., '1415']
   *          -data: {n1,n2,agi}
   */
  let stateTotalByYear = d3.nest()
      .key(inOrOut)
      .key(function(d) {
        let direc = inOrOut(d)
        return d[targetFips(direc)[0]]
      })//.sortKeys(d3.ascending)
      .key(function(d) { return d.year; })
      .rollup(function(leaves) {
        return leaves.reduce(function (acc,cur){
          // don't count 'states' added by irs aggregation
          if( cur.y1_statefips > 58 || cur.y2_statefips > 58 ) { return acc }
          // don't count non-migrators (where year1residence === year2residence)
          if( cur.y1_statefips === cur.y2_statefips && cur.y1_countyfips === cur.y2_countyfips ) { return acc }

          let n1 = cur.n1 === -1 ? acc.n1 : acc.n1+Number.parseInt(cur.n1)
          let n2 = cur.n2 === -1 ? acc.n2 : acc.n2+Number.parseInt(cur.n2)
          let agi = cur.agi === -1 ? acc.agi : acc.agi+Number.parseInt(cur.agi)

          return {n1: n1, n2: n2, agi: agi}
        }, {n1:0,n2:0,agi:0})
      })
      .object( data )

  /**
   * stateTotal nests data from d3.csvParse(00000combined.csv) by:
   *    -direction: ['in','out']
   *      -statefips: ['01', ..., '58']
   *          -data: {n1,n2,agi}
   */
  let stateTotal = d3.nest()
      .key(inOrOut)
      .key(function(d) {
        let direc = inOrOut(d)
        return d[targetFips(direc)[0]]
      })
      .rollup(function(leaves) {
        return leaves.reduce(function (acc,cur){
          // don't count 'states' added by irs aggregation
          if( cur.y1_statefips > 58 || cur.y2_statefips > 58 ) { return acc }
          // don't count non-migrators (where year1residence === year2residence)
          if( cur.y1_statefips === cur.y2_statefips && cur.y1_countyfips === cur.y2_countyfips ) { return acc }

          let n1 = cur.n1 === -1 ? acc.n1 : acc.n1+Number.parseInt(cur.n1)
          let n2 = cur.n2 === -1 ? acc.n2 : acc.n2+Number.parseInt(cur.n2)
          let agi = cur.agi === -1 ? acc.agi : acc.agi+Number.parseInt(cur.agi)

          return {n1: n1, n2: n2, agi: agi}
        }, {n1:0,n2:0,agi:0})
      })
      .object( data )


  /**** begin color scale setting ****/
  let n1Vals = nestedData[year][direction].map(d => {
    return (d.y1_statefips < 58  && d.id !== fipsCounty && d.n1 != '-1') ?
      +d.n1
    :
      undefined
  })

  let color = d3.scaleQuantile()
    .range(colorSwatches[direction])
    .domain( n1Vals )
  /**** end color scale setting ****/


  /**** populate year selector dropdown ****/
  d3.select('#year').selectAll("option").data(object.keys(nestedData).sort())
    .enter().append('option')
    .attr('value', function(d){ return d })
    .attr('selected', function(d){ return d === '1415'?true:false })
    .text(fullYear)


  /**** start map drawing ****/
  let mapSvg = d3.select("#map svg")
  let path = d3.geoPath()
  let info = d3.select('#info')

  /**** draw legend ****/
  mapSvg.append("g")
    .attr("class", "legendQuant")
    .attr("transform", "translate(830,300)");
  var legend = d3.legendColor()
    .labelFormat(d3.format(",d"))
    .title("")
    .titleWidth(100)
    .cells(7)
    .scale(color);
  mapSvg.select(".legendQuant")
    .call(legend);

  /**** draw counties ****/
  let countymapel = mapSvg.append("g")
        .attr("class", "counties")
  countymapel.selectAll("path")
      .data(topojson.feature(counties, counties.objects.counties).features)
      .enter().append("path")
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.5)
        .attr("fill", function(d){
          let num = getVal(d.properties.geoid,year,direction)
          return num === null ? '#fff' : color(num)
        })
        .attr("id", function(d){ return d.geoid })
        .attr("d", path)
        .on('mouseover', ttOver)
        .on('mouseout', ttOut)

  /**** draw states ****/
  mapSvg.append("path")
      .attr("stroke-width", 0.5)
      .attr("d", path(topojson.mesh(us, us.objects.states)))

  /** @function getVal
   * @param {string} geoid - id = `${statefips}${countyfips}`
   * @param {string} year - one of ['0405', ..., '1415']
   * @param {string} direction - "in"||"out"
   * @returns {?number}
   * @description Returns either the value for the record with id=geoid or null
   */
  function getVal(geoid,year,direction) {
    let val = nestedData[year][direction].find(el=>el.id === geoid)
    return val === undefined ? null : val.n1
  }
  /**** tooltip handler functions ****/
  function ttOver(d){
    d3.select(this).classed('highlight', true)
    info.html(`<strong>${d.properties.name}, ${d.properties.state}</strong>: <span>${getVal(d.properties.geoid,year,direction)}</span>`)
  }
  function ttOut(d){
    d3.select(this).classed('highlight', false)
    info.html('')
  }
  /**** end map drawing ****/


  /**** start draw the barchart ****/
  let topCountyData = dataTopNCounties(nestedData[year][direction], 15)
  let topCountyElement = dimple.newSvg("#rank", 960, 400);
  var topCountyChart = new dimple.chart(topCountyElement, topCountyData)
  topCountyChart.setMargins(30, 30, 30, 80)
  topCountyChart.addCategoryAxis("x", "name");
  topCountyChart.addMeasureAxis("y", "value");
  topCountyChart.addSeries(null, dimple.plot.bar);
  topCountyChart.draw();
  /**** end draw the barchart ****/


  /**** start draw the linechart ****/
  let annualData = dataAnnualStatesForDimple(stateTotalByYear[direction], fipsMap)
  let annualElement = dimple.newSvg("#annual", 960, 400);
  var annualChart = new dimple.chart(annualElement, annualData)
  annualChart.setMargins(30, 30, 30, 40)
  annualChart.addCategoryAxis("x", "year")
  annualChart.addLogAxis("y", "value")
  annualChart.addSeries("name", dimple.plot.line)
  annualChart.addLegend(10, 20, 700, 40, "right")
  annualChart.draw()
  /**** end draw the linechart ****/


  /**** begin page interaction handlers ****/
  // document.querySelector('#year').onchange = function(e){
  //   year = e.target.value
  //   direction = document.querySelector('#direction').value
  //   n1Vals = nestedData[year][direction].map(d => (d.y1_statefips < 58  && d.id !== fipsCounty && d.n1 != '-1') ? +d.n1 : undefined)
  //
  //   color
  //       .domain( n1Vals )
  //       .range(colorSwatches[direction])
  //
  //   countymapel.selectAll("path")
  //         .attr("fill", function(d){
  //           let num = getVal(d.properties.geoid,year,direction)
  //           return color(num)
  //         })
  //
  //   // mapSvg.select(".legendQuant").remove() // update doesn't seem to call a color change on the legend
  //   legend.scale(color)
  //   mapSvg.select(".legendQuant")
  //     .call(legend);
  //
  //   topTenData = findTopN(nestedData[year][direction])
  //   topTenChart.data = topTenData
  //   topTenChart.draw(250,true)
  // }
  //
  // document.querySelector('#direction').onchange = function(e){
  //   year = document.querySelector('#year').value
  //   direction = e.target.value
  //   n1Vals = nestedData[year][direction].map(d => (d.y1_statefips < 58  && d.id !== fipsCounty && d.n1 != '-1') ? +d.n1 : undefined)
  //
  //   color
  //       .domain( d3.extent(n1Vals) )
  //       .range(colorArray[direction])
  //
  //   countymapel.selectAll("path")
  //     .attr("fill", function(d){
  //       let num = getVal(d.properties.geoid,year,direction)
  //       return color(num)
  //     })
  //   /**** draw the legend ****/
  //   mapSvg.append("g")
  //     .attr("class", "legendQuant")
  //     .attr("transform", "translate(830,300)");
  //
  //   mapSvg.select(".legendQuant").remove() // update doesn't seem to call a color change on the legend
  //   legend.scale(color)
  //   mapSvg.select(".legendQuant")
  //     .call(legend)
  //
  //   topTenData = findTopN(nestedData[year][direction])
  //   topTenChart.colorSchema(colorSwatches[direction])
  //   topTenElement.datum(topTenData).call(topTenChart)
  // }
  /**** end page interaction handlers ****/



  /*******************************************************************************
          data munge functions
  *******************************************************************************/

  /** @function dataTopNCounties
   * @param { object[] } data - array of records sorted descending to return "top"
   * @param { number } [n=10] - first n records to return
   * @returns { object[] }
   */
  function dataTopNCounties(data, n=10){
    let topN = []
    let i = 0
    while(topN.length < n){
      let cond1 = data[i].id !== fipsCounty
      let cond2 = data[i][targetFips(direction)[0]] < 58
      if(cond1 && cond2){
        let res = {
          name: fipsMap.get(data[i].id).name,
          value: +data[i].n1,
          id: data[i].id
          // color: color(getVal(data[i].id,year,direction))
        }
        topN.push(res)
      }
      i++
    }
    return topN
  }

  /** @function dataAnnualStatesForDimple
   * @param { object[] } data - stateTotalByYear[direction]
   * @returns { object[] } - example: {fips:"10", name:"DE", year:"2004-2005", value:15}
   * @description returns data in form for use in dimple line chart
   */
  function dataAnnualStatesForDimple(data){
    return object.keys(data).map(function(state){
      if (state > 57){ return }
      let statename = fipsMap.get(state)
      let res = years.map(function(yr){
        let val = data[state][yr] ?
            data[state][yr].n1
          :
            0
        return {fips: state, name: statename, year: fullYear(yr), value: val}
      })
      return res
    })
    // remove (state > 57: undefined) placeholders
    .filter(function(el){ return el != undefined })
    // flatten array of arrays: [[1],[2],[3]] -> [1,2,3]
    .reduce(function(a, b) {
      return a.concat(b);
    }, []);
  }

  /** @function dataAnnualTopNStates
   * @param { object } data - stateTotal.in || stateTotal.out
   * @param { number } [n=10] - number of data to return
   * @returns { object[] } { fips,name,value }
   */
  function dataAnnualTopNStates(data, n=10) {
    return object.keys(data).map(function(state){
      if (state > 57){ return }
      let statename = fipsMap.get(state)
      return {fips: state, name: statename, value: data[state].n1}
    })
    // remove (state > 57: undefined) placeholders
    .filter(function(el){ return el != undefined })
    .sort(function (a,b) {
      return Number.parseInt(b.value)-Number.parseInt(a.value)
    })
    .slice(0,n)
  }
}



/*******************************************************************************
        data munge helper functions
*******************************************************************************/

/** @function inOrOut
 * @param { object } d - d3.csvParse'd row of data from `000000combined.csv` file
 * @returns { string } 'in' or 'out', meaning 'immigration into' or
 * 'emigration out of' the county of interest
 */
function inOrOut(d) {
  return d.id === `${d.y1_statefips}${d.y1_countyfips}` ? 'in' : 'out'
}

/** @function targetFips
 * @param { string } direction - "in" or "out"
 * @returns { string[] } - property values for accessing d3.csvParsed data object
 * return[0] is state fips property name
 * return[1] is county fips property name
 * when direction == 'in', we are interested in the y1 data
 * when direction == 'out', we are intertest in the y2 data
 */
function targetFips(direction){
  if (direction === 'out'){
    return ['y2_statefips', 'y2_countyfips']
  }
  return ['y1_statefips', 'y1_countyfips']
}

/** @function fullYear
 * @param { string } d - ex: "0405"
 * @returns { string } - ex: "2004-2005"
 * @description formats 2digit/2years string into 4digit/2years with hyphen
 */
function fullYear(d) {
  let res = /(\d{2})(\d{2})/.exec(d)
  res[1] = res[1] > 79 ? `19${res[1]}` : `20${res[1]}`
  res[2] = res[2] > 79 ? `19${res[2]}` : `20${res[2]}`
  return `${res[1]}-${res[2]}`
}