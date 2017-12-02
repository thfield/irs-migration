'use strict'
module.exports = {
  up: (queryInterface, Sequelize) => {
    // return queryInterface.createTable('CountyMigrations', {
    //   id: { type: Sequelize.INTEGER, primaryKey: true, allowNull: false },
    //   fipsIn: {
    //     type: Sequelize.STRING,
    //     allowNull: false,
    //     references: {
    //       model: 'Counties',
    //       key: 'fips'
    //     },
    //     onUpdate: 'cascade',
    //     onDelete: 'cascade'
    //   },
    //   migrationId: {
    //     type: Sequelize.INTEGER,
    //     allowNull: false,
    //     references: {
    //       model: 'Migrations',
    //       key: 'id'
    //     },
    //     onUpdate: 'cascade',
    //     onDelete: 'cascade'
    //   },
    //   createdAt: {
    //     allowNull: false,
    //     type: Sequelize.DATE
    //   },
    //   updatedAt: {
    //     allowNull: false,
    //     type: Sequelize.DATE
    //   }
    // })
  },
  down: (queryInterface, Sequelize) => {
    // return queryInterface.dropTable('CountyMigrations', {force: true})
  }
}