'use strict'
const fs = require('fs')
const d3 = require('d3-dsv')
module.exports = {
  up: (queryInterface, Sequelize) => {
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.bulkInsert('Person', [{
        name: 'John Doe',
        isBetaMember: false
      }], {});
    */
    // let countySeedData = d3.csvParse(fs.readFileSync('../data/pg/counties.csv', 'utf8'))
    let popSeedData = d3.csvParse(fs.readFileSync('../data/population.csv', 'utf8'), function (r) {
      let rowNames = Object.keys(r)
      rowNames.forEach(function (prop) {
        if (r[prop] === 'undefined') { r[prop] = null }
      })
      return r
    })
    popSeedData = popSeedData.map(d => {
      d.createdAt = new Date()
      d.updatedAt = new Date()
      return d
    })
    return queryInterface.bulkInsert('Populations', popSeedData, {})
  },

  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.bulkDelete('Person', null, {});
    */
    return queryInterface.bulkDelete('Populations', null, {})
  }
}
