var express = require('express')
var router = express.Router()
// var Sequelize = require('sequelize')
var models = require('../models')
const h = require('../../munge/utils/helpers')

/* GET users listing. */
router.get('/:fips', function (req, res, next) {
  let errHandle = err => { console.error(err); res.status(400).send(err.message) }
  let direction = req.query.direction || 'in'
  let dirProp = getDirProp(direction)

  let migrationPromise = models.Migration.findAll({
    where: whichMigrations(direction)
  }).catch(errHandle)
  function whichMigrations (direction) {
    return direction === 'in'
      ? {fipsIn: req.params.fips}
      : {fipsOut: req.params.fips}
  }
  // return migrationPromise.then(function (migrations) {
  //   res.send(migrations)
  // })
  let countyPromise = migrationPromise.then(getCounties).catch(errHandle)
  function getCounties (migrations) {
    let unique = uniqueFips(migrations, direction)
    return models.County.findAll({
      where: {fips: unique},
      include: ['Population']
    })
  }

  Promise.all([migrationPromise, countyPromise]).then(function ([migrations, counties]) {
    let result = migrations.map(function (migration) {
      return {
        id: migration[getOtherDirProp(direction)],
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
    if (!h.standardFips(migration)) { return 0 }
    let dir = getOtherDirProp(direction)
    let year = h.fullYear(migration.year)
    let county = counties.find(function (co) { return co.fips === migration[dir] })
    let pop = county.Population['pop' + year]
    return pop
  }
})

module.exports = router

/** @function uniqueFips
 * @param {array} migrations  - array of sequelize objects returned from query
 * @param {string} [direction=in]  - "in" or "out"
 * @returns {array} unique fips from the migration array
 */
function uniqueFips (migrations, direction = 'in') {
  let res = new Set()
  let dir = getOtherDirProp(direction)
  migrations.forEach(function (migration) {
    res.add(migration[dir])
  })
  return Array.from(res)
}

function getDirProp (direction) {
  direction = direction.toLowerCase()
  let ds = { in: 'fipsIn', out: 'fipsOut' }
  return ds[direction]
}

function getOtherDirProp (direction) {
  direction = direction.toLowerCase()
  return { out: 'fipsIn', in: 'fipsOut' }[direction]
}
