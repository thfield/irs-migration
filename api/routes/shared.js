'use strict'

/** @function uniqueFips
 * @param {array} migrations  - array of sequelize objects returned from query
 * @param {string} [direction=in]  - "in" or "out"
 * @returns {array} unique fips from the migration array
 */
function uniqueFips (migrations, direction = 'in') {
  // TODO: there is probably a sequelize 'SELECT UNIQUE' function that does exactly this.
  let res = new Set()
  let dir = getOtherDirProp(direction)
  migrations.forEach(function (migration) {
    res.add(migration[dir])
  })
  return Array.from(res)
}

function getDirProp (direction) {
  direction = direction.toLowerCase()
  let ds = { in: 'fipsIn', out: 'fipsOut' }
  return ds[direction]
}

function getOtherDirProp (direction) {
  direction = direction.toLowerCase()
  return { out: 'fipsIn', in: 'fipsOut' }[direction]
}

module.exports = { uniqueFips, getDirProp, getOtherDirProp }
