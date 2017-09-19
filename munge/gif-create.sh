#!/bin/bash
# geo2svg requires NDJSON as input
# run gif-munge.js script before this

st=${1:-"06"} # california fips code
co=${2:-"075"} # san francisco county fips code
direction=${3:-"in"}


years=("0405" "0506" "0607" "0708" "0809" "0910" "1011" "1112" "1213" "1314" "1415")
path="../data/$st${co}"
mkdir -p $path/gif
for year in "${years[@]}"
do
  filename=$st${co}_${year}_$direction
  input="$path/gif/$filename.topojson"
  output="$path/gif/$filename.svg"

  (topo2geo counties=- < $input \
    | ndjson-split 'd.features'; \
  ndjson-split 'd.features' < $path/../geo/states.geojson \
    | ndjson-map 'd.properties = {"stroke": "#000", "stroke-width": 0.5}, d') \
    | geo2svg -n --stroke none -w 960 -h 600 \
      > $output

  convert -fill black -pointsize 48 label:"${year}"  miff:- |\
    composite -gravity south -geometry +0+3 \
              -   ${output}   $path/gif/$filename.png
  rm $output
done

convert -loop 0 -delay 100 $path/gif/$st${co}_0405_$direction.png $path/gif/$st${co}_0506_$direction.png $path/gif/$st${co}_0607_$direction.png $path/gif/$st${co}_0708_$direction.png $path/gif/$st${co}_0809_$direction.png $path/gif/$st${co}_0910_$direction.png $path/gif/$st${co}_1011_$direction.png $path/gif/$st${co}_1112_$direction.png $path/gif/$st${co}_1213_$direction.png $path/gif/$st${co}_1314_$direction.png $path/gif/$st${co}_1415_$direction.png  $path/$st${co}_$direction.gif

# rm $path/gif/*