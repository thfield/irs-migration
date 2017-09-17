#!/bin/bash
# requires:
#   node (nodejs.org)
#   npm (npmjs.org)
#   topojson (https://github.com/topojson/topojson)
#   geoprojection (https://github.com/d3/d3-geo-projection)
#   ndjson-cli (https://github.com/mbostock/ndjson-cli)
#   shapefile (https://github.com/mbostock/shapefile)
# following https://medium.com/@mbostock/command-line-cartography-part-1-897aa8f8ca2c

cd ./data

rm -rvf geo
mkdir -p raw-geo
mkdir -p geo


# ##### county shapefiles #####

# download from census bureau and unzip
if [ ! -f raw-geo/cb_2015_us_county_5m.shp ]; then
  curl -o raw-geo/cb_2015_us_county_5m.zip 'https://www2.census.gov/geo/tiger/GENZ2015/shp/cb_2015_us_county_5m.zip'
  unzip raw-geo/cb_2015_us_county_5m.zip -d raw-geo
fi

# convert to geojson
shp2json raw-geo/cb_2015_us_county_5m.shp -o geo/counties.geojson

# county geo->topo conversion done in parse-county.js


##### state shapefiles #####

# download from census bureau and unzip
if [ ! -f raw-geo/cb_2015_us_state_5m.shp ]; then
  curl -o raw-geo/cb_2015_us_state_5m.zip 'https://www2.census.gov/geo/tiger/GENZ2015/shp/cb_2015_us_state_5m.zip'
  unzip raw-geo/cb_2015_us_state_5m.zip -d raw-geo
fi

# convert to geojson
shp2json raw-geo/cb_2015_us_state_5m.shp -o geo/states.geojson

# apply projection
geoproject 'd3.geoAlbersUsa()' < geo/states.geojson > geo/states-albers.geojson

# turn into NDJSON format
# filter only 50 states + DC
# get rid of extra properties
ndjson-split 'd.features' \
  < geo/states-albers.geojson \
  | ndjson-filter 'd.properties.STATEFP < 57 && d.properties.STATEFP > 0' \
      | ndjson-map 'd.properties = {statefp:d.properties.STATEFP, usps:d.properties.STUSPS, name:d.properties.NAME}, d' \
          > geo/states.ndjson

# reformat from ndjson -> geojson
ndjson-reduce \
  < geo/states.ndjson \
  | ndjson-map '{type: "FeatureCollection", features: d}' \
  > geo/states.geojson

# transform to topojson format
geo2topo geo/states.geojson > geo/states.topojson

toposimplify -S 0.1 -F \
  < geo/states.topojson \
  > geo/states-simple.topojson

topoquantize 1e5 \
  < geo/states-simple.topojson \
  > geo/states-quantized.topojson

# clean up
rm geo/states.ndjson geo/states.topojson geo/states-simple.topojson
mv geo/states-quantized.topojson geo/states.topojson
