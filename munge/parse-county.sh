#!/bin/bash
st=${1:-"06"} # california fips code
co=${2:-"075"} # san francisco county fips code

years=("1112" "1213" "1314" "1415")
io=("in" "out")
path="./data"
mkdir -p $path/$st$co
for year in "${years[@]}"
do
  for direction in "${io[@]}"
  do
    input="$path/raw/county${direction}flow$year.csv"
    output="$path/$st$co/$st$co${direction}flow$year.csv"
    head -1 $input > $output
    grep "^$st,$co" $input >> $output
  done
done

cd munge
node parse-county.js $st $co