'use strict'
const fs = require('fs')
const d3 = require('d3-dsv')
// polyfill for padStart can be found at: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/padStart

const path = '../data'

const datafiles = [
  `${path}/raw-pop/pop2000-2010.csv`,
  `${path}/raw-pop/pop2010-2016.csv`
]

datafiles.forEach(function (d) {
  if (!fs.existsSync(d)) {
    console.log(`missing file: ${d}`)
    console.log('run population-data.sh first')
    process.exit(1)
  }
})

// create file for combined data
let combinedPath = `${path}/population.csv`
if (fs.existsSync(combinedPath)) {
  // delete file if exists so it doesn't keep being appended to
  fs.unlinkSync(combinedPath)
}
let combinedCsv = fs.createWriteStream(combinedPath)
let headers = 'fips,pop2000,pop2001,pop2002,pop2003,pop2004,pop2005,pop2006,pop2007,pop2008,pop2009,pop2010,pop2011,pop2012,pop2013,pop2014,pop2015,pop2016\n'
combinedCsv.write(headers)

// create Object for combined data
let combinedData = {}

datafiles.forEach(function (file) {
  let data = d3.csvParse(fs.readFileSync(file, 'utf8'), function (d) {
    d.STATE = d.STATE.padStart(2, '0')
    d.COUNTY = d.COUNTY.padStart(3, '0')
    return d
  })

  data.forEach(function (county) {
    if (county.COUNTY === '000') { return }
    let fips = `${county.STATE}${county.COUNTY}`
    combinedData[fips] = combinedData[fips] || {}
    let yearprops = data.columns.filter(d => d.includes('POPESTIMATE'))
    yearprops.forEach(function (yearprop) {
      combinedData[fips][yearprop] = county[yearprop]
    })
  })
})

for (let co in combinedData) {
  let convertedData = `${co},${combinedData[co].POPESTIMATE2000},${combinedData[co].POPESTIMATE2001},${combinedData[co].POPESTIMATE2002},${combinedData[co].POPESTIMATE2003},${combinedData[co].POPESTIMATE2004},${combinedData[co].POPESTIMATE2005},${combinedData[co].POPESTIMATE2006},${combinedData[co].POPESTIMATE2007},${combinedData[co].POPESTIMATE2008},${combinedData[co].POPESTIMATE2009},${combinedData[co].POPESTIMATE2010},${combinedData[co].POPESTIMATE2011},${combinedData[co].POPESTIMATE2012},${combinedData[co].POPESTIMATE2013},${combinedData[co].POPESTIMATE2014},${combinedData[co].POPESTIMATE2015},${combinedData[co].POPESTIMATE2016}\n`

  combinedCsv.write(convertedData)
}

// close fileWriteStream
combinedCsv.end()
console.log('The file was saved as', combinedPath)
