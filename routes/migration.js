var express = require('express')
var router = express.Router()
var Sequelize = require('sequelize')
var models = require('../models')
const h = require('../munge/utils/helpers')
const shared = require('./shared')

/* GET users listing. */
router.get('/:fips', function (req, res, next) {
  let errHandle = err => { console.error(err); res.status(400).send(err.message) }

  let migrationPromise = models.Migration.findAll({
    where: {
      [Sequelize.Op.or]: [{fipsIn: req.params.fips}, {fipsOut: req.params.fips}]
    }
  }).catch(errHandle)

  let countyPromise = migrationPromise.then(getCounties).catch(errHandle)
  function getCounties (migrations) {
    let unique = shared.uniqueFips(migrations)
    return models.County.findAll({
      where: {fips: unique},
      include: ['Population']
    })
  }

  Promise.all([migrationPromise, countyPromise]).then(function ([migrations, counties]) {
    let result = migrations.map(function (migration) {
      return {
        id: migration[shared.figureOutOppositeDirection(req.params.fips, migration)],
        year: migration.year,
        y1_statefips: migration.y1_statefips,
        y1_countyfips: migration.y1_countyfips,
        y2_statefips: migration.y2_statefips,
        y2_countyfips: migration.y2_countyfips,
        n1: migration.n1,
        n2: migration.n2,
        agi: migration.agi,
        pop: getPop(migration, counties)
      }
    })
    let headers = [
      'id',
      'year',
      'y1_statefips',
      'y1_countyfips',
      'y2_statefips',
      'y2_countyfips',
      'n1',
      'n2',
      'agi',
      'pop'
    ]
    result = h.arrayToCsvString(result, headers, true)
    res.set('Content-Type', 'text/csv')
      .send(result)
  }).catch(errHandle)

  function getPop (migration, counties) {
    if (!h.standardFips(migration)) { return undefined }
    let year = h.fullYear(migration.year)
    let county = counties.find(function (co) { return co.fips === migration[shared.figureOutOppositeDirection(req.params.fips, migration)] })
    let pop = county.Population['pop' + year]
    return pop
  }
})

module.exports = router
