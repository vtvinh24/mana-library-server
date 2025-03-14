#!/bin/bash

# Loop through each JSON file in /docker-entrypoint-initdb.d/data
for file in /docker-entrypoint-initdb.d/data/*.json; do
  # Use mongoimport to import the JSON file
  mongoimport --host localhost --username $MONGO_INITDB_ROOT_USERNAME --password $MONGO_INITDB_ROOT_PASSWORD --authenticationDatabase admin \
    --db $MONGO_INITDB_DATABASE --file "$file" --jsonArray
done