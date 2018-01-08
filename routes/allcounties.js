var express = require('express')
var router = express.Router()
var models = require('../models')

/* GET users listing. */
router.get('/', function (req, res, next) {
  let errHandle = err => { console.error(err); res.status(400).send(err.message) }

  models.County.findAll({ attributes: ['fips', 'state', 'statefp', 'countyfp', 'name'] })
    .then(function (counties) {
      counties = counties.filter(function (co) {
        return +co.statefp < 57
      })
      res.send(counties)
    })
    .catch(errHandle)
})

module.exports = router
