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
    // let sql = `CREATE UNIQUE INDEX "CountyMigrationCompoundIndex"
    //         ON public."CountyMigrations"
    //         USING btree
    //         ("fipsIn", "migrationId");
    //       `
    // return queryInterface.sequelize.query(sql, {raw: true})
  },

  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.bulkDelete('Person', null, {});
    */
    // return queryInterface.bulkDelete('CountyMigrations', null, {})
  }
}
