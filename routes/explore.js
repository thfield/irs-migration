var express = require('express')
var router = express.Router()

/* GET home page. */
router.get('/:fips', function (req, res, next) {
  // TODO: handle case where not valid fips 
  res.render('explore', { title: 'County to County Migrations' })
})

module.exports = router
