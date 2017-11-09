var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var County = require('../models/County.js');
var CountyPop = require('../models/CountyPop.js');
var CountyMigration = require('../models/CountyMigration.js');

/* GET ALL Counties */
router.get('/', function(req, res, next) {
  County.find(function (err, counties) {
    if (err) return next(err);
    res.json(counties);
  });
});

/* GET SINGLE County BY FIPS */
router.get('/:id', function(req, res, next) {
  County.find({fips: req.params.id}, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

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

module.exports = router;