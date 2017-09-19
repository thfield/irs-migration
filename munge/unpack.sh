#!/bin/bash
# unpack zipped data after downloading
# use flag -d to delete zipped files
# the zip files from almost every year are formatted differently


path="../data"
allyears=("0405" "0506" "0607" "0708" "0809" "0910")

##### 0809 and 0910
csvyears=("0809" "0910")
for year in "${csvyears[@]}"
do
  unzip $path/raw/county$year.zip countyinflow$year.csv countyoutflow$year.csv -d $path/raw/
  unzip $path/raw/county${year}.zip county_migration${year}.doc -d $path/docs
done

##### 0708
unzip $path/raw/county0708.zip co0708us.dat -d $path/raw/
unzip $path/raw/county0708.zip publicdocumentation2007-2008.doc -d $path/docs/

##### 0506 and 0607
datyears=("0506" "0607")
for year in "${datyears[@]}"
do
  unzip $path/raw/county$year.zip countyin${year}.dat countyout${year}.dat -d $path/raw
done
unzip $path/raw/county0607.zip publicdocumentation2006-2007.doc -d $path/docs
unzip $path/raw/county0506.zip publicdocumentation2005-2006.doc -d $path/docs

##### 0405
unzip $path/raw/county0405.zip countyin0405us1.dat countyout0405us1.dat -d $path/raw

##### delete zips if -d flag set
while getopts ":d" opt; do
  case $opt in
    d)
      for year in "${allyears[@]}"
      do
        rm $path/raw/county$year.zip
      done
      ;;
    \?)
      echo "Invalid option: -$OPTARG" >&2
      ;;
  esac
done

