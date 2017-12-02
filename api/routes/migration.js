var express = require('express')
var csv = require('csv-express')
var router = express.Router()
var Sequelize = require('sequelize')
var models = require('../models')
const h = require('../../munge/utils/helpers')

/* GET users listing. */
router.get('/:fips', function (req, res, next) {
  // check that fips is valid
  // get county migration data for fips:
  //   - where fipsIn === fips && fipsOut === fips
  // join with population for county with "other fips" && year
  // pick out "interesting information"
  // return csv
  let errHandle = err => { console.error(err); res.status(400).send(err.message) }

  models.Migration.findOne({
    where: {fipsIn: req.params.fips, fipsOut: '06001'},
    include: [ 'Y1County' ]
  })
    .then(foo1)
    .catch(errHandle)

  function foo1 (r) {
    let answer = JSON.stringify(r)
    console.log('\n\n\n\n')
    console.log(answer)
    console.log('\n\n\n\n')
    res.send(answer)
  }

  function foo (county) {
    models.Migration.findOne({
      where: {fipsIn: req.params.fips, fipsOut: '06001'},
      // attributes: ['fipsIn', 'fipsOut', 'y1_statefips', 'y1_countyfips', 'y2_statefips', 'y2_countyfips', 'n1', 'n2', 'agi', 'year'],
      include: [ 'Y1County' ]
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
