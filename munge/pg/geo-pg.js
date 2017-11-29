'use strict'
const fs = require('fs')
const writeCsv = require('../utils/write-csv')
let path = '../../data'
let counties = JSON.parse(fs.readFileSync(`${path}/geo/counties.geojson`, 'utf8'))
let coStrings = counties.features.map((f) => { return { fips: f.properties.GEOID, geojson: JSON.stringify(f) } })
writeCsv(`${path}/pg/countyLineshapes.csv`, coStrings, ';')
