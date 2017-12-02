'use strict'
const fs = require('fs')

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
    let popSeedData = JSON.parse(fs.readFileSync('../data/pg/seed-populations.json', 'utf8'))
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
