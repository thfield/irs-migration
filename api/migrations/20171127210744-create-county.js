'use strict'
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Counties', {
      fips: {
        allowNull: false,
        type: Sequelize.STRING,
        primaryKey: true
      },
      state: {
        type: Sequelize.STRING
      },
      statefp: {
        type: Sequelize.STRING
      },
      countyfp: {
        type: Sequelize.STRING
      },
      name: {
        type: Sequelize.STRING
      },
      type: {
        type: Sequelize.STRING
      },
      createdAt: {
        allowNull: true,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: true,
        type: Sequelize.DATE
      }
    })
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Counties')
  }
}
