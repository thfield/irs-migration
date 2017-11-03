'use strict'
const fs = require('fs')
const d3 = require('d3-dsv')

/** @function popParse
 * does the population parsing
 * @param {string} filepath - path to population.csv
 * @param {string[]} focalFips - array of strings of fips we're interested in
 * @returns {object} population data for counties id'd in focalFips
 */
function popParse (filepath, focalFips) {
  let data = d3.csvParse(fs.readFileSync(filepath, 'utf8'))
  let res = data.filter(function (d) {
    return focalFips.includes(d.fips)
  })
  return res
}

module.exports = popParse
