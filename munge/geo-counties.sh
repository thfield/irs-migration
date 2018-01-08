#!/bin/bash
# simplified county geojson conversion
# requires:
#   node (nodejs.org)
#   npm (npmjs.org)
#   topojson (https://github.com/topojson/topojson)
#   geoprojection (https://github.com/d3/d3-geo-projection)
#   ndjson-cli (https://github.com/mbostock/ndjson-cli)
#   shapefile (https://github.com/mbostock/shapefile)
# following https://medium.com/@mbostock/command-line-cartography-part-1-897aa8f8ca2c

cd ./data

# ##### county shapefiles #####

# download from census bureau and unzip
if [ ! -f raw-geo/cb_2015_us_county_20m.shp ]; then
  curl -o raw-geo/cb_2015_us_county_20m.zip 'https://www2.census.gov/geo/tiger/GENZ2015/shp/cb_2015_us_county_20m.zip'
  unzip raw-geo/cb_2015_us_county_20m.zip -d raw-geo
fi

# convert to geojson
shp2json raw-geo/cb_2015_us_county_20m.shp -o geo/counties.geojson

# apply projection
geoproject 'd3.geoAlbersUsa()' < geo/counties.geojson > geo/counties-albers.geojson

# turn into NDJSON format
# filter only 50 states + DC
# get rid of extra properties
ndjson-split 'd.features' \
  < geo/counties-albers.geojson \
  | ndjson-filter 'd.properties.STATEFP < 57 && d.properties.STATEFP > 0' \
      | ndjson-map 'd.properties = {statefp:d.properties.STATEFP, countyfp:d.properties.COUNTYFP, geoid:d.properties.GEOID, name:d.properties.NAME}, d' \
          > geo/counties.ndjson

# reformat from ndjson -> geojson
ndjson-reduce \
  < geo/counties.ndjson \
  | ndjson-map '{type: "FeatureCollection", features: d}' \
  > geo/counties.geojson

# transform to topojson format
geo2topo geo/counties.geojson > geo/counties.topojson

# toposimplify -S 0.7 -F \
#   < geo/counties.topojson \
#   > geo/counties-simple.topojson

topoquantize 1e5 \
  < geo/counties.topojson \
  > geo/counties-quantized.topojson

# clean up
mv geo/counties-quantized.topojson geo/counties.topojson
rm geo/counties-albers.geojson geo/counties.ndjson

