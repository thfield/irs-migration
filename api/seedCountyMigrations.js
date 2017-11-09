const fs = require('fs')
const d3 = require('d3-dsv')
const mongoose = require('mongoose')

const CountyMigration = require('./models/CountyMigration.js')

var options = {
  useMongoClient: true,
  keepAlive: 1,
  connectTimeoutMS: 30000
}

mongoose.Promise = global.Promise
var mongoDB = 'mongodb://localhost/irs'
mongoose.connect(mongoDB, options)
  .then(() => console.log('connection succesful to ', mongoDB))
  .catch((err) => console.error(err))

// load county migration data
const path = '../data/mongo/test'
// const years = ['1415', '1314', '1213', '1112', '1011', '0910', '0809', '0708', '0607', '0506', '0405']
const years = ['1213', '1112']
years.forEach(function (year) {
  CountyMigration.remove({year: year})
    .then(() => loadData(year))
    .then(filterData)
    .then((data) => CountyMigration.create(data))
    .then(() => console.log('loaded', year))
    .catch((err) => { console.error(err) })
    .then(() => mongoose.disconnect())
})

async function loadData (yr) {
  let file = `${path}/data${yr}.csv`
  let data = d3.csvParse(fs.readFileSync(file, 'utf8'), function (d) {
    let fipsIn = d.y2_statefips.concat(d.y2_countyfips)
    let fipsOut = d.y1_statefips.concat(d.y1_countyfips)
    return Object.assign(d, {fipsIn: fipsIn, fipsOut: fipsOut, year: yr})
  })
  return data
}

async function filterData (data) {
  data = data.filter(function (d) {
    return +d.y1_statefips < 58 && +d.y2_statefips < 58
  })
  console.log(`yr ${data[0].year} count: ${data.length}`)
  return data
}
