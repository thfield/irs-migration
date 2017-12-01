'use strict'
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Populations', {
      fips: {
        allowNull: false,
        type: Sequelize.STRING,
        primaryKey: true
      },
      pop2000: {
        type: Sequelize.INTEGER
      },
      pop2001: {
        type: Sequelize.INTEGER
      },
      pop2002: {
        type: Sequelize.INTEGER
      },
      pop2003: {
        type: Sequelize.INTEGER
      },
      pop2004: {
        type: Sequelize.INTEGER
      },
      pop2005: {
        type: Sequelize.INTEGER
      },
      pop2006: {
        type: Sequelize.INTEGER
      },
      pop2007: {
        type: Sequelize.INTEGER
      },
      pop2008: {
        type: Sequelize.INTEGER
      },
      pop2009: {
        type: Sequelize.INTEGER
      },
      pop2010: {
        type: Sequelize.INTEGER
      },
      pop2011: {
        type: Sequelize.INTEGER
      },
      pop2012: {
        type: Sequelize.INTEGER
      },
      pop2013: {
        type: Sequelize.INTEGER
      },
      pop2014: {
        type: Sequelize.INTEGER
      },
      pop2015: {
        type: Sequelize.INTEGER
      },
      pop2016: {
        type: Sequelize.INTEGER
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
    return queryInterface.dropTable('Populations')
  }
}
