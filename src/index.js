import './style.css'
import * as d3 from 'd3'
import 'd3-queue'
import * as d3_legend from 'd3-svg-legend'
import * as topojson from 'topojson'

const fipsCounty = '06075'
let year = '1415'

let colorArray = ["#fff","#f7fcf5","#e5f5e0","#c7e9c0","#a1d99b","#74c476","#41ab5d","#238b45","#006d2c","#00441b"]

let path = '../data'
let dataPath = `${path}/${fipsCounty}/${fipsCounty}inflow${year}.csv`
let shapesPath = `${path}/${fipsCounty}/${fipsCounty}shapes.topojson`
let statesPath = `${path}/geo/states.topojson`

d3.queue()
  .defer(d3.csv, dataPath, function(row){
    return Object.assign( row, {id: `${row.y1_statefips}${row.y1_countyfips}`} )
  })
  .defer(d3.json, statesPath)
  .defer(d3.json, shapesPath)
  .await(draw)

function draw(error, migration, us, counties){
  let color = d3.scaleQuantile()
    .range(colorArray)
    .domain( migration.map(d => (d.y1_statefips < 57 && d.id !== fipsCounty) ? +d.n1 : 0) )

  let ind = migration.findIndex(el => {
    return el.y1_statefips < 57 && el.id !== fipsCounty
  })
  let topTen = migration.slice(ind, ind+10)

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
    let val = migration.find(el=>el.id === geoid)
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
  x.domain(topTen.map(el=>el.y1_countyname));
  y.domain( [0, d3.max(topTen, el=>+el.n1 )] );

  // append the rectangles for the bar chart
  barSvg.selectAll(".bar")
      .data(topTen)
    .enter().append("rect")
      .attr("class", "bar")
      .attr("x", function(d) { return x(d.y1_countyname); })
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

