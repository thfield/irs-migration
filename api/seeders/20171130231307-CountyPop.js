'use strict'
const fs = require('fs')

module.exports = {
  up: (queryInterface, Sequelize) => {
    let popSeedData = JSON.parse(fs.readFileSync('../data/pg/seed-populations.json', 'utf8'))
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.bulkInsert('Person', [{
        name: 'John Doe',
        isBetaMember: false
      }], {});
    */
    return queryInterface.bulkInsert('CountyPops', popSeedData, {})
  },

  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.bulkDelete('Person', null, {});
    */
    return queryInterface.bulkDelete('CountyPops', null, {})
  }
}
