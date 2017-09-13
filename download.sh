#!/bin/bash
if [ ! -d "data/raw" ]; then
  mkdir -p data/raw
fi
cd data/raw

# download file passed as 1st param
file=${1:-"data_sources.txt"}

for i in `cat ../../$file` ; do
 if [ -e `basename $i` ]; then
    echo "File exists: $i"
  else
      echo "File does not exist: $i"
      curl -O $i
  fi
done


