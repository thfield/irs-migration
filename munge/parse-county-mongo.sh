#!/bin/bash
path="../data"

mkdir -p $path/mongo
rm $path/mongo/*.csv


newyears=("1112" "1213" "1314" "1415")
for year in "${newyears[@]}"
do
  input="$path/raw/countyinflow$year.csv"
  output="$path/mongo/data$year.csv"
  cp $input $output
done

input1011="$path/raw/countyinflow1011.csv"
output1011="$path/mongo/data1011.csv"
head -1 $path/raw/countyinflow1415.csv > $output1011
sed '1d' $input1011 >> $output1011

# these years have formatting different from previous set
oldyears=("0405" "0506" "0607" "0708" "0809")
for year in "${oldyears[@]}"
do
  headerfile="$path/raw/countyinflow1415.csv"
  input="$path/raw/countyinflow$year.csv"
  output="$path/mongo/data$year.csv"
  head -1 $headerfile > $output
  sed '1d' $input | sed 's/\"//g' >> $output
done

# 0910 year has different formatting between in and out
# remove zero padding on fips codes
input0910in="$path/raw/countyinflow0910.csv"
output0910in="$path/mongo/data0910.csv"
head -1 "$path/raw/countyinflow1415.csv" > $output0910in
sed '1d' $input0910in | \
  awk -F , '{ printf "%02i,%03i,%02i,%03i,%s,%s,%i,%i,%i\n" ,$1,$2,$3,$4,$5,$6,$7,$8,$9 }' >> $output0910in

