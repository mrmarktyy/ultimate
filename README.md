[![Build Status](https://travis-ci.com/ratecity/ultimate.svg?token=m7geA81NzfGVx94z9ujy&branch=master)](https://travis-ci.com/ratecity/ultimate)

# RateCity Data CMS

## Prerequisites

* NodeJS == 10.16.3 (install [nvm](https://github.com/creationix/nvmhttps://github.com/creationix/nvm) and run `nvm install 10.16.3` )
* MongoDB >= 3.2.0  `brew install mongodb`


## Getting Started

* Clone this project from Github
* Install npm packages `npm install`
* Create .env file in the folder `cp .env.example .env`
* Setup MongoDB replica set as below
* Start the server `npm start`
* Start the server on development mode `npm run dev`
* Visit `http://localhost:4000` to check the website

## Deployment

See [confluence page](https://ratecityconfluence.atlassian.net/wiki/display/IN/Keystone+Setup) for production and deployment details

## DB DUMP

* Get the dump from production

  `mongodump --host "keystone-production-shard-0/keystone-production-shard-00-00-rmvom.mongodb.net:27017,keystone-production-shard-00-01-rmvom.mongodb.net:27017,keystone-production-shard-00-02-rmvom.mongodb.net:27017" --ssl --username admin --password password --out tmp/dump`

  - get password from the admin

* URI for users database

  `mongodump --host "users-production-shard-00-00-rmvom.mongodb.net:27017,users-production-shard-00-01-rmvom.mongodb.net:27017,users-production-shard-00-02-rmvom.mongodb.net:27017" --ssl --username admin --password password --out tmp/dump`

* Restore the dump to your local or remote

  `mongorestore --db ratecity-data tmp/dump/ratecity-data` --drop
