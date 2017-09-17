import './style.css'
import * as d3 from 'd3'
import   'd3-queue'
import * as topojson from 'topojson'

// import us from '../data/geo/states.topojson'
// import sf from '../data/06075/06075inflow1415.csv'

const fipsCounty = '06075'
let year = '1415'


let colorArray = ["#fff", "#f7fcf5","#e5f5e0","#c7e9c0","#a1d99b","#74c476","#41ab5d","#238b45","#006d2c","#00441b"]

let dataPath = `../data/${fipsCounty}/${fipsCounty}inflow${year}.csv`
let shapesPath = `../data/${fipsCounty}/${fipsCounty}shapes.topojson`

d3.queue()
  .defer(d3.csv, dataPath)
  .defer(d3.json, '../data/geo/states.topojson')
  .defer(d3.json, shapesPath)
  .await(draw)

function draw(error, data, us, counties){
  let minmaxIn = d3.extent(data, function(d){
    return d.y1_statefips < 57 ? d.n1 : 0
  })

  let color = d3.scaleQuantile()
    .range(colorArray)
    .domain(minmaxIn)

  var svg = d3.select("svg");
  var path = d3.geoPath();

  svg.append("g")
        .attr("class", "counties")
      .selectAll("path")
      .data(topojson.feature(counties, counties.objects.counties).features)
      .enter().append("path")
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.5)
        .attr("fill", function(d){
          let num = getVal(d.statefp, d.countyfp)
          return color(num)
        })
        .attr("id", function(d){ return d.geoid })
        .attr("d", path);

  svg.append("path")
      .attr("stroke-width", 0.5)
      .attr("d", path(topojson.mesh(us, us.objects.states)));

  function getVal(statefp, countyfp) {
    let fips = statefp.concat(countyfp)
    let foo = us.find(function(el){
      return el.statefp === fips
    })

    return foo === undefined ? null : foo.num
  }
}



