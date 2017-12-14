

### TODOS
- pg table Lineshapes use JSON datatype
- proper belongsTo/hasMany associations in db

## dev scripts
yarn run start:dev

./node_modules/.bin/sequelize db:migrate
./node_modules/.bin/sequelize db:migrate:undo

./node_modules/.bin/sequelize seed:create --name
./node_modules/.bin/sequelize db:seed:all



COPY "Migrations"("fipsIn","fipsOut","y2_statefips","y2_countyfips","y1_statefips","y1_countyfips","n1","n2","agi","year") FROM '/Users/tyler/www/irs-migration/data/pg/alldata.csv' DELIMITER ',' CSV HEADER;