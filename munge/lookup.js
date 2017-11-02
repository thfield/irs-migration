'use strict'
const fs = require('fs')
const d3 = require('d3-dsv')

/** search for county fips code by name
 * @param {string} county
 * @param {string} state
 * @param {boolean} [moreinfo=false] - display more info?
 * @returns {string} fips code and data for that county
 */
function lookupByName (targetCounty, targetState, moreinfo = false) {
  let res = ''
  if (targetCounty === undefined || targetState === undefined) {
    res += ('you must specify a county and state\n')
    res += ('in the format: County ST')
    return res
  }
  targetCounty = targetCounty.toLowerCase()
  targetState = targetState.toLowerCase()

  const path = '../data'
  const fipsCounty = '06075'

  let fipsPath = `${path}/fipscodes.csv`
  const fips = d3.csvParse(fs.readFileSync(fipsPath, 'utf8'), function (r) {
    r.state = r.state.toLowerCase()
    r.name = r.name.toLowerCase()
    return r
  })

  let foundCounty = fips.find(function (d) {
    return d.state === targetState && d.name.startsWith(targetCounty)
  })

  res += (`You searched for ${targetCounty}, ${targetState}\n`)
  if (!foundCounty) {
    res += 'Could not find that code'
    return res
  }
  res += (`Found ${foundCounty.name}, ${foundCounty.state}\n`)
  res += (`FIPS Code: ${foundCounty.statefp}${foundCounty.countyfp}\n`)

  if (moreinfo) {
    let dataPath = `${path}/${fipsCounty}/${fipsCounty}combined.csv`
    const data = d3.csvParse(fs.readFileSync(dataPath, 'utf8'), function (r) {
      let meanAgi = +r.agi / +r.n1
      return Object.assign(r, {meanAgi: meanAgi})
    })

    let dataIn = data.filter(function (d) {
      let cond1 = d.id === `${foundCounty.statefp}${foundCounty.countyfp}`
      let cond3 = d.y1_countyfips === foundCounty.countyfp
      return (cond1 && cond3)
    })

    let dataOut = data.filter(function (d) {
      let cond1 = d.id === `${foundCounty.statefp}${foundCounty.countyfp}`
      let cond3 = d.y2_countyfips === foundCounty.countyfp
      return (cond1 && cond3)
    })

    res += ('In\n')
    res += (dataIn.map(formatResponse).join('\n'))
    res += ('\nOut\n')
    res += (dataOut.map(formatResponse).join('\n'))
  }

  function formatResponse (d) {
    return `year: ${d.year}, n1: ${d.n1}, n2: ${d.n2}, agi: ${d.agi}, meanAgi: ${d.meanAgi}`
  }

  return res
}

/** search for county name by fips code
 * @param state
 * @param county
 * @returns {string} fips code and data for that county
 */
function lookupByFips (targetState, targetCounty) {
  let res = ''

  if (targetState.length === 5) {
    targetCounty = targetState.substr(2, 3)
    targetState = targetState.substr(0, 2)
  }

  if (targetCounty === undefined || targetState === undefined) {
    res += 'you must specify a state and county fips code\n'
    res += 'in the format: ST COU'
    return res
  }

  const path = '../data'

  let fipsPath = `${path}/fipscodes.csv`
  const fips = d3.csvParse(fs.readFileSync(fipsPath, 'utf8'))

  let foundCounty = fips.find(function (d) {
    return d.statefp === targetState && d.countyfp === targetCounty
  })

  res += `You searched for ${targetState} ${targetCounty}\n`

  if (!foundCounty) {
    res += 'Could not find that code'
    return res
  }

  res += `Found ${foundCounty.name}, ${foundCounty.state}\n`
  res += `FIPS Code: ${foundCounty.statefp}${foundCounty.countyfp}`
  return res
}

module.exports = {byFips: lookupByFips, byName: lookupByName}
