#!/bin/bash
# geo2svg requires NDJSON as input

st=${1:-"06"} # california fips code
co=${2:-"075"} # san francisco county fips code

years=("1112" "1213" "1314" "1415")
path="../data/$st${co}"
mkdir -p $path/cmd
for year in "${years[@]}"
do
  filename=$st${co}_$year
  input="$path/cmd/$filename.topojson"
  output="$path/cmd/$filename.svg"

  (topo2geo counties=- < $input \
    | ndjson-split 'd.features'; \
  ndjson-split 'd.features' < $path/../geo/states.geojson \
    | ndjson-map 'd.properties = {"stroke": "#000", "stroke-width": 0.5}, d') \
    | geo2svg -n --stroke none -w 960 -h 600 \
      > $output

  convert -fill black -pointsize 48 label:"${year}"  miff:- |\
    composite -gravity south -geometry +0+3 \
              -   ${output}   $path/cmd/$filename.png
  rm $output
done

convert -loop 0 -delay 100 $path/cmd/$st${co}_1112.png $path/cmd/$st${co}_1213.png $path/cmd/$st${co}_1314.png $path/cmd/$st${co}_1415.png  $path/$st${co}.gif

