# irs-migration
Visualizing taxpayer migration data from the IRS

The IRS publishes [data on migration patterns](https://www.irs.gov/statistics/soi-tax-stats-migration-data) within the US based on changes in taxpayers’ return addresses. This is a project centered on visualizing and exploring that data.  

Initially just centering on San Francisco, I'm now working on turning the data-munging steps into an Express-based api to allow for exploration of any county in the US.

This means there are essentially two projects within this one: 
  - a backend api for delivering data
  - a frontend visualization for consuming that data

## data sources
https://www.irs.gov/statistics/soi-tax-stats-migration-data  
https://www.irs.gov/statistics/soi-tax-stats-migration-data-2014-2015

https://www.census.gov/topics/population/migration/guidance/county-to-county-migration-flows.html
https://www.census.gov/topics/population/migration/data/tables.html

census data
  - [2010-2016](https://www2.census.gov/programs-surveys/popest/datasets/2010-2016/counties/totals/co-est2016-alldata.csv)
  - [2000-2010](https://www2.census.gov/programs-surveys/popest/datasets/2000-2010/intercensal/county/co-est00int-tot.csv)


## command line dependencies
- [node](https://nodejs.org/en/)
- [npm](https://www.npmjs.com/)
- [yarn](https://yarnpkg.com/en/)
- [topojson](https://github.com/topojson/topojson)
- [geoprojection](https://github.com/d3/d3-geo-projection)
- [ndjson-cli](https://github.com/mbostock/ndjson-cli)
- [shapefile](https://github.com/mbostock/shapefile)
- [imagemagick](https://www.imagemagick.org/script/command-line-tools.php)

Install missing command line dependencies by following directions on website and something like:
- downloading directly
- `brew install {pkg}`
- `npm install --global {pkg}`
- `yarn global add {pkg}`

## to get all the data
1. [clone this repo](https://help.github.com/articles/cloning-a-repository/)
1. `npm install`
1. `npm run get-data`
1. `npm run atlas`
1. `npm run munge`

## api

### to install
- get the data ^^
- `irs-migration/munge/pg$ ./parse-county-pg.sh`
- `irs-migration/munge/pg$ node getseeddata.js`
- `irs-migration/api$ yarn install` (yes, the backend uses yarn while the frontend uses npm.)
- make sure your db is running
- `irs-migration/api$ ./node_modules/.bin/sequelize db:migrate`
- `irs-migration/api$ ./node_modules/.bin/sequelize db:seed:all`

### to develop
- `irs-migration/api$ yarn run start:dev`

### stack
- [express](http://expressjs.com/)
- [sequelize](http://docs.sequelizejs.com/)
- [postgres](http://postgresql.org)


## visualization
Currently, only focuses on San Francisco and consumes a static file created by `npm run munge`.

### to develop
- get all the data ^^
- use webpack:
  - `npm run start`
- map code is in *index.js*

### dependencies
- [turf js](http://turfjs.org/)
- [d3](http://d3js.org)
- [webpack](https://webpack.js.org/)


### to add support for a particular county
Say, Manhattan (FIPS code 36 061):
- get all the data ^^
- `irs-migration$ ./munge/parse-county.sh 36 061`
- files are now in `data/36061`:
  - inflow/outflow csvs
  - topojson of destination counties


### TODO
- TODO in `download.sh` having to do with character encoding conversion
- change color scale to some sort of threshold scale (automatic)
- connect centroids with lines
- use circles on map instead of coloring counties
  - enter/exit morph between circle and county path
- bumps chart of top (10? 20?) counties year-to-year
- barchart of migration by state
  - sankey/sunburst/tree? (county-> state-> sf)
- select county to compare over time
- combine gif-munge and gif-create into single node script?
- note: 06075inflowcombined.csv has duplicate rows for cook county IL

#### Done
- command line generation of map
  - see `munge/gif-munge.js` and `munge/gif-create.sh`
- separate build dev/dist webpack functionality
- better mouseover tooltip
- zoom map
- line chart of total immigration/emigration year-to-year
- allow user to choose different year


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

## gifs

To make gif of migration into New York County, NY (FIPS code 36061):
1. `irs-migration$ ./munge/parse-county.sh 36 061`
1. `irs-migration$ cd munge`
1. `munge$ node gif-munge.js 36 061 in`
1. `munge$ ./gif-create.sh 36 061 in`

To make legend for gifs
1. edit html file `munge/legend.html`
1. change variable `vals` to the contents of `legendValsin.json`/`legendValsin.json`
1. choose desired colorArray
1. open `munge/legend.html` in web browser
1. screenshot
