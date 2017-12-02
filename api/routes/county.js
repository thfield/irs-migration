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

  models.County.findById(req.params.fips, {include: [models.Lineshape, models.Population]})
    // .then(getMigrations)
    .then(foo)
    // .then(function (county) {
    //   console.log(county)
    //   county.getLineshape().then(pop => res.send(pop))
    // })
    .catch(errHandle)

  function foo1 (county) {
    let answer = JSON.stringify(county)
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

  // function getMigrations (county) {
  //   if (county === null) throw new Error('County FIPS not found')
  //   models.Migration.findAll({
  //     where: Sequelize.and({year: '1415'},
  //       Sequelize.or(
  //         {fipsIn: req.params.fips},
  //         {fipsOut: req.params.fips}
  //       )
  //     ),
  //     attributes: ['fipsIn', 'fipsOut', 'y1_statefips', 'y1_countyfips', 'y2_statefips', 'y2_countyfips', 'n1', 'n2', 'agi', 'year']
  //   })
  //   .then(function (db) {
  //     res.send(db[0])
  //     // let migrations = db[0].map(f => f.get({plain: true})) // ignore sequelize model props
  //     // let pops = db[1].map(f => f.get({plain: true})) // ignore sequelize model props
  //     // migrations = migrations.map(function (coYr) {
  //     //   let id = h.otherFips(req.param.fips, coYr)
  //     //   let pop = h.getPopData(id, h.fullYear(coYr.year), pops)
  //     //   return Object.assign(coYr, {pop: pop})
  //     // })
  //     // res.csv(migrations, true) // 2nd param "true" returns header row
  //   })
  //   .catch(errHandle)
  // }

  // function getMigrations (county) {
  //   if (county === null) throw new Error('County FIPS not found')
  //   let data = [
  //     models.Migration.findAll({
  //       where: Sequelize.and({year: '1415'},
  //         Sequelize.or(
  //           {fipsIn: req.params.fips},
  //           {fipsOut: req.params.fips}
  //         )
  //       ),
  //       attributes: ['fipsIn', 'fipsOut', 'y1_statefips', 'y1_countyfips', 'y2_statefips', 'y2_countyfips', 'n1', 'n2', 'agi', 'year']
  //     }),
  //     models.Population.findById(req.params.fips, {
  //       attributes: ['fips', 'pop2000', 'pop2001', 'pop2002', 'pop2003', 'pop2004', 'pop2005', 'pop2006', 'pop2007', 'pop2008', 'pop2009', 'pop2010', 'pop2011', 'pop2012', 'pop2013', 'pop2014', 'pop2015', 'pop2016']
  //     })
  //   ]
  //   Promise.all(data).then(function (db) {
  //     let migrations = db[0].map(f => f.get({plain: true})) // ignore sequelize model props
  //     let pops = db[1].map(f => f.get({plain: true})) // ignore sequelize model props
  //     migrations = migrations.map(function (coYr) {
  //       let id = h.otherFips(req.param.fips, coYr)
  //       let pop = h.getPopData(id, h.fullYear(coYr.year), pops)
  //       return Object.assign(coYr, {pop: pop})
  //     })
  //     res.csv(migrations, true) // 2nd param "true" returns header row
  //   })
  //   .catch(errHandle)
  // }
})

module.exports = router
