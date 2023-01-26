#!/usr/bin/env bash

cp .env server/.env
composer install -d server/
echo '{}' > server/data.json
mkdir server/databases