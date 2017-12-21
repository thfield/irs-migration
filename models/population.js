'use strict'
module.exports = (sequelize, DataTypes) => {
  var Population = sequelize.define('Population', {
    fips: { type: DataTypes.STRING, primaryKey: true },
    pop2000: DataTypes.INTEGER,
    pop2001: DataTypes.INTEGER,
    pop2002: DataTypes.INTEGER,
    pop2003: DataTypes.INTEGER,
    pop2004: DataTypes.INTEGER,
    pop2005: DataTypes.INTEGER,
    pop2006: DataTypes.INTEGER,
    pop2007: DataTypes.INTEGER,
    pop2008: DataTypes.INTEGER,
    pop2009: DataTypes.INTEGER,
    pop2010: DataTypes.INTEGER,
    pop2011: DataTypes.INTEGER,
    pop2012: DataTypes.INTEGER,
    pop2013: DataTypes.INTEGER,
    pop2014: DataTypes.INTEGER,
    pop2015: DataTypes.INTEGER,
    pop2016: DataTypes.INTEGER
  })

  Population.associate = function (models) {
    models.Population.belongsTo(models.County, {foreignKey: 'fips'})
  }

  return Population
}
