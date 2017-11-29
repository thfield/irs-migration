'use strict';
module.exports = (sequelize, DataTypes) => {
  var Lineshape = sequelize.define('Lineshape', {
    fips: { type: DataTypes.STRING, primaryKey: true },
    geojson: DataTypes.TEXT
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    }
  });
  return Lineshape;
};