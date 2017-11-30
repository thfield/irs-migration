'use strict'
const write = require('../utils/write')
const d3 = require('d3-dsv')
const fs = require('fs')
const paths = {
  counties: '../../data/pg/counties.csv',
  lineshapes: '../../data/geo/counties.geojson',
  populations: '../../data/population.csv',
  migrations: '../../data/pg/alldata.csv'
}

let fips = ['06075', '06001', '06085', '06037', '06013', '36061', '06041', '06073', '17031', '06059', '06067', '53033', '36047', '06097', '11001']

function readCsv (path) {
  return d3.csvParse(fs.readFileSync(path, 'utf8'))
}

function readCsvNoHeader (path, headers) {
  return d3.csvParseRows(fs.readFileSync(path, 'utf8'), function (row) {
    return kv(headers, row)
  })
}

function kv (header, data) {
  let res = {}
  header.forEach(function (el, i) {
    res[el] = data[i]
  })
  return res
}

let countyHeaders = ['id', 'state', 'statefp', 'countyfp', 'name', 'type']

let data = {
  counties: readCsvNoHeader(paths.counties, countyHeaders),
  lineshapes: JSON.parse(fs.readFileSync(paths.lineshapes, 'utf8')),
  populations: readCsv(paths.populations),
  migrations: readCsv(paths.migrations)
}

let res

try {
  res = fips.map(function (fip) {
    let co = data.counties.find(function (d) { return d.id === fip })
    co = {
      fips: fip,
      state: co.state,
      statefp: co.statefp,
      countyfp: co.countyfp,
      name: co.name,
      type: co.type
    }
    let ls = data.lineshapes.features.find(function (d) { return d.properties.GEOID === fip })
    ls = {fips: fip, geojson: JSON.stringify(ls)}

    return {
      id: fip,
      county: co,
      lineshape: ls,
      population: data.populations.find(function (d) { return d.fips === fip }),
      migration: data.migrations.find(function (d) { return (d.fipsIn === fip || d.fipsOut === fip) })
    }
  })
} catch (err) {
  console.error(err)
}

let final = {
  counties: [],
  lineshapes: [],
  populations: [],
  migrations: []
}

res.forEach(function (county) {
  final.counties.push(county.county)
  final.lineshapes.push(county.lineshape)
  final.populations.push(county.population)
  final.migrations.push(county.migration)
})

write(`../../data/pg/seed-counties.json`, final.counties)
write(`../../data/pg/seed-lineshapes.json`, final.lineshapes)
write(`../../data/pg/seed-populations.json`, final.populations)
write(`../../data/pg/seed-migrations.json`, final.migrations)
