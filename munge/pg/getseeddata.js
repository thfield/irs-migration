'use strict'
const write = require('../utils/write')
const d3 = require('d3-dsv')
const fs = require('fs')
const h = require('../utils/helpers')
const paths = {
  lineshapes: '../../data/geo/counties.geojson',
  migrations: '../../data/pg/alldata.csv'
}

let fips = ['06075', '06001', '06085', '06037', '06013', '36061', '06041', '06073', '17031', '06059', '06067', '53033', '36047', '06097', '11001']
let year = '1415'

function readCsv (path) {
  return d3.csvParse(fs.readFileSync(path, 'utf8'))
}

let data = {
  lineshapes: JSON.parse(fs.readFileSync(paths.lineshapes, 'utf8'))
  migrations: readCsv(paths.migrations)
}

let res

try {
  res = fips.map(function (fip) {
    let ls = data.lineshapes.features.find(function (d) { return d.properties.GEOID === fip })
    ls = {fips: fip, geojson: JSON.stringify(ls)}

    return {
      id: fip,
      lineshape: ls
    }
  })
} catch (err) {
  console.error(err)
}

let mig = data.migrations.filter(function (d) { return (d.fipsIn === fips[0] || d.fipsOut === fips[0]) && h.standardFips(d) })
mig.forEach(function (m) {
  m.n1 = +m.n1
  m.n2 = +m.n2
  m.agi = +m.agi
})

let final = {
  lineshapes: [],
  migrations: mig
}

res.forEach(function (county) {
  final.lineshapes.push(county.lineshape)
})

write(`../../data/pg/seed-lineshapes.json`, final.lineshapes)
write(`../../data/pg/seed-migrations.json`, final.migrations)
