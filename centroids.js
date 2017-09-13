"use strict";
const fs = require('fs')
const turf = require('turf')

const pathIn = './data/geo/'
const pathOut = './data/raw-geo/'

;[
  {
    in: 'states.geojson',
    out: 'stateCentroids.geojson'
  },
  {
    in: 'counties.geojson',
    out: 'countyCentroids.geojson'
  }
].forEach((file)=>{
    findCentroids( pathIn+file.in, pathOut+file.out )
})


function findCentroids(input,output){
  let geojson = JSON.parse( fs.readFileSync(input) )

  let arr = geojson.features.map((feat)=>{
    let centroid = turf.centroid(feat)
    centroid.properties = feat.properties
    return centroid
  })

  write(output, turf.featureCollection(arr))
}


// output the file
function write(filename, text){
  if (typeof text != 'string') text = JSON.stringify(text)
  fs.writeFile(filename, text,
    function(err) {
      if (err) { return console.log(err); }
      console.log("The file was saved as", filename);
    }
  )
}
