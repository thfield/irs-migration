'use strict'
const fs = require('fs')
const d3 = require('d3')

const stateFp = '06'
const countyFp = '075'
const fipsCounty = `${stateFp}${countyFp}`

let years = ['0405', '0506', '0607', '0708', '0809', '0910', '1011', '1112', '1213', '1314', '1415']
// let direction = 'in'
// let year = years[years.length - 1]

// let colorArray = {
//   in: ['#fff', '#f7fcf5', '#e5f5e0', '#c7e9c0', '#a1d99b', '#74c476', '#41ab5d', '#238b45', '#006d2c', '#00441b'],
//   out: ['#fff', '#fff5f0', '#fee0d2', '#fcbba1', '#fc9272', '#fb6a4a', '#ef3b2c', '#cb181d', '#a50f15', '#67000d']
// }
let path = '../data'
let dataPath = `${path}/${fipsCounty}/${fipsCounty}combined.csv`
let fipsPath = `${path}/fipscodes.csv`

let data = d3.csvParse(fs.readFileSync(dataPath, { encoding: 'utf8' }))
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
 * countyData nests data from d3.csvParse(00000combined.csv) by:
 *   -direction: ['in', 'out']
 *     -year: ['0405', ..., '1415']
 *        -array of
 *          -data: {agi,id,n1,n2,y1_countyfips,y1_statefips,y2_countyfips,y2_statefips,year}
 */
let countyData = d3.nest()
    .key(inOrOut)
    .key(function (d) { return d.year })
    .entries(data)
// write('foo/countyData.json', countyData)

// /**
//  * stateTotalByYear nests data from d3.csvParse(00000combined.csv) by:
//  *    -direction: ['in','out']
//  *      -statefips: ['01', ..., '58']
//  *        -year: ['0405', ..., '1415']
//  *          -data: {n1,n2,agi}
//  */
// let stateTotalByYear = d3.nest()
//     .key(inOrOut)
//     .key(function (d) {
//       let direc = inOrOut(d)
//       return d[targetFips(direc)[0]]
//     })
//     .key(function (d) { return d.year })
//     .rollup(function (leaves) {
//       return leaves.reduce(function (acc, cur) {
//         // don't count 'states' added by irs aggregation
//         if (cur.y1_statefips > 58 || cur.y2_statefips > 58) { return acc }
//         // don't count non-migrators (where year1residence === year2residence)
//         if (cur.y1_statefips === cur.y2_statefips && cur.y1_countyfips === cur.y2_countyfips) { return acc }
//
//         let n1 = cur.n1 === -1 ? acc.n1 : acc.n1 + Number.parseInt(cur.n1)
//         let n2 = cur.n2 === -1 ? acc.n2 : acc.n2 + Number.parseInt(cur.n2)
//         let agi = cur.agi === -1 ? acc.agi : acc.agi + Number.parseInt(cur.agi)
//
//         return {n1: n1, n2: n2, agi: agi}
//       }, {n1: 0, n2: 0, agi: 0})
//     })
//     .entries(data)

/**
 * stateTotal nests data from d3.csvParse(00000combined.csv) by:
 *    -direction: ['in','out']
 *      -year: ['0405', ..., '1415']
 *        -statefips: ['01', ..., '58']
 *          -data: {n1,n2,agi}
 */
let stateTotal = d3.nest()
    .key(inOrOut)
    .key(function (d) { return d.year })
    .key(function (d) {
      let direc = inOrOut(d)
      return d[targetFips(direc)[0]]
    })
    .rollup(function (leaves) {
      return leaves.reduce(function (acc, cur) {
        // don't count 'states' added by irs aggregation
        if (cur.y1_statefips > 58 || cur.y2_statefips > 58) { return acc }
        // don't count non-migrators (where year1residence === year2residence)
        if (cur.y1_statefips === cur.y2_statefips && cur.y1_countyfips === cur.y2_countyfips) { return acc }

        let n1 = cur.n1 === -1 ? acc.n1 : acc.n1 + Number.parseInt(cur.n1)
        let n2 = cur.n2 === -1 ? acc.n2 : acc.n2 + Number.parseInt(cur.n2)
        let agi = cur.agi === -1 ? acc.agi : acc.agi + Number.parseInt(cur.agi)

        return {n1: n1, n2: n2, agi: agi}
      }, {n1: 0, n2: 0, agi: 0})
    })
    .entries(data)

/*******************************************************************************
        prep data for charts
*******************************************************************************/

let topN1Counties = dataTopNCounties(countyData, 'n1', 15)
let topN2Counties = dataTopNCounties(countyData, 'n2', 15)
let topAgiCounties = dataTopNCounties(countyData, 'agi', 15)
let topMeanAgiCounties = dataTopNCounties(countyData, 'meanAgi', 15, function (d) {
  d.meanAgi = +d.agi / +d.n1
  return d
})

let topN1States = {}
stateTotal.forEach(function (direc) {
  dataTopNStates([direction])
})

write('topStatesAlltime.json', topStatesAlltime)

// let annualStatesForDimple = {}
// stateTotalByYear.forEach(function (direc) {
//   annualStatesForDimple[direc.key] = dataAnnualStatesForDimple(direc.values)
// })
//

/*******************************************************************************
        data munge functions
*******************************************************************************/

/** @function dataTopNCounties
 * @param { object[] } data - nested data: countyData
 * @param { string } [prop] - property to sort by
 * @param { number } [n=10] - first n records to return
 * @param { function } [addProp] - function for adding additional property
 * implemented with Array.map(addProp) on [year].values
 * @returns { object[] }
 */
function dataTopNCounties (data, prop, n = 10, addProp) {
  let response = {}
  data.forEach(function (direc) {
    response[direc.key] = response[direc.key] || {}
    direc.values.forEach(function (yr) {
      response[direc.key][yr.key] = response[direc.key][yr.key] || []
      if (prop) {
        yr.values = yr.values.sort(function (a, b) {
          return Number.parseInt(b[prop]) - Number.parseInt(a[prop])
        })
      }
      if (addProp && typeof addProp === 'function') {
        yr.values = yr.values.map(addProp)
      }
      let i = 0
      while (response[direc.key][yr.key].length < n) {
        let cond1 = yr.values[i].id !== fipsCounty
        let cond2 = yr.values[i][targetFips(direc)[0]] < 58
        if (cond1 && cond2) {
          let fp = fipsMap.get(yr.values[i].id)
          let res = {name: `${fp.name}, ${fp.state}`}
          if (prop) {
            res.id = yr.values[i].id
            res.value = +yr.values[i][prop]
          } else {
            res = Object.assign(res, yr.values[i])
          }
          response[direc.key][yr.key].push(res)
        }
        i++
      }
    })
  })
  return response
}

// /** @function dataAnnualStatesForDimple
//  * @param { object[] } data - stateTotalByYear[direction].values
//  * @returns { object[] } - example: {fips:"10", name:"DE", year:"2004-2005", value:15}
//  * @description returns data in form for use in dimple line chart
//  */
// function dataAnnualStatesForDimple (data) {
//   return data.map(function (state) {
//     if (state.key > 57) { return }
//     let statename = fipsMap.get(state.key)
//     let res = years.map(function (yr) {
//       let v = state.values.find(function (y) { return y.key === yr })
//       let value = v === undefined ? 0 : v.value.n1
//       return {fips: state.key, name: statename, year: fullYear(yr), value: value}
//     })
//     return res
//   })
//   // remove (state > 57: undefined) placeholders
//   .filter(function (el) { return el !== undefined })
//   // flatten array of arrays: [[1],[2],[3]] -> [1,2,3]
//   .reduce(function (a, b) {
//     return a.concat(b)
//   }, [])
// }
//
/** @function dataTopNStates
 * @param { object } data - stateTotal.in || stateTotal.out
 * @param { string } [prop] - property to sort by
 * @param { number } [n=10] - number of data to return
 * @returns { object[] } { fips,name,value }
 */
function dataTopNStates (data, n = 10) {
  return Object.keys(data).map(function (state) {
    if (state > 57) { return }
    let statename = fipsMap.get(state)
    return {fips: state, name: statename, value: data[state].n1}
  })
  // remove (state > 57: undefined) placeholders
  .filter(function (el) { return el !== undefined })
  .sort(function (a, b) {
    return Number.parseInt(b.value) - Number.parseInt(a.value)
  })
  .slice(0, n)
}

/** @function write
 * saves data to a file
 * @param { String } filename - path of file to write
 * @param { String } text - data to write: stringified if not type string
 */
function write (filename, text) {
   /* output the file */
  if (typeof text !== 'string') text = JSON.stringify(text)
  fs.writeFile(filename, text,
    function (err) {
      if (err) { return console.log(err) }
      console.log('The file was saved as', filename)
    }
  )
}

/*******************************************************************************
        data munge helper functions
*******************************************************************************/

/** @function inOrOut
 * @param { object } d - d3.csvParse'd row of data from `000000combined.csv` file
 * @returns { string } 'in' or 'out', meaning 'immigration into' or
 * 'emigration out of' the county of interest
 */
function inOrOut (d) {
  return d.id === `${d.y1_statefips}${d.y1_countyfips}` ? 'in' : 'out'
}

/** @function targetFips
 * @param { string } direction - "in" or "out"
 * @returns { string[] } - property values for accessing d3.csvParsed data object
 * return[0] is state fips property name
 * return[1] is county fips property name
 * when direction == 'in', we are interested in the y1 data
 * when direction == 'out', we are intertest in the y2 data
 */
function targetFips (direction) {
  if (direction === 'out') {
    return ['y2_statefips', 'y2_countyfips']
  }
  return ['y1_statefips', 'y1_countyfips']
}

/** @function fullYear
 * @param { string } d - ex: "0405"
 * @returns { string } - ex: "2004-2005"
 * @description formats 2digit/2years string into 4digit/2years with hyphen
 */
function fullYear (d) {
  let res = /(\d{2})(\d{2})/.exec(d)
  res[1] = res[1] > 79 ? `19${res[1]}` : `20${res[1]}`
  res[2] = res[2] > 79 ? `19${res[2]}` : `20${res[2]}`
  return `${res[1]}-${res[2]}`
}
