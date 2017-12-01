'use strict'
module.exports = (sequelize, DataTypes) => {
  var CountyMigration = sequelize.define('CountyMigration', {
    fipsIn: DataTypes.STRING,
    fipsOut: DataTypes.STRING,
    y1_statefips: DataTypes.STRING,
    y1_countyfips: DataTypes.STRING,
    y2_statefips: DataTypes.STRING,
    y2_countyfips: DataTypes.STRING,
    n1: DataTypes.STRING,
    n2: DataTypes.STRING,
    agi: DataTypes.STRING,
    year: DataTypes.STRING
  })

  CountyMigration.associate = function (models) {
    models.CountyMigration.hasMany(models.County)
  }

  return CountyMigration
}
