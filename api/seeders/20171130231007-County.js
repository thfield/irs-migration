'use strict'
const fs = require('fs')
const d3 = require('d3-dsv')
module.exports = {
  up: (queryInterface, Sequelize) => {
    let countySeedData = d3.csvParse(fs.readFileSync('../data/pg/counties.csv', 'utf8'))
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.bulkInsert('Person', [{
        name: 'John Doe',
        isBetaMember: false
      }], {});
    */
    return queryInterface.bulkInsert('Counties', countySeedData, {})
  },

  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.bulkDelete('Person', null, {});
    */
    return queryInterface.bulkDelete('Counties', null, {})
  }
}
