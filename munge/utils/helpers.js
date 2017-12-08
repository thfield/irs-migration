'use strict'

/** @function getPopData
 * @param {string} fips - fips code for county
 * @param {string} year - year for population (YYYY format)
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
 * @returns {string} expanded year (YYYY) eg: 1995, 2005, 2015
 */
function fullYear (yr) {
  let c = (yr.charAt(2) < 9) ? '20' : '19'
  return `${c}${yr.slice(2, 4)}`
}

/** @function otherFips
 * @param {string} fips - target fips
 * @param {object} mig - migration data object
 */
function otherFips (fips, mig) {
  return mig.fipsIn === fips ? mig.fipsOut : mig.fipsIn
}

/** @function standardFips
 * is the migration data row for a fips standard county?
 * @param {object} data - migration data object
 * @returns {boolean} true = all conditions met, false = at least one condition not met
 */
function standardFips (data) {
  // state fips 57 is the irs migration "state" indicating foreign
  let conditions = [
    +data.y1_statefips < 57,
    +data.y2_statefips < 57
  ]
  return !conditions.includes(false)
}

/** @function arrayToCsvString
 * turn an array of objects into a csv string, row separated by '\n'
 * @param {object[]} - array of objects
 * @param {string[]} - header row
 * @returns {string}
 */
function arrayToCsvString (arr, headers) {
  function obj2str (obj, props) {
    let r = ''
    props.forEach(function (p, i, a) {
      r += obj[p]
      if (i < a.length - 1) r += ','
    })
    return r
  }

  return arr.map(function (el) {
    return obj2str(el, headers)
  }).join('\n')
}

module.exports = {getPopData, fullYear, otherFips, standardFips, arrayToCsvString}
