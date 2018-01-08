var express = require('express')
var router = express.Router()
var Sequelize = require('sequelize')
var models = require('../models')

/* GET users listing. */
router.get('/:fips', function (req, res, next) {
  let errHandle = err => { console.error(err); res.status(400).send(err.message) }

  models.County.findById(req.params.fips, {include: [models.Lineshape, models.Population]})
    .then(foo1)
    .catch(errHandle)

  function foo1 (county) {
    let answer = JSON.stringify(county)
    res.send(answer)
  }
})

module.exports = router
