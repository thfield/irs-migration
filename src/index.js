import './style.css'
import * as d3 from 'd3'
import 'd3-queue'
import * as d3_legend from 'd3-svg-legend'
import * as topojson from 'topojson'

let fipsCounty = '06075'
let year = '1415'
let direction = 'in'

let colorArray = ["#fff","#f7fcf5","#e5f5e0","#c7e9c0","#a1d99b","#74c476","#41ab5d","#238b45","#006d2c","#00441b"]

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
  .await(draw)

function draw(error, data, us, counties, fips){
  if (error) {throw error}
  let fipsMap = new Map()
  fips.forEach(function(row){
    fipsMap.set(row.id, row)
  })

  let nestedData = d3.nest()
      .key(function(d) { return d.year; })
      .key(function(d) {
        return d.id === `${d.y1_statefips}${d.y1_countyfips}` ? 'in' : 'out'
      })
      .sortValues(function(a,b){
        return Number.parseInt(b.n1)-Number.parseInt(a.n1)
      })
      .object(data);

  // let inflowData = d3.nest()
  //     .key(function(d) {
  //       return targetFips(direction)[0]
  //     }).sortKeys(d3.ascending)
  //     .rollup(function(leaves) {
  //       return leaves.reduce(function (acc,cur){
  //         // don't count non-migrators (where year1residence === year2residence)
  //         if( cur.y1_statefips === cur.y2_statefips && cur.y1_countyfips === cur.y2_countyfips ) { return acc }
  //
  //         let n1 = cur.n1 === -1 ? acc.n1 : acc.n1+Number.parseInt(cur.n1)
  //         let n2 = cur.n2 === -1 ? acc.n2 : acc.n2+Number.parseInt(cur.n2)
  //         let agi = cur.agi === -1 ? acc.agi : acc.agi+Number.parseInt(cur.agi)
  //
  //         return {n1: n1, n2: n2, agi: agi}
  //       },{n1:0,n2:0,agi:0})
  //     })
  //     .object( nestedData[year]['in'].filter(d=>{return d.y1_statefips < 58 && d.y2_statefips < 58}) )

  function targetFips(direction){
    if (direction === 'out'){
      return ['y2_statefips', 'y2_countyfips']
    }
    return ['y1_statefips', 'y1_countyfips']
  }

  let color = d3.scaleQuantile()
    .range(colorArray)
    .domain( nestedData[year][direction].map(d => (d.y1_statefips < 58  && d.id !== fipsCounty && d.n1 != '-1') ? +d.n1 : 0) )

  let svg = d3.select("#map svg")
  let path = d3.geoPath()
  let info = d3.select('#info')

  /* *** draw the legend *** */
  svg.append("g")
    .attr("class", "legendQuant")
    .attr("transform", "translate(830,300)");

  var legend = d3_legend.legendColor()
    .labelFormat(d3.format(",d"))
    .title("")
    .titleWidth(100)
    .scale(color);
  svg.select(".legendQuant")
    .call(legend);

  /* *** draw the map *** */
  svg.append("g")
        .attr("class", "counties")
      .selectAll("path")
      .data(topojson.feature(counties, counties.objects.counties).features)
      .enter().append("path")
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.5)
        .attr("fill", function(d){
          let num = getVal(d.properties.geoid)
          return color(num)
        })
        .attr("id", function(d){ return d.geoid })
        .attr("d", path)
        .on('mouseover', ttOver)
        .on('mouseout', ttOut)

  svg.append("path")
      .attr("stroke-width", 0.5)
      .attr("d", path(topojson.mesh(us, us.objects.states)))

  function getVal(geoid) {
    let val = nestedData[year][direction].find(el=>el.id === geoid)
    return val === undefined ? null : val.n1
  }

  function ttOver(d){
    d3.select(this).classed('highlight', true)
    info.html(`<strong>${d.properties.name}, ${d.properties.state}</strong>: <span>${getVal(d.properties.geoid)}</span>`)
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
        topN.push(data[i])
      }
      i++
    }
    return topN
  }


  // set the dimensions and margins of the graph
  let margin = {top: 20, right: 20, bottom: 30, left: 40},
      width = 960 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

  // set the ranges
  let x = d3.scaleBand()
            .range([0, width])
            .padding(0.1);
  let y = d3.scaleLinear()
            .range([height, 0]);

  // append the svg object to the body of the page
  // append a 'group' element to 'svg'
  // moves the 'group' element to the top left margin
  let barSvg = d3.select("#rank").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");
  // Scale the range of the data in the domains
  x.domain( topTen.map(function(d){return fipsMap.get(d.id).name}) );
  y.domain( [0, d3.max(topTen, d=>+d.n1 )] );

  // append the rectangles for the bar chart
  barSvg.selectAll(".bar")
      .data(topTen)
    .enter().append("rect")
      .attr("class", "bar")
      .attr("x", function(d) { return x(fipsMap.get(d.id).name); })
      .attr("width", x.bandwidth())
      .attr("y", function(d) { return y(+d.n1); })
      .attr("height", function(d) { return height - y(+d.n1); })
      .attr("fill", function(d){
        let num = getVal(d.id)
        return color(num)
      })

  // add the x Axis
  barSvg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));

  // add the y Axis
  barSvg.append("g")
      .call(d3.axisLeft(y));
}

