#!/bin/bash
path="../../data"

mkdir -p $path/pg
rm $path/pg/alldata.csv

headerfile="${path}/raw/countyinflow1415.csv"
header=$(head -1 $headerfile | sed -E 's/^(.+),y[12]_state,y[12]_countyname,(.+)$/fipsIn,fipsOut,\1,\2,year/')
concatted=$path/pg/alldata.csv
echo $header > $concatted

newyears=("1415" "1314" "1213" "1112")
for year in "${newyears[@]}"
do
  input="$path/raw/countyinflow$year.csv"
  sed -E "1d; /^ *$/d; s/^([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*)$/\1\2,\3\4,\1,\2,\3,\4,\7,\8,\9,${year}/" $input >> $concatted
done

middleyears=("1011")
# middleyears=("1011" "0910")
for year in "${middleyears[@]}"
do
  input="$path/raw/countyinflow$year.csv"
  sed -E "1d; /^ *$/d;  s/^([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*)$/\1\2,\3\4,\1,\2,\3,\4,\7,\8,\9,${year}/" $input >> $concatted
done

# 0910 year has different formatting
# add zero padding on fips codes
input0910in="$path/raw/countyinflow0910.csv"
sed '1d' $input0910in | \
  awk -F , '{ printf "%02i,%03i,%02i,%03i,%s,%s,%i,%i,%i\n" ,$1,$2,$3,$4,$5,$6,$7,$8,$9 }' |\
  sed -E "/^ *$/d; s/^([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*)$/\1\2,\3\4,\1,\2,\3,\4,\7,\8,\9,0910/" >> $concatted

# these years have formatting different from previous set
oldyears=("0809" "0708" "0607" "0506" "0405")
for year in "${oldyears[@]}"
do
  input="$path/raw/countyinflow$year.csv"
  sed -E "1d; $d; /^ *$/d; s/\"//g; s/^([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*)$/\1\2,\3\4,\1,\2,\3,\4,\7,\8,\9,${year}/" $input >> $concatted
  # '1d; $d' removes the 1st and last lines
  # first is the header, last is a duplicate blank line
done

echo 'fips,state,statefp,countyfp,name,type' > $path/pg/counties.csv
sed -E 's/^([a-zA-Z]{2}),([0-9]{2}),([0-9]{3}),(.*)$/\2\3,\1,\2,\3,\4/' $path/raw/national_county.txt | tr -d '\r' >> $path/pg/counties.csv

cat ./extrafips.csv >> $path/pg/counties.csv
