#!/usr/bin/env bash

cp .env server/.env
composer update -d server/
echo '{}' > server/data.json
mkdir server/databases