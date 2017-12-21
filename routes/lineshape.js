var express = require('express')
var csv = require('csv-express')
var router = express.Router()
var models = require('../models')

/* GET users listing. */
router.get('/:fips', function (req, res, next) {
  // check that fips is valid
  // get county migration data for fips:
  //   - where fipsIn === fips && fipsOut === fips
  // get lineshapes for all
  // return topojson

  models.Lineshape.findOne({
    where: {fips: req.params.fips}
  }).then(function (lineshape) {
    res.send(lineshape.geojson)
  }).catch(err => { res.send(err) })
})

module.exports = router
