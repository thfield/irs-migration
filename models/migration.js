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
    // https://stackoverflow.com/questions/41528676/sequelize-belongstomany-with-custom-join-table-primary-key
    // https://stackoverflow.com/questions/28974021/sequelize-join-on-non-primary-key
    // https://codeburst.io/sequelize-migrations-setting-up-associations-985d29b61ee7
    // models.Migration.belongsToMany(models.County, {
    //   as: 'Y1County',
    //   foreignKey: 'fips',
    //   otherKey: 'fipsIn',
    //   through: 'CountyMigration'
    // })
  }

  return Migration
}
