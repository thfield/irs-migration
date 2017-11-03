'use strict'
const fs = require('fs')
const d3 = require('d3-dsv')

const combineData = require('./utils/county-migration')
const geoParse = require('./utils/county-geo')
const popParse = require('./utils/county-population')
const write = require('./utils/write')
const writeCsv = require('./utils/write-csv')

const path = '../data'
const years = ['1415', '1314', '1213', '1112', '1011', '0910', '0809', '0708', '0607', '0506', '0405']
let st = process.argv[2] || '06'
let co = process.argv[3] || '075'
const fips = st.concat(co) || '06075'

// create map of fips to county name with key "statefips + countyfips"
let fipsKey = new Map()
d3.csvParseRows(fs.readFileSync(`${path}/raw/national_county.txt`, 'utf8'), function (row) {
  let key = row[1].toString().concat(row[2])
  fipsKey.set(key, {
    state: row[0],
    statefp: row[1],
    countyfp: row[2],
    name: row[3]
  })
  return null
})

// do the county-migration data munging
let focalFips = combineData(st, co, years, path)

// do the geographic data munging
let countyTopojson = geoParse(fips, path, fipsKey, focalFips)

// save topojson file
write(`${path}/${fips}/${fips}shapes.topojson`, countyTopojson)

// do the population parsing
let populationData = popParse(`${path}/population.csv`, focalFips)
writeCsv(`${path}/${fips}/${fips}popdata.csv`, populationData)
