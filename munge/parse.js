'use strict';
const fs = require('fs')
const d3 = require('d3-dsv')
// const topojson = require('topojson')

const selectFeature = require('./selectFeature')

const path = '../data'
const years = ['1112', '1213', '1314', '1415']
const fips = process.argv[2] || '06075'

let countyCentroids = JSON.parse(fs.readFileSync(`${path}/geo/countyCentroids.geojson`, 'utf8'))
let countyShapes = JSON.parse(fs.readFileSync(`${path}/geo/counties.geojson`, 'utf8'))

let fipsdata = fs.readFileSync(`${path}/raw/national_county.txt`, 'utf8')
let fipscols = ['STATE','STATEFP','COUNTYFP','COUNTYNAME','CLASSFP']
let fipsKey = d3.csvParseRows(fipsdata, (row, index)=>{
  return {state: row[0], statefp: row[1], countyfp: row[2], countyname:row[3], classfp:row[4]}
})


let focalFips = new Set()
let fipsNames = new Set()
let combined = {}

// get unique fips
;['in','out'].forEach(function (direction) {
  years.forEach(function (year) {
    let file = `${path}/${fips}/${fips}${direction}flow${year}.csv`
    let data = d3.csvParse(fs.readFileSync(file, 'utf8'))
    combined[year] = combined[year] || []

    data.forEach(function(county){
      combined[year].push({
        into: `${county.y1_statefips}${county.y1_countyfips}`,
        from: `${county.y2_statefips}${county.y2_countyfips}`,
        num: county.n1,
        deductions: county.n2,
        agi: county.agi
      })

      fipsNames.add(findFIP(county.y1_statefips, county.y1_countyfips))
      fipsNames.add(findFIP(county.y2_statefips, county.y2_countyfips))

      focalFips.add(county.y1_statefips+county.y1_countyfips)
      focalFips.add(county.y2_statefips+county.y2_countyfips)
    })
  })
})
focalFips = Array.from(focalFips)

let fipsNamesMap = new Map()
fipsNames.forEach(function(value){
  if (value != null) {
    fipsNamesMap.set(`${value.statefp}${value.countyfp}`, value.countyname)
  }
})


write(`${path}/${fips}data.json`, combined)
write(`${path}/fipsNames.json`, Array.from(fipsNamesMap))

let centroids = selectFeature(focalFips, 'GEOID', countyCentroids)
let shapes = selectFeature(focalFips, 'GEOID', countyShapes)

// write(`${path}/${fips}-centroids.topojson`, topojson.topology({cents:centroids}) )
write(`${path}/${fips}-centroids.geojson`, centroids )
write(`${path}/${fips}-shapes.geojson`, shapes)

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

function findFIP(stateFip, countyFip){
  return fipsKey.find((fip)=>{ return fip.statefp === stateFip && fip.countyfp === countyFip })
}