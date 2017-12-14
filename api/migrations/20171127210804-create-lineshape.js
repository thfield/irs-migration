'use strict'
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Lineshapes', {
      fips: {
        primaryKey: true,
        allowNull: false,
        type: Sequelize.STRING
      },
      geojson: {
        type: Sequelize.TEXT
      },
      createdAt: {
        defaultValue: Sequelize.literal('NOW()'),
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        defaultValue: Sequelize.literal('NOW()'),
        allowNull: false,
        type: Sequelize.DATE
      }
    })
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Lineshapes', {force: true})
  }
}
