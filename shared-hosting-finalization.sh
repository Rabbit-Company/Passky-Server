#!/usr/bin/env bash

composer update -d server/
echo '{}' > server/data.json
mkdir server/databases