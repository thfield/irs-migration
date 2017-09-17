'use strict'
const fs = require('fs')
const turf = require('@turf/turf')
const topojson = require('topojson')
const d3 = require('d3-dsv')
Object.assign(d3, require('d3-array'), require('d3-geo'), require('d3-geo-projection'))

const selectFeature = require('./selectFeature')

const path = '../data'
const years = ['1112', '1213', '1314', '1415']
const fips = process.argv[2] || '06075'

let fipsKey = new Map()
d3.csvParseRows( fs.readFileSync(`${path}/raw/national_county.txt`, 'utf8'), function(row){
  fipsKey.set(row[1].toString().concat(row[2]), {
    state: row[0],
    statefp: row[1],
    countyfp: row[2],
    name: row[3]
  })
  return null
})

// get unique fips
let focalFips = new Set()
;['inflow','outflow'].forEach(function (direction) {
  years.forEach(function (year) {
    let file = `${path}/${fips}/${fips}${direction}${year}.csv`
    let data = d3.csvParse(fs.readFileSync(file, 'utf8'))
    // want to save csv like:
    // id,y1_statefips,y1_countyfips,y2_statefips,y2_countyfips,y2_state,y2_countyname,n1,n2,agi
    // where id=statefips.concat(countyfips)

    data.forEach(function(county){
      focalFips.add(county.y1_statefips+county.y1_countyfips)
      focalFips.add(county.y2_statefips+county.y2_countyfips)
    })
  })
})
focalFips = Array.from(focalFips)

// select counties of focus
let countyGeojson = JSON.parse(fs.readFileSync(`${path}/geo/counties.geojson`, 'utf8'))
let shapes = selectFeature(focalFips, 'GEOID', countyGeojson)

// find center of counties
let centers = findCentersOfMass(shapes)

// apply projection
shapes = d3.geoProject(shapes, d3.geoAlbersUsa())
centers = d3.geoProject(centers, d3.geoAlbersUsa())

// get rid of extra properties
shapes.features = shapes.features.map(filterFeatures)
centers.features = centers.features.map(filterFeatures)

//transform to topojson format
let countyTopojson = topojson.topology({counties: shapes, centers:centers}, '1e6')
//simplify(?)
// topojson.simplify(countyTopojson, 0.1)

//save topojson file
write( `${path}/${fips}/${fips}shapes.topojson`, countyTopojson )

function findCentersOfMass(geojson){
  let arr = geojson.features.map((feat)=>{
    let centroid = turf.centerOfMass(feat)
    centroid.properties = feat.properties
    return centroid
  })
  return turf.featureCollection(arr)
}

function filterFeatures(feature){
  feature.properties = {
    statefp:feature.properties.STATEFP,
    countyfp:feature.properties.COUNTYFP,
    name:feature.properties.NAME,
    state: fipsKey.get(`${feature.properties.STATEFP}${feature.properties.COUNTYFP}`).state,
    geoid: feature.properties.GEOID
  }
  return feature
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