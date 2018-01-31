'use strict'
module.exports = (sequelize, DataTypes) => {
  var Lineshape = sequelize.define('Lineshape', {
    fips: { type: DataTypes.STRING, primaryKey: true },
    statefp: DataTypes.STRING,
    geojson: DataTypes.TEXT
  })

  Lineshape.associate = function (models) {
    models.Lineshape.belongsTo(models.County, {foreignKey: 'fips'})
  }
  return Lineshape
}
