// import * as d3 from 'd3'
// import * as topojson from 'topojson'

import us from '../data/geo/10m.json'
import sf from '../data/06075data.json'

const fipsCounty = '06075'
let year = '1415'

let colorArray = ["#fff", "#f7fcf5","#e5f5e0","#c7e9c0","#a1d99b","#74c476","#41ab5d","#238b45","#006d2c","#00441b"]

let minmaxIn = d3.extent(sf[year], function(d){
  return d.into === fipsCounty ? d.num : 0
})
// let minmaxOut = d3.extent(sf[year], function(d){
//   return d.from === fipsCounty ? d.num : 0
// })


let color = d3.scaleQuantile()
  .range(colorArray)
  .domain(minmaxIn)


var svg = d3.select("svg");
var path = d3.geoPath();

svg.append("g")
      .attr("class", "counties")
    .selectAll("path")
    .data(topojson.feature(us, us.objects.counties).features)
    .enter().append("path")
      .attr("stroke", "#fff")
      .attr("stroke-width", 0.5)
      .attr("fill", function(d){
        let num = getVal(d.id)
        return color(num)
      })
      .attr("id", function(d){ return d.id })
      .attr("d", path);

svg.append("path")
    .attr("stroke-width", 0.5)
    .attr("d", path(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; })));

svg.append("path")
    .attr("d", path(topojson.feature(us, us.objects.nation)));



function getVal(fips) {
  let foo = sf[year].find(function(el){
    return el.from === fips
  })

  return foo === undefined ? null : foo.num
}