'use strict'
module.exports = (sequelize, DataTypes) => {
  var CountyMigration = sequelize.define('CountyMigration', {
    id: { type: DataTypes.INTEGER, primaryKey: true },
    fipsIn: { type: DataTypes.STRING },
    migrationId: { type: DataTypes.INTEGER }
  })

  CountyMigration.associate = function (models) {
    // TODO: set up N:M association:
    // https://stackoverflow.com/questions/22958683/how-to-implement-many-to-many-association-in-sequelize
    // https://stackoverflow.com/questions/41528676/sequelize-belongstomany-with-custom-join-table-primary-key
    // https://stackoverflow.com/questions/28974021/sequelize-join-on-non-primary-key
    // https://codeburst.io/sequelize-migrations-setting-up-associations-985d29b61ee7
    models.CountyMigration.belongsTo(models.County, { foreignKey: 'fipsIn' })
    models.CountyMigration.belongsTo(models.Population, { foreignKey: 'migrationId' })
  }

  return CountyMigration
}
