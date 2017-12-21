var express = require('express')
var csv = require('csv-express')
var router = express.Router()
var Sequelize = require('sequelize')
var models = require('../models')
const h = require('../munge/utils/helpers')

/* GET users listing. */
router.get('/:fips', function (req, res, next) {
  // check that fips is valid
  // get county migration data for fips:
  //   - where fipsIn === fips && fipsOut === fips
  // join with population for county with "other fips" && year
  // pick out "interesting information"
  // return csv
  let errHandle = err => { console.error(err); res.status(400).send(err.message) }

  models.County.findById(req.params.fips, {include: [models.Lineshape, models.Population]})
    .then(foo)
    .catch(errHandle)

  function foo (county) {
    models.Migration.findAll({
      where: {fipsIn: req.params.fips, agi: '21911'}
    })
    .then(function (migration) {
      console.log('\n\n\n\n')
      console.log(JSON.stringify(migration))
      console.log('\n\n\n\n')
      res.send(migration)
    })
    .catch(errHandle)
  }

})

module.exports = router
