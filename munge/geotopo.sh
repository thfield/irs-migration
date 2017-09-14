#!/bin/bash
st=${1:-"06"} # california fips code
co=${2:-"075"} # san francisco county fips code

path="./data"

input="$path/$st$co-shapes.geojson"
output="$path/$st$co-shapes.topojson"

geo2topo features=$input > $output