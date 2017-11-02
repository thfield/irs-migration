#!/bin/bash
# get county level population estimate data from the census dept

if [ ! `basename $PWD` == "munge" ]; then
  cd munge
fi

mkdir -p ../data/raw-pop

# get 2010-2016 data
data1016='../data/raw-pop/pop2010-2016.csv'
if [ ! -f $data1016 ]; then
  curl https://www2.census.gov/programs-surveys/popest/datasets/2010-2016/counties/totals/co-est2016-alldata.csv | iconv -f iso-8859-1 -t utf-8  > $data1016
fi
cut -f 4-7,10-16 -d ',' $data1016 > ../data/pop2010-2016.csv

# get 2000-2010 data
data0010='../data/raw-pop/pop2000-2010.csv'
if [ ! -f $data0010 ]; then
  curl https://www2.census.gov/programs-surveys/popest/datasets/2000-2010/intercensal/county/co-est00int-tot.csv | iconv -f iso-8859-1 -t utf-8  > $data0010
fi
cut -f 4-7,9-18 -d ',' $data0010 > ../data/pop2000-2010.csv

node population-data.js