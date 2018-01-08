var express = require('express')
var router = express.Router()

/* GET home page. */
router.get('/:fips', function (req, res, next) {
  res.render('explore', { title: 'County to County Migrations' })
})

module.exports = router
