'use strict'
module.exports = (sequelize, DataTypes) => {
  var County = sequelize.define('County', {
    fips: { type: DataTypes.STRING, primaryKey: true },
    state: DataTypes.STRING,
    statefp: DataTypes.STRING,
    countyfp: DataTypes.STRING,
    name: DataTypes.STRING,
    type: DataTypes.STRING
  })

  County.associate = function (models) {
    // models.County.hasMany(models.CountyMigration)
    models.County.hasOne(models.CountyPop, {foreignKey: 'fips', as: 'Population'})
    models.County.hasOne(models.Lineshape, {foreignKey: 'fips'})
  }
  return County
}
