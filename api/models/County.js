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
    // models.County.hasMany(models.Migration)
    // TODO: set up N:M association:
    // https://stackoverflow.com/questions/22958683/how-to-implement-many-to-many-association-in-sequelize
    models.County.hasOne(models.Population, {foreignKey: 'fips', as: 'Population'})
    models.County.hasOne(models.Lineshape, {foreignKey: 'fips'})
  }
  return County
}
