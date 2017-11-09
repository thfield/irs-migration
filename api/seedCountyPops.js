const fs = require('fs')
const d3 = require('d3-dsv')
const mongoose = require('mongoose')

const CountyPop = require('./models/CountyPop.js')

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

// load population data
let popFile = `../data/population.csv`
let popData = d3.csvParse(fs.readFileSync(popFile, 'utf8'), function (d) {
  let yrs = ['2000', '2001', '2002', '2003', '2004', '2005', '2006', '2007', '2008', '2009', '2010', '2011', '2012', '2013', '2014', '2015', '2016']
  yrs.forEach(function (yr) {
    if (d[`pop${yr}`] === 'undefined') { d[`pop${yr}`] = null }
  })
  return d
})
console.log('countypops count:', popData.length)

// // if using a ref inside CountyPop schema:
// function createCountyPops () {
//   let countyPopPromises = popData.map(c => {
//     return County.findOne({fips: c.fips}).exec()
//       .then(function (cp) {
//         return CountyPop.create(Object.assign(c, {county: cp._id}))
//       })
//       .catch((err) => console.error(err))
//   })
//   return Promise.all(countyPopPromises)
// }

CountyPop.remove({})
  .then(() => CountyPop.create(popData))
  .catch((err) => console.error(err))
  .then(() => mongoose.disconnect())
