'use strict';
const fs = require('fs')
const csv = require('csv-parse/lib/sync')

const selectFeature = require('./selectFeature')

let countyCentroids = JSON.parse(fs.readFileSync('./data/geo/countyCentroids.geojson', 'utf8'))
let countyShapes = JSON.parse(fs.readFileSync('./data/geo/counties.geojson', 'utf8'))

const path = './data/'
const years = ['1112', '1213', '1314', '1415']
const fips = process.argv[2] || '06075'

// let fipsdata = fs.readFileSync(`${path}raw/national_county.txt`, 'utf8')
// let fipscols = ['STATE','STATEFP','COUNTYFP','COUNTYNAME','CLASSFP']
// let fipsKey = csv(fipsdata, {columns: fipscols})

let focalFips = new Set()

years.forEach(year => {
  let file = `${path}${fips}inflow${year}.csv`
  let data = csv(fs.readFileSync(file, 'utf8'), {columns: true})
  data.forEach(county=>{
    focalFips.add(county.y1_statefips+county.y1_countyfips)
    focalFips.add(county.y2_statefips+county.y2_countyfips)
  })
})
focalFips = Array.from(focalFips)

let centroids = selectFeature(focalFips, 'GEOID', countyCentroids)
let shapes = selectFeature(focalFips, 'GEOID', countyShapes)

write(`${path}${fips}-centroids.geojson`, centroids)
write(`${path}${fips}-shapes.geojson`, shapes)

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
