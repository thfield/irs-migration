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
    // TODO: set up N:M association:
    // https://stackoverflow.com/questions/22958683/how-to-implement-many-to-many-association-in-sequelize
    // https://stackoverflow.com/questions/41528676/sequelize-belongstomany-with-custom-join-table-primary-key
    // https://stackoverflow.com/questions/28974021/sequelize-join-on-non-primary-key
    models.County.belongsToMany(models.Migration, {foreignKey: 'fips', as: 'MigrationIn', through: 'county_migrationIn'})
    // models.County.belongsToMany(models.Migration, {foreignKey: 'fips', as: 'MigrationOut', through: 'county_migrationOut'})

    models.County.hasOne(models.Population, {foreignKey: 'fips'})
    models.County.hasOne(models.Lineshape, {foreignKey: 'fips'})
  }
  return County
}
