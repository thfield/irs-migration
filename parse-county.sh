#!/bin/bash
st=${1:-"06"} # california fips code
co=${2:-"075"} # san francisco county fips code

years=("1112" "1213" "1314" "1415")
io=("in" "out")
for year in "${years[@]}"
do
  for direction in "${io[@]}"
  do
    input="data/raw/county${direction}flow$year.csv"
    output="data/$st$co${direction}flow$year.csv"
    head -1 $input > $output
    grep "^$st,$co" $input >> $output
  done
done

