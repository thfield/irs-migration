#!/bin/bash
# requires ogr2ogr, node

cd ./data
rm -rvf geo
mkdir -p raw-geo
mkdir -p geo

if [ ! -f raw-geo/cb_2015_us_county_5m.shp ]; then
  curl -o raw-geo/cb_2015_us_county_5m.zip 'https://www2.census.gov/geo/tiger/GENZ2015/shp/cb_2015_us_county_5m.zip'
  unzip raw-geo/cb_2015_us_county_5m.zip -d raw-geo
fi

if [ ! -f raw-geo/cb_2015_us_state_5m.shp ]; then
  curl -o raw-geo/cb_2015_us_state_5m.zip 'https://www2.census.gov/geo/tiger/GENZ2015/shp/cb_2015_us_state_5m.zip'
  unzip raw-geo/cb_2015_us_state_5m.zip -d raw-geo
fi

ogr2ogr -f GeoJSON -t_srs crs:84 geo/counties.geojson raw-geo/cb_2015_us_county_5m.shp
ogr2ogr -f GeoJSON -t_srs crs:84 geo/states.geojson raw-geo/cb_2015_us_state_5m.shp

cd ../munge

node centroids.js