#!/bin/bash
if [ ! -d "data/raw" ]; then
  mkdir -p data/raw
fi
cd data/raw

# download file passed as 1st param
file=${1:-"data_sources.txt"}

for i in `cat ../../munge/$file` ; do
 if [ -e `basename $i` ]; then
    echo "File exists: $i"
  else
      # echo "File does not exist: $i"
      # iconv converts character encoding from latin-1 that will break `sed` later in the pipeline
      #TODO confirm this works as expected (written while in a coffeeshop with slow internet)
      curl $i | iconv -f iso-8859-1 -t utf-8  > `basename $i`
  fi

done


