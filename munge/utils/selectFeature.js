const turf = require('@turf/helpers')

/**
 * choose features from a geoJSON featureCollection where feature.properties[idProp] == [id]
 * @param {string[]} ids
 * @param {string} idProp
 * @param {Object} featureCollection - geoJSON FeatureCollection
 * @returns {FeatureCollection} geoJSON FeatureCollection
 */
module.exports = (ids, idProp, featureCollection) => {
  let chosenFeatures = ids.map(id => {
    return featureCollection.features.find(feature => {
      return feature.properties[idProp] === id
    })
  }).filter(feature => { return feature != null || feature !== undefined })

  return turf.featureCollection(chosenFeatures)
}
