'use strict'

/** @function uniqueFips
 * @param {array} migrations  - array of sequelize objects returned from query
 * @returns {array} unique fips from the migration array
 */
function uniqueFips (migrations) {
  // TODO: there is probably a sequelize 'SELECT UNIQUE' function that does exactly this.
  let res = new Set()
  migrations.forEach(function (migration) {
    res.add(migration.fipsIn)
    res.add(migration.fipsOut)
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

/** @function figureOutDirection
 * figures out what direction
 * @param {string} fips - fips code
 * @param {object[]} migration - migration object from DB
 */
function figureOutDirection (fips, migration) {
  if (fips === migration.fipsIn) {
    return 'fipsIn'
  } else if (fips === migration.fipsOut) {
    return 'fipsOut'
  }
  return null
}

/** @function figureOutOppositeDirection
 * figures out what direction
 * @param {string} fips - fips code
 * @param {object} migration - sequelize migration object from DB
 */
function figureOutOppositeDirection (fips, migration) {
  if (fips === migration.fipsIn) {
    return 'fipsOut'
  } else if (fips === migration.fipsOut) {
    return 'fipsIn'
  }
  return null
}

module.exports = { uniqueFips, getDirProp, getOtherDirProp, figureOutDirection, figureOutOppositeDirection }
