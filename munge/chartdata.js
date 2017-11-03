'use strict'
const fs = require('fs')
const d3 = require('d3')
const munge = require('../src/munge.js')
const write = require('./utils/write')

const stateFp = '06'
const countyFp = '075'
const fipsCounty = `${stateFp}${countyFp}`

let path = '../data'
let dataPath = `${path}/${fipsCounty}/${fipsCounty}combined.csv`
let fipsPath = `${path}/fipscodes.csv`

let data = d3.csvParse(fs.readFileSync(dataPath, { encoding: 'utf8' }), function (row) {
  row.n1 = +row.n1 === -1 ? null : row.n1
  row.n2 = +row.n2 === -1 ? null : row.n2
  row.agi = +row.agi === -1 ? null : row.agi
  row.meanAgi = +row.agi / +row.n1
  return row
})
let fips = d3.csvParse(fs.readFileSync(fipsPath, { encoding: 'utf8' }), function (row) {
  return Object.assign(row, {id: row.statefp.concat(row.countyfp)})
})

/**
  * fipsMap has mapping of:
  *  - state fips to state abbrev:
  *     {'06': 'CA'}
  *  - state+county fips to county data from d3.csvParse(fipscodes.csv):
  *      { '06075': {
  *          id: '06075',
  *          state: 'CA',
  *          statefp: '06',
  *          countyfp: '075',
  *          name: 'San Francisco County',
  *          type: 'H1
  *        }
  *      }
  */
let fipsMap = new Map()
fips.forEach(function (row) {
  fipsMap.set(row.id, row)
  fipsMap.set(row.statefp, row.state)
})

/*******************************************************************************
        data nesting functions
*******************************************************************************/

/**
 * nestedCountyData nests data from d3.csvParse(00000combined.csv) by:
 *   -direction: ['in', 'out']
 *     -year: ['0405', ..., '1415']
 *        -array of
 *          -data: {agi,id,n1,n2,y1_countyfips,y1_statefips,y2_countyfips,y2_statefips,year}
 */
let nestedCountyData = d3.nest()
    .key(munge.inOrOut)
    .key(function (d) { return d.year })
    .entries(data)

/**
 * nestedStateData nests data from d3.csvParse(00000combined.csv) by:
 *    -direction: ['in','out']
 *      -year: ['0405', ..., '1415']
 *        -statefips: ['01', ..., '58']
 *          -data: {n1,n2,agi}
 */
let nestedStateData = d3.nest()
    .key(munge.inOrOut)
    .key(function (d) { return d.year })
    .key(function (d) {
      let direc = munge.inOrOut(d)
      return d[munge.targetFips(direc)[0]]
    })
    .rollup(function (leaves) {
      return leaves.reduce(function (acc, cur) {
        // don't count 'states' added by irs aggregation
        if (cur.y1_statefips > 58 || cur.y2_statefips > 58) { return acc }
        // don't count non-migrators (where year1residence === year2residence)
        if (cur.y1_statefips === cur.y2_statefips && cur.y1_countyfips === cur.y2_countyfips) { return acc }

        let n1 = cur.n1 === null ? acc.n1 : acc.n1 + Number.parseInt(cur.n1)
        let n2 = cur.n2 === null ? acc.n2 : acc.n2 + Number.parseInt(cur.n2)
        let agi = cur.agi === null ? acc.agi : acc.agi + Number.parseInt(cur.agi)
        let meanAgi = cur.meanAgi === null ? acc.meanAgi : acc.meanAgi + Number.parseInt(cur.meanAgi)

        return {n1: n1, n2: n2, agi: agi, meanAgi: meanAgi}
      }, {n1: null, n2: null, agi: null, meanAgi: null})
    })
    .entries(data)

/**
 * nestedStateDataByYear nests data from d3.csvParse(00000combined.csv) by:
 *    -direction: ['in','out']
 *      -statefips: ['01', ..., '58']
 *        -year: ['0405', ..., '1415']
 *          -data: {n1,n2,agi}
 */
let nestedStateDataByYear = d3.nest()
     .key(munge.inOrOut)
     .key(function (d) {
       let direc = munge.inOrOut(d)
       return d[munge.targetFips(direc)[0]]
     })
     .key(function (d) { return d.year })
     .rollup(function (leaves) {
       return leaves.reduce(function (acc, cur) {
         // don't count 'states' added by irs aggregation
         if (cur.y1_statefips > 58 || cur.y2_statefips > 58) { return acc }
         // don't count non-migrators (where year1residence === year2residence)
         if (cur.y1_statefips === cur.y2_statefips && cur.y1_countyfips === cur.y2_countyfips) { return acc }

         let n1 = cur.n1 === null ? acc.n1 : acc.n1 + Number.parseInt(cur.n1)
         let n2 = cur.n2 === null ? acc.n2 : acc.n2 + Number.parseInt(cur.n2)
         let agi = cur.agi === null ? acc.agi : acc.agi + Number.parseInt(cur.agi)
         let meanAgi = cur.meanAgi === null ? acc.meanAgi : acc.meanAgi + Number.parseInt(cur.meanAgi)

         return {n1: n1, n2: n2, agi: agi, meanAgi: meanAgi}
       }, {n1: null, n2: null, agi: null, meanAgi: null})
     })
     .entries(data)

/*******************************************************************************
        prep data for dimple charts
*******************************************************************************/

// let topN1Counties = munge.dataTopNCounties(nestedCountyData, 'n1', fipsMap, 15)
// let topN2Counties = munge.dataTopNCounties(nestedCountyData, 'n2', fipsMap, 15)
// let topAgiCounties = munge.dataTopNCounties(nestedCountyData, 'agi', fipsMap, 15)
// let topMeanAgiCounties = munge.dataTopNCounties(nestedCountyData, 'meanAgi', fipsMap, 15, function (d) {
//   d.meanAgi = +d.agi / +d.n1
//   return d
// })
//
// // let topN1CountiesOutOfState = munge.dataTopNCounties(munge.getDirectionYearValues(nestedCountyData, direction, year), 'n1', fipsMap, 15, null, true)
// let topN2CountiesOutOfState = munge.dataTopNCounties(nestedCountyData, 'n2', fipsMap, 15, null, true)
// let topAgiCountiesOutOfState = munge.dataTopNCounties(nestedCountyData, 'agi', fipsMap, 15, null, true)
// let topMeanAgiCountiesOutOfState = munge.dataTopNCounties(nestedCountyData, 'meanAgi', fipsMap, 15, null, function (d) {
//   d.meanAgi = +d.agi / +d.n1
//   return d
// }, true)
//
// let topN1States = munge.dataTopNStates(nestedStateData, 'n1', fipsMap, 15, null, true)
// let topN2States = munge.dataTopNStates(nestedStateData, 'n2', fipsMap, 15, null, true)
// let topAgiStates = munge.dataTopNStates(nestedStateData, 'agi', fipsMap, 15, null, true)
// let topMeanAgiStates = munge.dataTopNStates(nestedStateData, 'meanAgi', fipsMap, 15, function (d) {
//   d.meanAgi = +d.agi / +d.n1
//   return d
// }, true)
//
// let annualStatesForDimple = {}
// nestedStateDataByYear.forEach(function (direc) {
//   annualStatesForDimple[direc.key] = munge.dataAnnualStatesForDimple(direc.values)
// })
//
// let netMigrationForDimple = {}

// let ns = nestedCountyData.map(function (direction) {
//   return {
//     direction: direction.key,
//     values: direction.values.map(function (year) {
//       return {key: year.key, length: year.values.length}
//     })}
// })

let output = {
  // color: colorScales,
  charts: {
    linechart: annualStatesForDimple,
    netMigration: netMigrationForDimple
  },
  counties: {
    n1: topN1Counties,
    n2: topN2Counties,
    agi: topAgiCounties,
    meanAgi: topMeanAgiCounties,
    outOfState: {
      n1: topN1CountiesOutOfState,
      n2: topN2CountiesOutOfState,
      agi: topAgiCountiesOutOfState,
      meanAgi: topMeanAgiCountiesOutOfState
    }
  },
  states: {
    n1: topN1States,
    n2: topN2States,
    agi: topAgiStates,
    meanAgi: topMeanAgiStates
  }
}
// write('../data/chartData.json', output)
write('./foo/foo.json', topN1Counties)
