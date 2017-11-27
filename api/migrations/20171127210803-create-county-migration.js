'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('CountyMigrations', {
      fipsIn: {
        allowNull: false,
        type: Sequelize.STRING,
        primaryKey: true
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
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('CountyMigrations');
  }
};