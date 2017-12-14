'use strict'
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Migrations', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      fipsIn: {
        type: Sequelize.STRING,
        // references: {
        //   model: 'Counties',
        //   key: 'fips'
        // }
      },
      fipsOut: {
        type: Sequelize.STRING
      },
      y1_statefips: {
        type: Sequelize.STRING
      },
      y1_countyfips: {
        type: Sequelize.STRING
      },
      y2_statefips: {
        type: Sequelize.STRING
      },
      y2_countyfips: {
        type: Sequelize.STRING
      },
      n1: {
        type: Sequelize.STRING
      },
      n2: {
        type: Sequelize.STRING
      },
      agi: {
        type: Sequelize.STRING
      },
      year: {
        type: Sequelize.STRING
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
    }).then(() => queryInterface.addIndex('Migrations', ['fipsIn', 'fipsOut', 'year']))
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Migrations', {force: true})
  }
}
