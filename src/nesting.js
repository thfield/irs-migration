'use strict'
const d3 = require('d3-collection')
const munge = require('./munge')

/**
 * nestedCountyData nests data from d3.csvParse(00000combined.csv) by:
 *   -direction: ['in', 'out']
 *     -year: ['0405', ..., '1415']
 *        -array of
 *          -data: {agi,id,n1,n2,y1_countyfips,y1_statefips,y2_countyfips,y2_statefips,year}
 */
function nestCounty (data) {
  return d3.nest()
    .key(munge.inOrOut)
    .key(function (d) { return d.year })
    .entries(data)
}

/**
 * nestedStateData nests data from d3.csvParse(00000combined.csv) by:
 *    -direction: ['in','out']
 *      -year: ['0405', ..., '1415']
 *        -statefips: ['01', ..., '58']
 *          -data: {n1,n2,agi}
 */
function nestState (data) {
  return d3.nest()
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
}

/**
 * nestedStateDataByYear nests data from d3.csvParse(00000combined.csv) by:
 *    -direction: ['in','out']
 *      -statefips: ['01', ..., '58']
 *        -year: ['0405', ..., '1415']
 *          -data: {n1,n2,agi}
 */
function nestStateByYear (data) {
  return d3.nest()
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
}

module.exports = {
  county: nestCounty,
  state: nestState,
  stateByYear: nestStateByYear
}
