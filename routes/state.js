var express = require('express')
var router = express.Router()
var Sequelize = require('sequelize')
var models = require('../models')

// const shared = require('./shared')
const turf = require('@turf/turf')
const topojson = require('topojson')
const d3 = require('d3-geo-projection')
// Object.assign(d3, require('d3-array'), require('d3-geo'), require('d3-geo-projection'))
Object.assign(d3, require('d3-geo'))

/* GET users listing. */
router.get('/:statefp', function (req, res, next) {
  let errHandle = err => { console.error(err); res.status(400).send(err.message) }

  models.Lineshape.findAll({
    where: {
      statefp: req.params.statefp
    },
  })
  .then(sendResponse)
  .catch(errHandle)

  function sendResponse (counties) {
    // res.send(counties)
    let shapes = counties.map(function (co) {
      let geojson = JSON.parse(co.geojson)
      let newProps = {
        statefp: geojson.properties.statefp,
        countyfp: geojson.properties.countyfp,
        name: geojson.properties.name,
        geoid: geojson.properties.geoid
      }
      geojson.properties = newProps
      return geojson
    }).filter(function (co) { return co !== undefined })
    shapes = turf.featureCollection(shapes)

    // apply projection
    // shapes = d3.geoProject(shapes, d3.geoAlbersUsa())

    // transform to topojson format
    let countyTopojson = topojson.topology({counties: shapes}, '1e6')

    res.send(countyTopojson)
  }

  // models.County.findById(req.params.fips, {include: [models.Lineshape, models.Population]})
  //   .then(foo1)
  //   .catch(errHandle)
  //
  // function foo1 (county) {
  //   let answer = JSON.stringify(county)
  //   res.send(answer)
  // }
})

module.exports = router
