'use strict'
const fs = require('fs')
const d3 = require('d3-dsv')

/** @function combineData
 * @param {string} st - state fips code
 * @param {string} co - county fips code
 * @param {string[]} years - array of years
 * @param {string} path
 * @returns {array} focalFips
 */
function combineData (st, co, years, path = '../data') {
  const fips = st.concat(co)
  // create file for combined data
  let combinedPath = `${path}/${fips}/${fips}combined.csv`
  if (fs.existsSync(combinedPath)) {
    // delete file if exists so it doesn't keep being appended to
    fs.unlinkSync(combinedPath)
  }
  let combinedCsv = fs.createWriteStream(combinedPath)
  let headers = 'year,id,y1_statefips,y1_countyfips,y2_statefips,y2_countyfips,n1,n2,agi\n'
  combinedCsv.write(headers)

  // create Set for unique fips
  let focalFips = new Set()

  ;['inflow', 'outflow'].forEach(function (direction) {
    years.forEach(function (year) {
      let file = `${path}/${fips}/${fips}${direction}${year}.csv`
      let data = d3.csvParse(fs.readFileSync(file, 'utf8'))

      data.forEach(function (county) {
        focalFips.add(county.y1_statefips + county.y1_countyfips)
        focalFips.add(county.y2_statefips + county.y2_countyfips)

        let id = (county.y1_statefips === st && county.y1_countyfips === co)
          ? county.y2_statefips.concat(county.y2_countyfips)
          : county.y1_statefips.concat(county.y1_countyfips)

        let convertedData = `${year},${id},${county.y1_statefips},${county.y1_countyfips},${county.y2_statefips},${county.y2_countyfips},${county.n1},${county.n2},${county.agi}\n`
        combinedCsv.write(convertedData)
      })
    })
  })
  // change to Array because selectFeature() expects an array
  focalFips = Array.from(focalFips)

  // close fileWriteStream
  combinedCsv.end()
  console.log(`File saved as ${combinedPath}`)

  return focalFips
}

module.exports = combineData
