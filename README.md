# irs-migration

Visualizing taxpayer migration data from the IRS

## data source
https://www.irs.gov/statistics/soi-tax-stats-migration-data  
https://www.irs.gov/statistics/soi-tax-stats-migration-data-2014-2015

https://www.census.gov/topics/population/migration/guidance/county-to-county-migration-flows.html
https://www.census.gov/topics/population/migration/data/tables.html

## command line dependencies
- [node](https://nodejs.org/en/)
- [npm](https://www.npmjs.com/)
- [topojson](https://github.com/topojson/topojson)
- [geoprojection](https://github.com/d3/d3-geo-projection)
- [ndjson-cli](https://github.com/mbostock/ndjson-cli)
- [shapefile](https://github.com/mbostock/shapefile)
- [imagemagick](https://www.imagemagick.org/script/command-line-tools.php)


## to get all the data
1. `npm install`
1. `npm run get-data`
1. `npm run atlas`
1. `npm run munge`


## to develop
- get the data ^
- use webpack:
  - `npm run start`
- map code is in *index.js*


## TODO
- separate build dev/dist webpack functionality
- better mouseover tooltip
- connect centroids with lines
- zoom map
- use circles on map instead of coloring counties
  - enter/exit morph between circle and county path
- line chart of total immigration/emigration year-to-year
- bumps chart of top (10? 20?) counties year-to-year
- barchart of migration by state
  - sankey/sunburst/tree? (county-> state-> sf)
- allow user to choose different year
- combine gif-munge and gif-create into single node script?

### Done
- command line generation of map
  - see `munge/gif-munge.js` and `munge/gif-create.sh`



## FIPS ref
California 06
- 075 San Francisco
- 001 Alameda (Oakland, Berkeley, East Bay)
- 041 Marin
- 081 San Mateo (Silicon Valley)
- 097 Sonoma
- 055 Napa
- 013 Contra Costa
- 085 Santa Clara
- 087 Santa Cruz
-	095 Solano

New York 36
- 005 Bronx
- 047 Kings (Brooklyn)
- 061 New York (Manhattan)
- 081 Queens
- 085 Richmond (Staten Island)

Texas 48
- 201 Harris (Houston)
- 029 Bexar (San Antonio)
- 113 Dallas
- 453 Travis (Austin)
- 457 Tyler

Illinois 17
- 031 Cook (Chicago)
- 019 Champaign

Virginia 51
- 770 Roanoke City
- 161 Roanoke County
- 760 Richmond City
- 159 Richmond County

Washington, DC 11 001

To make gif of migration into New York County, NY (FIPS code 36061):
1. `irs-migration$ ./munge/parse-county.sh 36 061`
1. `irs-migration$ cd munge`
1. `munge$ node gif-munge.js 36 061 in`
1. `munge$ ./gif-create.sh 36 061 in`
