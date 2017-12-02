'use strict'
const fs = require('fs')
const d3 = require('d3-dsv')
const writeCsv = require('./write-csv')
const h = require('./helpers')

/** @function combineData
 * @param {string} st - state fips code
 * @param {string} co - county fips code
 * @param {string[]} years - array of years
 * @param {string} path
 * @param {boolean} pare - remove non-standard county fips?
 * @returns {array} focalFips
 */
function combineData (st, co, years, path = '../data', pare = false) {
  const fips = st.concat(co)
  // create file for combined data
  let combinedPath = `${path}/${fips}/${fips}combined.csv`

  // create Set for unique fips
  let focalFips = new Set()

  let popData = d3.csvParse(fs.readFileSync(`${path}/population.csv`, 'utf8'))
  let combinedData = []

  ;['inflow', 'outflow'].forEach(function (direction) {
    years.forEach(function (year) {
      let file = `${path}/${fips}/${fips}${direction}${year}.csv`
      let data = d3.csvParse(fs.readFileSync(file, 'utf8'))

      data.forEach(function (county) {
        let id = (county.y1_statefips === st && county.y1_countyfips === co)
          ? county.y2_statefips.concat(county.y2_countyfips)
          : county.y1_statefips.concat(county.y1_countyfips)

        let pop = h.getPopData(id, h.fullYear(year), popData)

        let countyData = {
          id: id,
          year: year,
          y1_statefips: county.y1_statefips,
          y1_countyfips: county.y1_countyfips,
          y2_statefips: county.y2_statefips,
          y2_countyfips: county.y2_countyfips,
          n1: county.n1,
          n2: county.n2,
          agi: county.agi,
          pop: pop
        }
        if (!pare && h.standardFips(countyData)) {
          focalFips.add(county.y1_statefips + county.y1_countyfips)
          focalFips.add(county.y2_statefips + county.y2_countyfips)
          combinedData.push(countyData)
        }
      })
    })
  })

  writeCsv(combinedPath, combinedData)

  // change to Array because selectFeature() expects an array
  focalFips = Array.from(focalFips)
  return focalFips
}

module.exports = combineData
