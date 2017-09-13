'use strict';
const fs = require('fs')
const d3 = require('d3-dsv')

const selectFeature = require('./selectFeature')

const path = '../data'
const years = ['1112', '1213', '1314', '1415']
const fips = process.argv[2] || '06075'

let countyCentroids = JSON.parse(fs.readFileSync(`${path}/geo/countyCentroids.geojson`, 'utf8'))
let countyShapes = JSON.parse(fs.readFileSync(`${path}/geo/counties.geojson`, 'utf8'))

// let fipsdata = fs.readFileSync(`${path}/raw/national_county.txt`, 'utf8')
// let fipscols = ['STATE','STATEFP','COUNTYFP','COUNTYNAME','CLASSFP']
// let fipsKey = csv(fipsdata, {columns: fipscols})

let focalFips = new Set()

// get unique fips
;['in','out'].forEach(direction => {
  years.forEach(year => {
    let file = `${path}/${fips}${direction}flow${year}.csv`
    let data = d3.csvParse(fs.readFileSync(file, 'utf8'))
    // do something else
    data.forEach(county=>{
      focalFips.add(county.y1_statefips+county.y1_countyfips)
      focalFips.add(county.y2_statefips+county.y2_countyfips)
    })
  })
})
focalFips = Array.from(focalFips)

let centroids = selectFeature(focalFips, 'GEOID', countyCentroids)
let shapes = selectFeature(focalFips, 'GEOID', countyShapes)

write(`${path}/${fips}-centroids.geojson`, centroids)
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
