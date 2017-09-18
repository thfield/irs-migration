# irs-migration

Visualizing taxpayer migration data from the IRS

## data source
https://www.irs.gov/statistics/soi-tax-stats-migration-data  
https://www.irs.gov/statistics/soi-tax-stats-migration-data-2014-2015

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
- bumps chart of top (10? 20?) counties year-to-year
- barchart of migration by state
  - sankey/sunburst/tree? (county-> state-> sf)
- allow user to choose different year

### Done
- command line svg generation of map
  - see `munge/svg-munge.js` and `munge/svg-create.sh`