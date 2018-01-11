var express = require('express')
var router = express.Router()
var models = require('../models')
const shared = require('./shared')
const turf = require('@turf/turf')
const topojson = require('topojson')
const d3 = require('d3-geo-projection')
// Object.assign(d3, require('d3-array'), require('d3-geo'), require('d3-geo-projection'))
Object.assign(d3, require('d3-geo'))

/* GET users listing. */
router.get('/:fips', function (req, res, next) {
  let errHandle = err => { console.error(err); res.status(400).send(err.message) }
  let direction = req.query.direction || 'in'

  models.Migration.findAll({
    where: whichMigrations(direction),
    attributes: ['fipsIn', 'fipsOut']
  })
  .then(getCounties)
  .then(sendResponse)
  .catch(errHandle)

  function whichMigrations (direction) {
    return direction === 'in'
      ? {fipsIn: req.params.fips}
      : {fipsOut: req.params.fips}
  }

  function getCounties (migrations) {
    let unique = shared.uniqueFips(migrations, direction)
    return models.County.findAll({
      where: {fips: unique},
      include: [models.Lineshape]
    })
  }

  function sendResponse (counties) {
    let shapes = counties.map(function (co) {
      let geojson = JSON.parse(co.Lineshape.geojson)
      let newProps = {
        statefp: geojson.properties.STATEFP,
        countyfp: geojson.properties.COUNTYFP,
        name: geojson.properties.NAME,
        state: co.state,
        geoid: geojson.properties.GEOID
      }
      geojson.properties = newProps
      return geojson
    }).filter(function (co) { return co !== undefined })
    shapes = turf.featureCollection(shapes)
    // find center of counties
    let centers = findCentersOfMass(shapes)

    // apply projection
    shapes = d3.geoProject(shapes, d3.geoAlbersUsa())
    centers = d3.geoProject(centers, d3.geoAlbersUsa())

    // put centers
    shapes.features = shapes.features.map(function (co) {
      co.properties.center = centers.features.find(function (d) {
        return d.properties.geoid === co.properties.geoid
      }).geometry.coordinates
      return co
    })

    // transform to topojson format
    let countyTopojson = topojson.topology({counties: shapes}, '1e6')

    res.send(countyTopojson)
  }
})

function findCentersOfMass (geojson) {
  let arr = geojson.features.map((feat) => {
    let centroid = turf.centerOfMass(feat)
    centroid.properties = feat.properties
    return centroid
  })
  return turf.featureCollection(arr)
}

module.exports = router
