'use strict'

/** @function getPopData
 * @param {string} fips - fips code for county
 * @param {string} year - year for population
 * @param {object[]} popData - array of population data objects
 * @returns {string} population for county/year
 */
function getPopData (fips, year, popData) {
  let res = popData.find(function (d) {
    return d.fips === fips
  })
  return res ? res[`pop${year}`] : 0
}

/** @function fullYear
 * @param {string} yr - 4 char string of Y1Y2, eg: 9495, 0405, 1415
 * @returns {string} expanded year eg: 1995, 2005, 2015
 */
function fullYear (yr) {
  let c = (yr.charAt(3) < 9) ? '20' : '19'
  return `${c}${yr.slice(2, 4)}`
}

module.exports = {getPopData, fullYear}
