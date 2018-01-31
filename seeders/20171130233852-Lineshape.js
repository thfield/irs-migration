'use strict'
const fs = require('fs')
module.exports = {
  up: (queryInterface, Sequelize) => {
    // just seed data
    // let lineshapeSeedData = JSON.parse(fs.readFileSync('../data/pg/seed-lineshapes.json', 'utf8'))
    // lineshapeSeedData = lineshapeSeedData.map(d => {
    //   d.createdAt = new Date()
    //   d.updatedAt = new Date()
    //   return d
    // })
    // return queryInterface.bulkInsert('Lineshapes', lineshapeSeedData, {})
    // console.log(`Current directory: ${process.cwd()}`);
    // all the data
    let lineshapeData = JSON.parse(fs.readFileSync('data/geo/counties.geojson', 'utf8')).features
    lineshapeData = lineshapeData.map(d => {
      let r = {}
      r.fips = d.properties.geoid
      r.statefp = d.properties.statefp
      r.geojson = JSON.stringify(d)
      return r
    })
    return queryInterface.bulkInsert('Lineshapes', lineshapeData, {})
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Lineshapes', null, {})
  }
}
