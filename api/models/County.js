var mongoose = require('mongoose');

var CountySchema = new mongoose.Schema({
  fips: {type: String, index: true},
  state: String,
  statefp: String,
  countyfp: String,
  name: String,
  type: String,
  updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('County', CountySchema);