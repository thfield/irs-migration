var express = require('express')
var csv = require('csv-express')
var router = express.Router()
var models = require('../models')
// var countymigrations = require('../models/countymigration.js')
// var countypops = require('../models/countypop.js')

/* GET users listing. */
router.get('/:fips', function (req, res, next) {
  // check that fips is valid
  // get county migration data for fips:
  //   - where fipsIn === fips && fipsOut === fips
  // join with population for county with "other fips" && year
  // pick out "interesting information"
  // return csv

  models.County.findAll({
    where: {fips: req.params.fips},
    attributes: ['fips', 'state', 'statefp', 'countyfp', 'name']
  }).then(function (county) {
    // res.send(county)
    let foo = county.map(f => f.get({plain: true})) // only get interesting information
    res.csv(foo, true) // 2nd param "true" returns header row
  }).catch(err => { res.send(err) })
})

module.exports = router