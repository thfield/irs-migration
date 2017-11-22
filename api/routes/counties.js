var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var County = require('../models/County.js');
var CountyPop = require('../models/CountyPop.js');
var CountyMigration = require('../models/CountyMigration.js');

mongoose.Promise = global.Promise

/* GET ALL Counties */
router.get('/', function(req, res, next) {
  County.find(function (err, counties) {
    if (err) return next(err);
    res.json(counties);
  });
});

/* GET SINGLE County BY FIPS */
router.get('/:id', function (req, res, next) {
  let year = req.query.year || '1415'
  let direction = req.query.direction || 'in'
  direction = ucFirst(direction)

  let p1 = County.find({fips: req.params.id})
  let p2 = CountyPop.find({fips: req.params.id})
  let p3 = direction === 'In'
    ? CountyMigration.find({fipsIn: req.params.id, year: year})
    : CountyMigration.find({fipsOut: req.params.id, year: year})



  Promise.all([p1, p2, p3])
    .then(function (data) {
      return res.json(data)
    })
    // .then(data => res.json(data))
    .catch((err) => { return next(err) })
})

// /* SAVE County */
// router.post('/', function(req, res, next) {
//   County.create(req.body, function (err, post) {
//     if (err) return next(err);
//     res.json(post);
//   });
// });
//
// /* UPDATE County */
// router.put('/:id', function(req, res, next) {
//   County.findByIdAndUpdate(req.params.id, req.body, function (err, post) {
//     if (err) return next(err);
//     res.json(post);
//   });
// });
//
// /* DELETE County */
// router.delete('/:id', function(req, res, next) {
//   County.findByIdAndRemove(req.params.id, req.body, function (err, post) {
//     if (err) return next(err);
//     res.json(post);
//   });
// });

/** @function fullYear
 * @param {string} yr - 4 char string of Y1Y2, eg: 9495, 0405, 1415
 * @returns {string} expanded year eg: 1995, 2005, 2015
 */
function fullYear (yr) {
  let c = (yr.charAt(3) < 9) ? '20' : '19'
  return `${c}${yr.slice(2, 4)}`
}

function ucFirst (string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

module.exports = router;