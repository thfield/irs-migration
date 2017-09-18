'use strict'

const fs = require('fs')
const topojson = require('topojson')
const d3 = require('d3')

const fipsCounty = '06075'
const years = ['1112', '1213', '1314', '1415']

let path = '../data'
let shapesPath = `${path}/${fipsCounty}/${fipsCounty}shapes.topojson`
let statesPath = `${path}/geo/states.topojson`
let us = JSON.parse(fs.readFileSync(statesPath, 'utf8'))
let counties = JSON.parse(fs.readFileSync(shapesPath, 'utf8'))
let colorArray = ["#fff","#f7fcf5","#e5f5e0","#c7e9c0","#a1d99b","#74c476","#41ab5d","#238b45","#006d2c","#00441b"]

let migrationData = {}
let vals = []
years.forEach(function (year) {
  let dataPath = `${path}/${fipsCounty}/${fipsCounty}inflow${year}.csv`
  migrationData[year] = d3.csvParse( fs.readFileSync(dataPath, 'utf8'),function(row){
    return Object.assign( row, {id: `${row.y1_statefips}${row.y1_countyfips}`} )
  })
  vals = vals.concat(migrationData[year].map(d => (d.y1_statefips < 57 && d.id !== fipsCounty) ? +d.n1 : 0))
})

let color = d3.scaleQuantile()
  .range(colorArray)
  .domain( vals )

// save values to create legend using legend.html
write('./vals.json', vals)

years.forEach(function(year){
  // console.log(counties.objects.counties.geometries[10].properties.fill);
  counties.objects.counties.geometries.forEach(function(county){
    let v = getVal(year, county.properties.geoid)
    county.properties.fill = color(v)
  })
  // console.log(counties.objects.counties.geometries[10].properties.fill);
  write(`${path}/${fipsCounty}/cmd/${fipsCounty}_${year}.topojson`, counties)
})


function getVal(year, geoid) {
  let val = migrationData[year].find(el=>el.id === geoid)
  return val === undefined ? 0 : val.n1
}



// output the file
function write(filename, text){
  if (typeof text != 'string') text = JSON.stringify(text)
  fs.writeFile(filename, text,
    function(err) {
      if (err) { return console.log(err); }
      console.log('The file was saved as', filename);
    }
  )
}