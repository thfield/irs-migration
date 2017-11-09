const fs = require('fs')
const d3 = require('d3-dsv')
const mongoose = require('mongoose')

const County = require('./models/County.js')

var options = {
  useMongoClient: true,
  keepAlive: 1,
  connectTimeoutMS: 30000
}

mongoose.Promise = global.Promise
var mongoDB = 'mongodb://localhost/irs'
mongoose.connect(mongoDB, options)
  .then(() => console.log('connection succesful'))
  .catch((err) => console.error(err))

// load county fips data
let fipsFile = `../data/fipscodes.csv`
let fipsData = d3.csvParse(fs.readFileSync(fipsFile, 'utf8'), function (d) {
  let fips = d.statefp.concat(d.countyfp)
  return Object.assign(d, {fips: fips})
})
console.log('counties count:', fipsData.length)


County.remove({})
  .then(() => County.create(fipsData))
  .catch((err) => console.error(err))
  .then(() => mongoose.disconnect())
