

### TODOS
- pg table Lineshapes use JSON datatype
- proper belongsTo/hasMany associations in db

## dev scripts
yarn run start:dev

./node_modules/.bin/sequelize db:migrate
./node_modules/.bin/sequelize db:migrate:undo

./node_modules/.bin/sequelize seed:create --name
./node_modules/.bin/sequelize db:seed:all

curl http://localhost:3000/migration/06075 > foo/migration06075.csv;
curl http://localhost:3000/migration/06075?direction="out" >> foo/migration06075.csv;
curl http://localhost:3000/topojson/06075 > foo/06075topo.json

COPY "Migrations"("fipsIn","fipsOut","y2_statefips","y2_countyfips","y1_statefips","y1_countyfips","n1","n2","agi","year") FROM '/Users/tyler/www/irs-migration/data/pg/alldata.csv' DELIMITER ',' CSV HEADER;