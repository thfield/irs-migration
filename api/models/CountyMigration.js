var mongoose = require('mongoose');

var CountyMigration = new mongoose.Schema({
  fipsIn: {type: String, index: true},
  fipsOut: {type: String, index: true},
  y1_statefips: String,
  y1_countyfips: String,
  y2_statefips: String,
  y2_countyfips: String,
  n1: Number,
  n2: Number,
  agi: Number,
  year: {type: String, index: true},
  updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('CountyMigration', CountyMigration);