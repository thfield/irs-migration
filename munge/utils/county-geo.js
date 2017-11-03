'use strict'
const fs = require('fs')
const turf = require('@turf/turf')
const topojson = require('topojson')
const d3 = require('d3-dsv')
Object.assign(d3, require('d3-array'), require('d3-geo'), require('d3-geo-projection'))

const selectFeature = require('./selectFeature')

/** @function geoParse
 * @param {string} fips - fips code of target county
 * @param {string} path - path to data
 * @param {Map} fipsKey - {fips: name} pairing
 * @param {string[]} focalFips - array of fips codes of interest
 * @returns {string} topojson of county features
 */
function geoParse (fips, path, fipsKey, focalFips) {
  // get geoJSON of all counties in US
  let countyGeojson = JSON.parse(fs.readFileSync(`${path}/geo/counties.geojson`, 'utf8'))
  // select counties of focus
  let shapes = selectFeature(focalFips, 'GEOID', countyGeojson)

  // find center of counties
  let centers = findCentersOfMass(shapes)

  // apply projection
  shapes = d3.geoProject(shapes, d3.geoAlbersUsa())
  centers = d3.geoProject(centers, d3.geoAlbersUsa())

  // get rid of extra properties
  shapes.features = shapes.features.map(filterFeatures)
  // centers.features = centers.features.map(filterFeatures)

  // transform to topojson format
  let countyTopojson = topojson.topology({counties: shapes}, '1e6')
  // simplify(?)
  // topojson.simplify(countyTopojson, 0.1)

  function filterFeatures (feature) {
    let center = centers.features.find(function (d) {
      return d.properties.GEOID === feature.properties.GEOID
    }).geometry.coordinates

    feature.properties = {
      statefp: feature.properties.STATEFP,
      countyfp: feature.properties.COUNTYFP,
      name: feature.properties.NAME,
      state: fipsKey.get(`${feature.properties.STATEFP}${feature.properties.COUNTYFP}`).state,
      geoid: feature.properties.GEOID,
      center: center
    }
    return feature
  }
  return countyTopojson
}

function findCentersOfMass (geojson) {
  let arr = geojson.features.map((feat) => {
    let centroid = turf.centerOfMass(feat)
    centroid.properties = feat.properties
    return centroid
  })
  return turf.featureCollection(arr)
}

module.exports = geoParse
