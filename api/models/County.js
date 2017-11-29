'use strict';
module.exports = (sequelize, DataTypes) => {
  var County = sequelize.define('County', {
    fips: { type: DataTypes.STRING, primaryKey: true },
    state: DataTypes.STRING,
    statefp: DataTypes.STRING,
    countyfp: DataTypes.STRING,
    name: DataTypes.STRING,
    type: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {
        County.hasMany(models.CountyMigration)
        County.hasMany(models.CountyPop)
      }
    }
  });
  return County;
};