var mongoose = require('mongoose');

var CountyPopSchema = new mongoose.Schema({
  fips: {type: String, index: true},
  pop2000: Number,
  pop2001: Number,
  pop2002: Number,
  pop2003: Number,
  pop2004: Number,
  pop2005: Number,
  pop2006: Number,
  pop2007: Number,
  pop2008: Number,
  pop2009: Number,
  pop2010: Number,
  pop2011: Number,
  pop2012: Number,
  pop2013: Number,
  pop2014: Number,
  pop2015: Number,
  pop2016: Number,
  // county: { type: mongoose.Schema.Types.ObjectId, ref: 'County' },
  updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('CountyPop', CountyPopSchema);