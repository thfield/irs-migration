#!/bin/bash
st=${1:-"06"} # california fips code
co=${2:-"075"} # san francisco county fips code

# TODO: rewrite grep strings to only require the countyinflowYYYY.csv files
io=("in" "out")
path="./data"
mkdir -p $path/$st$co

# these years have consistent formatting
years=("1011" "1112" "1213" "1314" "1415")
for year in "${years[@]}"
do
  for direction in "${io[@]}"
  do
    headerfile="$path/raw/county${direction}flow1415.csv"
    input="$path/raw/county${direction}flow$year.csv"
    output="$path/$st$co/$st$co${direction}flow$year.csv"
    head -1 $headerfile > $output
    grep "^$st,$co" $input >> $output
  done
done

# these years have formatting different from previous set
oldyears=("0405" "0506" "0607" "0708" "0809")
for year in "${oldyears[@]}"
do
  for direction in "${io[@]}"
  do
    headerfile="$path/raw/county${direction}flow1415.csv"
    input="$path/raw/county${direction}flow$year.csv"
    output="$path/$st$co/$st$co${direction}flow$year.csv"
    head -1 $headerfile > $output
    grep "^\"$st\",\"$co\"" $input | sed 's/\"//g' >> $output
  done
done

# 0910 year has different formatting between in and out
# remove zero padding on fips codes
nozst=$(echo $st | sed 's/^0*//')
nozco=$(echo $co | sed 's/^0*//')

input0910in="$path/raw/countyinflow0910.csv"
input0910out="$path/raw/countyoutflow0910.csv"
output0910in="$path/$st$co/$st${co}inflow0910.csv"
output0910out="$path/$st$co/$st${co}outflow0910.csv"

head -1 "$path/raw/countyinflow1415.csv" > $output0910in
head -1 "$path/raw/countyoutflow1415.csv" > $output0910out

grep "^$nozst,$nozco" $input0910in \
  | awk -F , '{ printf "%02i,%03i,%02i,%03i,%s,%s,%i,%i,%i\n" ,$1,$2,$3,$4,$5,$6,$7,$8,$9 }' \
  >> $output0910in
grep "^$st,$co" $input0910out \
  | sed 's/\"//g' \
  >> $output0910out

cd munge
node parse-county.js $st $co