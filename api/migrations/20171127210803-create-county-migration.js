'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('CountyMigrations', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      fipsIn: {
        type: Sequelize.STRING
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
        type: Sequelize.DATE
      },
      updatedAt: {
        type: Sequelize.DATE
      }
    }).then(() => queryInterface.addIndex('CountyMigrations', ['fipsIn', 'fipsOut', 'year']));
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('CountyMigrations');
  }
};