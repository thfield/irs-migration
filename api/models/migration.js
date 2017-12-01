'use strict'
module.exports = (sequelize, DataTypes) => {
  var Migration = sequelize.define('Migration', {
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

  Migration.associate = function (models) {
    // TODO: set up N:M association:
    // https://stackoverflow.com/questions/22958683/how-to-implement-many-to-many-association-in-sequelize
    // models.Migration.hasMany(models.County)
  }

  return Migration
}
