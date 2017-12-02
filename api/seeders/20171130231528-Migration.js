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
    let migrationSeedData = JSON.parse(fs.readFileSync('../data/pg/seed-migrations.json', 'utf8'))
    migrationSeedData = migrationSeedData.map(d => {
      d.createdAt = new Date()
      d.updatedAt = new Date()
      return d
    })
    return queryInterface.bulkInsert('Migrations', migrationSeedData, {})
  },

  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.bulkDelete('Person', null, {});
    */
    return queryInterface.bulkDelete('Migrations', null, {})
  }
}
