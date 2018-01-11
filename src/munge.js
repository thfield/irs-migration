/*******************************************************************************
        data munge functions
*******************************************************************************/

/** @function choroplethData
 * @param { object[] } data - values array of nestedCountyData from nestedFind()
 * @param { string } prop - property to assign to val
 * @param { string } [key='id'] - property name of data unique key
 * @returns { object[] }
 */
function choroplethData (data, prop, key = 'id') {
  // turn data into "id, data" k-v pairs
  let foo = data.map(function (d) {
    return { id: d[key], val: +d[prop] }
  })
  return foo
}

/** @function dataTopNCounties
 * @param { object[] } data - values array of nestedCountyData from nestedFind()
 * @param { string } [prop] - property to sort by
 * @param { map } [fipsMap] - map of fips to county names
 * @param { number } [n=10] - first n records to return
 * @param { function } [addProp] - function for adding additional property,
 * takes as param {foo}, expect return {foo} with additional property prop
 * implemented with Array.map(addProp) on [year].values
 * @param { boolean } [onlyOutOfState=false] - count out of state only?
 * @param { string } [fipsCounty='06075'] - fips identifier for county (default SF)
 * @returns { object[] }
 */
function dataTopNCounties (data, prop, fipsMap, n = 10, addProp, onlyOutOfState = false, fipsCounty = '06075') {
  let response = []
  if (addProp && typeof addProp === 'function') {
    data = data.map(addProp)
  }
  if (prop) {
    data = data.sort(function (a, b) {
      if (isNaN(Number.parseInt(b[prop]))) { return 1 }
      return Number.parseInt(b[prop]) - Number.parseInt(a[prop])
    }).filter(function (d) {
      return !isNaN(Number.parseInt(d[prop]))
    })
  }
  let i = 0
  while (response.length < n) {
    let cond1 = data[i].id !== fipsCounty // not the target county
    let cond2 = data[i].y1_statefips < 58 && data[i].y2_statefips < 58 // not an irs-made-up "state
    let cond3 = true // count out of state counties?
    if (onlyOutOfState) {
      cond3 = data[i].y1_statefips !== data[i].y2_statefips
    }
    if (cond1 && cond2 && cond3) {
      let fp = fipsMap.get(data[i].id)
      let res = {
        name: `${fp.name}, ${fp.state}`,
        id: data[i].id,
        n1: data[i].n1,
        n2: data[i].n2,
        agi: data[i].agi,
        pop: data[i].pop
      }
      if (prop) {
        res.value = +data[i][prop]
        delete res[prop]
      }
      response.push(res)
    }
    i++
  }
  return response
}

/** @function dataTopNStates
 * @param { object } data - values array of nestedStateData from nestedFind()
 * @param { string } prop - property of interest
 * @param { map } [fipsMap] - map of fips to county names
 * @param { number } [n=10] - number of data to return
 * @param { string } [stateFips=false] - specify state to disregard
 * @param { function } [addProp] - function for adding additional property,
 * takes as param {foo}, expect return {foo} with additional property prop
 * implemented with Array.map(addProp) on [year].values
 * @returns { object[] } { fips,name,value }
 */
function dataTopNStates (data, prop, fipsMap, n = 10, stateFips = false, addProp) {
  let response = []
  response = data.map(function (state) {
    if (state.key > 57) { return }
    if (stateFips && state.key === stateFips) { return }
    let statename = fipsMap.get(state.key)
    if (addProp && typeof addProp === 'function') {
      state.value = addProp(state.value)
    }
    let res = Object.assign({fips: state.key, name: statename, value: state.value[prop]}, state.value)
    delete res[prop]
    return res
  })
  // remove (state > 57: undefined) placeholders
  .filter(function (el) { return el !== undefined })
  .sort(function (a, b) {
    return Number.parseInt(b.value) - Number.parseInt(a.value)
  })
  .slice(0, n)
  return response
}

/*******************************************************************************
        data munge helper functions
*******************************************************************************/

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

/** @function domainVals
 * @param {object} data - nestedCountyData
 * @param {string} direction - 'in'||'out'
 * @param {string} year - one of ['0405', ..., '1415']
 * @param {string} stat - one of ['n1', 'n2', 'agi', 'meanAgi']
 * @param {string} fipsCounty - fips identifier for the county of interest
 * @returns {array} array of stat values for the data in that direction & year
 */
function domainVals (data, direction, year, stat, fipsCounty) {
  // TODO: handle error arising from no data for year/direction
  return nestedFind(data, direction, year)
    .map((d) => {
      return (d.y1_statefips < 58 && d.id !== fipsCounty && d[stat] !== '-1')
        ? +d[stat]
        : null
    })
}

/** @function getNestedIndex
 * @param {object} data - "values" array of d3.nested data
 * @param {string} value - value of key to be found
 * @param {string} [key='key'] - property to match
 * @returns {number} index of desired object in "values" array
 */
function getNestedIndex (data, value, key = 'key') {
  return data.findIndex(function (d) {
    return d[key] === value
  })
}

/** @function nestedFind
 * @param data - a d3.nest().entries() object
 * @param keys - the keys to find values for, in nested order
 * @returns *falsey* if not found, otherwise *value*
 */
function nestedFind (data, ...keys) {
  let res = data.find(function (el) { return el.key === keys[0] })
  if (!res) return undefined
  if (keys.length > 1) {
    keys.shift()
    return nestedFind(res.values, ...keys)
  }
  return res.value ? res.value : res.values
}

/** @function inOrOut
 * @param { object } d - d3.csvParse'd row of data from `000000combined.csv` file
 * @returns { string } 'in' or 'out', meaning 'immigration into' or
 * 'emigration out of' the county of interest
 */
function inOrOut (d) {
  return d.id === `${d.y1_statefips}${d.y1_countyfips}` ? 'in' : 'out'
}

/** @function fullYear
 * @param { string } d - ex: '0405'
 * @returns { string } - ex: '2004-2005'
 * @description formats 2digit/2years string into 4digit/2years with hyphen
 */
function fullYear (d) {
  let res = /(\d{2})(\d{2})/.exec(d)
  res[1] = res[1] > 79 ? `19${res[1]}` : `20${res[1]}`
  res[2] = res[2] > 79 ? `19${res[2]}` : `20${res[2]}`
  return `${res[1]}-${res[2]}`
}

module.exports = {
  choroplethData: choroplethData,
  dataTopNCounties: dataTopNCounties,
  dataTopNStates: dataTopNStates,
  targetFips: targetFips,
  domainVals: domainVals,
  nestedFind: nestedFind,
  inOrOut: inOrOut,
  fullYear: fullYear
}
