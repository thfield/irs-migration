import './style.css'
import * as d3 from 'd3'
import 'd3-queue'
import * as d3_legend from 'd3-svg-legend'
import * as topojson from 'topojson'
import barChart from '../charts/bar-chart.js'

let fipsCounty = '06075'
let year = '1415'
let direction = document.querySelector('#direction').value

let colorArray = {
in: ["#fff","#f7fcf5","#e5f5e0","#c7e9c0","#a1d99b","#74c476","#41ab5d","#238b45","#006d2c","#00441b"],
out: ["#fff",'#fff5f0','#fee0d2','#fcbba1','#fc9272','#fb6a4a','#ef3b2c','#cb181d','#a50f15','#67000d']
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
    return Object.assign(row, {id: row.statefp.concat(row.countyfp)})
  })
  .await(initialDraw)

function initialDraw(error, data, us, counties, fips){
  if (error) {throw error}
  let fipsMap = new Map()
  fips.forEach(function(row){
    fipsMap.set(row.id, row)
  })

  let nestedData = d3.nest()
      .key(function(d) { return d.year; })
      .key(inOrOut)
      .sortValues(function(a,b){
        return Number.parseInt(b.n1)-Number.parseInt(a.n1)
      })
      .object(data);

  d3.select('#year').selectAll("option").data(Object.keys(nestedData).sort())
    .enter().append('option')
    .attr('value', function(d){ return d })
    .attr('selected', function(d){ return d === '1415'?true:false })
    .text(fullYear)

  let stateTotalByYear = d3.nest()
      .key(function(d) { return d.year; })
      .key(inOrOut).sortValues(function(a,b){
        return Number.parseInt(b.n1)-Number.parseInt(a.n1)
      })
      .key(function(d) {
        let dir = inOrOut(d)
        return d[targetFips(dir)[0]]
      }).sortKeys(d3.ascending)
      .rollup(function(leaves) {
        return leaves.reduce(function (acc,cur){
          // don't count non-migrators (where year1residence === year2residence)
          if( cur.y1_statefips > 58 || cur.y2_statefips > 58) { return acc }
          if( cur.y1_statefips === cur.y2_statefips && cur.y1_countyfips === cur.y2_countyfips ) { return acc }

          let n1 = cur.n1 === -1 ? acc.n1 : acc.n1+Number.parseInt(cur.n1)
          let n2 = cur.n2 === -1 ? acc.n2 : acc.n2+Number.parseInt(cur.n2)
          let agi = cur.agi === -1 ? acc.agi : acc.agi+Number.parseInt(cur.agi)

          return {n1: n1, n2: n2, agi: agi}
        }, {n1:0,n2:0,agi:0})
      })
      .object( data )

  function inOrOut(d){
    return d.id === `${d.y1_statefips}${d.y1_countyfips}` ? 'in' : 'out'
  }

  function targetFips(direction){
    if (direction === 'out'){
      return ['y2_statefips', 'y2_countyfips']
    }
    return ['y1_statefips', 'y1_countyfips']
  }

  let color = d3.scaleQuantile()
    .range(colorArray[direction])
    .domain( nestedData[year][direction].map(d => (d.y1_statefips < 58  && d.id !== fipsCounty && d.n1 != '-1') ? +d.n1 : 0) )

  let mapSvg = d3.select("#map svg")
  let path = d3.geoPath()
  let info = d3.select('#info')

  /* *** draw the legend *** */
  mapSvg.append("g")
    .attr("class", "legendQuant")
    .attr("transform", "translate(830,300)");

  var legend = d3_legend.legendColor()
    .labelFormat(d3.format(",d"))
    .title("")
    .titleWidth(100)
    .scale(color);
  mapSvg.select(".legendQuant")
    .call(legend);

  /* *** draw the map *** */
  let countymapel = mapSvg.append("g")
        .attr("class", "counties")

  countymapel.selectAll("path")
      .data(topojson.feature(counties, counties.objects.counties).features)
      .enter().append("path")
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.5)
        .attr("fill", function(d){
          let num = getVal(d.properties.geoid,year,direction)
          return color(num)
        })
        .attr("id", function(d){ return d.geoid })
        .attr("d", path)
        .on('mouseover', ttOver)
        .on('mouseout', ttOut)

  mapSvg.append("path")
      .attr("stroke-width", 0.5)
      .attr("d", path(topojson.mesh(us, us.objects.states)))

  function getVal(geoid,year,direction) {
    let val = nestedData[year][direction].find(el=>el.id === geoid)
    return val === undefined ? null : val.n1
  }

  function ttOver(d){
    d3.select(this).classed('highlight', true)
    info.html(`<strong>${d.properties.name}, ${d.properties.state}</strong>: <span>${getVal(d.properties.geoid,year,direction)}</span>`)
  }

  function ttOut(d){
    d3.select(this).classed('highlight', false)
    info.html('')
  }

  /* *** draw the barchart *** */
  let topTen = findTopN(nestedData[year][direction])

  /**
    * function findTopN
    * @param { object[] } data - array of records sorted descending to return "top"
    * @param { integer } n - first n records to return
    * @returns { object[] }
    */
  function findTopN(data, n=10){
    let topN = []
    let i = 0
    while(topN.length < n){
      let cond1 = data[i].id !== fipsCounty
      let cond2 = data[i][targetFips(direction)[0]] < 58
      if(cond1 && cond2){
        let res = {
          x: fipsMap.get(data[i].id).name,
          y: +data[i].n1,
          id: data[i].id,
          color: color(getVal(data[i].id,year,direction))
        }
        topN.push(res)
      }
      i++
    }
    return topN
  }

  let topTenElement = d3.select('#rank')
  let chartWidth = 960
  let chartHeight = 500
  let topTenBar = barChart()
    .margin({bottom: 120})
    .width(chartWidth)
    .height(chartHeight)

  topTenElement.datum(topTen).call(topTenBar)

  document.querySelector('#year').onchange = function(e){
    year = e.target.value
    direction = document.querySelector('#direction').value

    color
        .domain( nestedData[year][direction].map(d => (d.y1_statefips < 58  && d.id !== fipsCounty && d.n1 != '-1') ? +d.n1 : 0) )
        .range(colorArray[direction])

    countymapel.selectAll("path")
          .attr("fill", function(d){
            let num = getVal(d.properties.geoid,year,direction)
            return color(num)
          })

    mapSvg.select(".legendQuant").remove() // update doesn't seem to call a color change on the legend
    legend.scale(color)
    mapSvg.select(".legendQuant")
      .call(legend);

    topTen = findTopN(nestedData[year][direction])
    topTenElement.datum(topTen).call(topTenBar)
  }

  document.querySelector('#direction').onchange = function(e){
    year = document.querySelector('#year').value
    direction = e.target.value

    color
        .domain( nestedData[year][direction].map(d => (d.y1_statefips < 58  && d.id !== fipsCounty && d.n1 != '-1') ? +d.n1 : 0) )
        .range(colorArray[direction])

    countymapel.selectAll("path")
      .attr("fill", function(d){
        let num = getVal(d.properties.geoid,year,direction)
        return color(num)
      })
    /* *** draw the legend *** */
    mapSvg.append("g")
      .attr("class", "legendQuant")
      .attr("transform", "translate(830,300)");

    mapSvg.select(".legendQuant").remove() // update doesn't seem to call a color change on the legend
    legend.scale(color)
    mapSvg.select(".legendQuant")
      .call(legend)

    topTen = findTopN(nestedData[year][direction])
    topTenElement.datum(topTen).call(topTenBar)
  }
}



function fullYear(d) {
  let res = /(\d{2})(\d{2})/.exec(d)
  res[1] = res[1] > 79 ? `19${res[1]}` : `20${res[1]}`
  res[2] = res[2] > 79 ? `19${res[2]}` : `20${res[2]}`
  return `${res[1]}-${res[2]}`
}