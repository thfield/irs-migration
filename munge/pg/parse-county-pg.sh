#!/bin/bash
path="../../data"

mkdir -p $path/pg
rm $path/pg/*.csv

headerfile="${path}/raw/countyinflow1415.csv"
header=$(head -1 $headerfile | sed -E 's/^(.+),y[12]_state,y[12]_countyname,(.+)$/fipsIn,fipsOut,\1,\2,year/')
concatted=$path/pg/alldata.csv
echo $header > $concatted

newyears=("1112" "1213" "1314" "1415")
for year in "${newyears[@]}"
do
  input="$path/raw/countyinflow$year.csv"
  # output="$path/pg/data$year.csv"
  # echo $header > $output
  sed -E "1d; /^ *$/d; s/^([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*)$/\1\2,\3\4,\1,\2,\3,\4,\7,\8,\9,${year}/" $input >> $concatted
done

input1011="$path/raw/countyinflow1011.csv"
# output1011="$path/pg/data1415.csv"
# echo $header > $output1011
sed -E "1d; /^ *$/d;  s/^([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*)$/\1\2,\3\4,\1,\2,\3,\4,\7,\8,\9,${year}/" $input1011 >> $concatted

# these years have formatting different from previous set
oldyears=("0405" "0506" "0607" "0708" "0809")
for year in "${oldyears[@]}"
do
  input="$path/raw/countyinflow$year.csv"
  # output="$path/pg/data$year.csv"
  # echo $header > $output
  sed -E "1d; $d; /^ *$/d; s/\"//g; s/^([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*)$/\1\2,\3\4,\1,\2,\3,\4,\7,\8,\9,${year}/" $input >> $concatted
  # '1d; $d' removes the 1st and last lines
  # first is the header, last is a duplicate blank line
done

# 0910 year has different formatting between in and out
# add zero padding on fips codes
input0910in="$path/raw/countyinflow0910.csv"
# output0910in="$path/pg/data0910.csv"
# echo $header > $output0910in
sed '1d' $input0910in | \
  awk -F , '{ printf "%02i,%03i,%02i,%03i,%s,%s,%i,%i,%i\n" ,$1,$2,$3,$4,$5,$6,$7,$8,$9 }' |\
  sed -E "/^ *$/d; s/^([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*)$/\1\2,\3\4,\1,\2,\3,\4,\7,\8,\9,${year}/" >> $concatted
  
echo 'fips,state,statefp,countyfp,name,type' > $path/pg/counties.csv
sed -E 's/^([a-zA-Z]{2}),([0-9]{2}),([0-9]{3}),(.*)$/\2\3,\1,\2,\3,\4/' $path/raw/national_county.txt | tr -d '\r' >> $path/pg/counties.csv
