# irs-migration

Visualizing taxpayer migration data from the IRS.

The IRS publishes data on migration patterns within the US based on changes in taxpayers' return addresses. For example, there were 3,220 people who filed taxes living in San Mateo, CA in 2014 who then filed taxes living in San Francisco, CA in 2015.  There are some caveats and nitty-gritty to the methodology, which can be found on the [IRS's website](https://www.irs.gov/statistics/soi-tax-stats-migration-data).  

## data source
https://www.irs.gov/statistics/soi-tax-stats-migration-data  
https://www.irs.gov/statistics/soi-tax-stats-migration-data-2014-2015

https://www.census.gov/topics/population/migration/guidance/county-to-county-migration-flows.html
https://www.census.gov/topics/population/migration/data/tables.html

census data
  [2010-2016](https://www2.census.gov/programs-surveys/popest/datasets/2010-2016/counties/totals/co-est2016-alldata.csv)
  [2000-2010](https://www2.census.gov/programs-surveys/popest/datasets/2000-2010/intercensal/county/co-est00int-tot.csv)

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
- get all the data ^
- use webpack:
  - `npm run start`
- map code is in *index.js*


## to add support for a particular county
Say, Manhattan (FIPS code 36 061):
- get all the data ^^
- `irs-migration$ ./munge/parse-county.sh 36 061`
- files are now in `data/36061`:
  - inflow/outflow csvs
  - topojson of destination counties


## TODO
- choose county by map as well as list
- reset map view
- find county with highest # of feeder counties in a year
- show # of in state vs out-of-state migrators
- TODO in `download.sh` having to do with character encoding conversion
- change color scale to some sort of threshold scale (automatic)
- connect centroids with lines
- bumps chart of top (10? 20?) counties year-to-year
- enter/exit morph between circle and county path (too many counties to be reasonable?)
- barchart of migration by state
  - sankey/sunburst/tree? (county-> state-> sf)
- select county to compare over time
- combine gif-munge and gif-create into single node script?
- note: 06075inflowcombined.csv has duplicate rows for cook county IL
- use circles on map instead of coloring counties

### Done
- command line generation of map
  - see `munge/gif-munge.js` and `munge/gif-create.sh`
- separate build dev/dist webpack functionality
- better mouseover tooltip
- zoom map
- line chart of total immigration/emigration year-to-year
- allow user to choose different year
- https://github.com/sequelize/express-example
- http://docs.sequelizejs.com/manual/tutorial/models-definition.html
- https://scotch.io/tutorials/getting-started-with-node-express-and-postgres-using-sequelize


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

To make legend for gifs
1. edit html file `munge/legend.html`
1. change variable `vals` to the contents of `legendValsin.json`/`legendValsin.json`
1. choose desired colorArray
1. open `munge/legend.html` in web browser
1. screenshot


# api
### TODOS
- pg table Lineshapes use JSON datatype
- proper belongsTo/hasMany associations in db
- route lineshapes/{ST} return topjson lineshape for all counties in state (with centerpoint)

## dev scripts
1. make sure postgres db is up  
1. make sure webpack watch is running:
  `yarn run watch`
1. make sure express server is running:
  `yarn run start:dev`

./node_modules/.bin/sequelize db:migrate
./node_modules/.bin/sequelize db:migrate:undo

./node_modules/.bin/sequelize seed:create --name
./node_modules/.bin/sequelize db:seed:all

curl http://localhost:3000/api/migration/06075 > foo/migration06075.csv;
curl http://localhost:3000/api/migration/06075?direction="out" >> foo/migration06075.csv;
curl http://localhost:3000/api/topojson/06075 > foo/06075topo.json

COPY "Migrations"("fipsIn","fipsOut","y2_statefips","y2_countyfips","y1_statefips","y1_countyfips","n1","n2","agi","year") FROM '/Users/tyler/www/irs-migration/data/pg/alldata.csv' DELIMITER ',' CSV HEADER;

COPY "Counties"("fips","state","statefp","countyfp","name","type") FROM '/Users/tyler/www/irs-migration/munge/pg/extrafips.csv' DELIMITER ',' CSV HEADER;